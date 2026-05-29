import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStatus, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  STORAGE_SERVICE,
  StorageService,
} from '../../storage/interfaces/storage-service.interface';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, buildOrderBy, resolvePagination } from '../../common/utils/pagination.util';
import { sanitizeFilename } from '../../storage/utils/filename-sanitize.util';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { DomainAuditService } from '../audit-logs/domain-audit.service';
import { PermissionsResolverService } from '../auth/services/permissions-resolver.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { RequestDownloadUrlDto } from './dto/request-download-url.dto';
import { FileValidationService } from './services/file-validation.service';
import { DocumentAccessService } from './services/document-access.service';
import { VIRUS_SCANNER, VirusScanner } from './services/virus-scan.service';

const SORT_FIELDS: Record<string, string> = {
  createdAt: 'createdAt',
  uploadedAt: 'uploadedAt',
  name: 'name',
  status: 'status',
};

const documentSelect = {
  id: true,
  tenantId: true,
  userId: true,
  name: true,
  category: true,
  status: true,
  accessLevel: true,
  currentVersion: true,
  mimeType: true,
  sizeBytes: true,
  expiresAt: true,
  rejectionReason: true,
  uploadedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.DocumentSelect;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: DomainAuditService,
    private readonly access: DocumentAccessService,
    private readonly fileValidation: FileValidationService,
    private readonly permissions: PermissionsResolverService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(VIRUS_SCANNER) private readonly virusScanner: VirusScanner,
  ) {}

  async upload(
    tenantId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    user: AuthenticatedUser,
  ) {
    this.fileValidation.validate(file);
    const ownerId = dto.userId ?? user.userId;
    this.access.assertCanWrite(null, user, ownerId);

    const scan = await this.virusScanner.scan(file.buffer, file.originalname);
    if (!scan.clean) {
      throw new BadRequestException('File failed security scan');
    }

    const safeName = sanitizeFilename(dto.name ?? file.originalname);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const document = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          tenantId,
          userId: ownerId,
          name: safeName,
          category: dto.category,
          accessLevel: dto.accessLevel ?? 'PRIVATE',
          status: DocumentStatus.SUBMITTED,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedAt: new Date(),
          currentVersion: 1,
        },
      });

      const uploadResult = await this.storage.uploadFile({
        tenantId,
        documentId: doc.id,
        version: 1,
        filename: safeName,
        body: file.buffer,
        contentType: file.mimetype,
      });

      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          storageKey: uploadResult.storageKey,
          originalFilename: safeName,
          mimeType: file.mimetype,
          sizeBytes: uploadResult.sizeBytes,
          checksum,
          uploadedBy: user.userId,
        },
      });

      if (dto.category === 'ONBOARDING') {
        await this.linkOnboardingSubmission(tx, tenantId, doc.id, ownerId);
      }

      return doc;
    });

    await this.audit.recordEvent('DOCUMENT_UPLOADED', {
      tenantId,
      actorUserId: user.userId,
      targetUserId: ownerId,
      entityId: document.id,
      metadata: { version: 1, category: dto.category, sizeBytes: file.size },
    });

    return this.findOne(tenantId, document.id, user);
  }

  async findAll(tenantId: string, query: ListDocumentsQueryDto, user: AuthenticatedUser) {
    const { page, limit, skip, take, sortOrder } = resolvePagination(query);
    const canViewAll = this.permissions.hasAny(
      ['documents.approve'],
      user.permissionIds,
    );

    const where: Prisma.DocumentWhereInput = {
      tenantId,
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(canViewAll
        ? query.userId
          ? { userId: query.userId }
          : {}
        : { userId: user.userId }),
    };

    const [total, rows] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(query.sortBy, sortOrder, SORT_FIELDS, 'createdAt'),
        select: documentSelect,
      }),
    ]);

    const data = rows.filter((doc) => this.access.canRead(doc, user));
    return paginated(data, buildMeta(total, page, limit));
  }

  async findOne(tenantId: string, id: string, user: AuthenticatedUser) {
    const doc = await this.getActiveDocument(tenantId, id);
    this.access.assertCanRead(doc, user);

    const full = await this.prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...documentSelect,
        versions: {
          orderBy: { version: 'desc' },
          select: {
            id: true,
            version: true,
            originalFilename: true,
            mimeType: true,
            sizeBytes: true,
            checksum: true,
            createdAt: true,
            uploadedBy: true,
          },
        },
      },
    });

    return ok(full);
  }

  async addVersion(
    tenantId: string,
    documentId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    this.fileValidation.validate(file);
    const doc = await this.getActiveDocument(tenantId, documentId);
    this.access.assertCanWrite(doc, user, doc.userId);

    const scan = await this.virusScanner.scan(file.buffer, file.originalname);
    if (!scan.clean) {
      throw new BadRequestException('File failed security scan');
    }

    const nextVersion = doc.currentVersion + 1;
    const safeName = sanitizeFilename(file.originalname);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const uploadResult = await this.storage.uploadFile({
      tenantId,
      documentId,
      version: nextVersion,
      filename: safeName,
      body: file.buffer,
      contentType: file.mimetype,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.documentVersion.create({
        data: {
          documentId,
          version: nextVersion,
          storageKey: uploadResult.storageKey,
          originalFilename: safeName,
          mimeType: file.mimetype,
          sizeBytes: uploadResult.sizeBytes,
          checksum,
          uploadedBy: user.userId,
        },
      });

      await tx.document.update({
        where: { id: documentId },
        data: {
          currentVersion: nextVersion,
          mimeType: file.mimetype,
          sizeBytes: uploadResult.sizeBytes,
          uploadedAt: new Date(),
          status: DocumentStatus.SUBMITTED,
          rejectionReason: null,
        },
      });
    });

    await this.audit.recordEvent('DOCUMENT_UPLOADED', {
      tenantId,
      actorUserId: user.userId,
      targetUserId: doc.userId,
      entityId: documentId,
      metadata: { event: 'version_created', version: nextVersion },
    });

    return this.findOne(tenantId, documentId, user);
  }

  async listVersions(tenantId: string, documentId: string, user: AuthenticatedUser) {
    const doc = await this.getActiveDocument(tenantId, documentId);
    this.access.assertCanRead(doc, user);

    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        originalFilename: true,
        mimeType: true,
        sizeBytes: true,
        checksum: true,
        createdAt: true,
        uploadedBy: true,
      },
    });

    return ok(versions);
  }

  async requestDownloadUrl(
    tenantId: string,
    documentId: string,
    dto: RequestDownloadUrlDto,
    user: AuthenticatedUser,
  ) {
    const doc = await this.getActiveDocument(tenantId, documentId);
    this.access.assertCanRead(doc, user);

    if (!this.permissions.hasAny(['documents.download'], user.permissionIds)) {
      throw new ForbiddenException('Download permission required');
    }

    const versionRow = await this.prisma.documentVersion.findFirst({
      where: {
        documentId,
        version: dto.version ?? doc.currentVersion,
      },
    });
    if (!versionRow) throw new NotFoundException('Document version not found');

    const maxExpiry = 3600;
    const requested = dto.expiresInSeconds ?? this.config.get<number>('documents.signedUrlExpirySeconds', 300);
    const expiresInSeconds = Math.min(requested, maxExpiry);

    const signed = await this.storage.getSignedDownloadUrl({
      storageKey: versionRow.storageKey,
      expiresInSeconds,
      filename: versionRow.originalFilename ?? undefined,
    });

    await this.audit.recordEvent('DOCUMENT_DOWNLOADED', {
      tenantId,
      actorUserId: user.userId,
      targetUserId: doc.userId,
      entityId: documentId,
      metadata: { version: versionRow.version, expiresAt: signed.expiresAt.toISOString() },
    });

    return ok({
      documentId,
      version: versionRow.version,
      downloadUrl: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
    });
  }

  async approve(tenantId: string, documentId: string, user: AuthenticatedUser) {
    this.access.assertCanApprove(user);
    const doc = await this.getActiveDocument(tenantId, documentId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const d = await tx.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.APPROVED,
          rejectionReason: null,
        },
        select: documentSelect,
      });

      await tx.onboardingDocumentSubmission.updateMany({
        where: { documentId, tenantId },
        data: { status: DocumentStatus.APPROVED, reviewedAt: new Date() },
      });

      return d;
    });

    await this.audit.recordEvent('DOCUMENT_APPROVED', {
      tenantId,
      actorUserId: user.userId,
      targetUserId: doc.userId,
      entityId: documentId,
      metadata: { status: DocumentStatus.APPROVED },
    });

    return ok(updated);
  }

  async reject(
    tenantId: string,
    documentId: string,
    rejectionReason: string,
    user: AuthenticatedUser,
  ) {
    this.access.assertCanApprove(user);
    const doc = await this.getActiveDocument(tenantId, documentId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const d = await tx.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.REJECTED,
          rejectionReason,
        },
        select: documentSelect,
      });

      await tx.onboardingDocumentSubmission.updateMany({
        where: { documentId, tenantId },
        data: {
          status: DocumentStatus.REJECTED,
          rejectionReason,
          reviewedAt: new Date(),
        },
      });

      return d;
    });

    await this.audit.recordEvent('DOCUMENT_REJECTED', {
      tenantId,
      actorUserId: user.userId,
      targetUserId: doc.userId,
      entityId: documentId,
      metadata: { rejectionReason },
    });

    return ok(updated);
  }

  async softDelete(tenantId: string, documentId: string, user: AuthenticatedUser) {
    const doc = await this.getActiveDocument(tenantId, documentId);
    this.access.assertCanDelete(doc, user);

    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      select: { storageKey: true },
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date(), status: DocumentStatus.EXPIRED },
    });

    for (const v of versions) {
      await this.storage.deleteFile(v.storageKey).catch(() => undefined);
    }

    await this.audit.recordEvent('DOCUMENT_DELETED', {
      tenantId,
      actorUserId: user.userId,
      targetUserId: doc.userId,
      entityId: documentId,
    });

    return ok({ deleted: true, id: documentId });
  }

  private async getActiveDocument(tenantId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private documentResource(documentId: string): string {
    return `document:${documentId}`;
  }

  private async linkOnboardingSubmission(
    tx: Prisma.TransactionClient,
    tenantId: string,
    documentId: string,
    userId: string,
  ) {
    const process = await tx.onboardingProcess.findFirst({
      where: { tenantId, userId, status: { in: ['DRAFT', 'IN_REVIEW', 'SUBMITTED'] } },
    });
    if (!process) return;

    const pending = await tx.onboardingDocumentSubmission.findFirst({
      where: {
        tenantId,
        processId: process.id,
        documentId: null,
        status: DocumentStatus.PENDING,
      },
    });
    if (pending) {
      await tx.onboardingDocumentSubmission.update({
        where: { id: pending.id },
        data: { documentId, status: DocumentStatus.SUBMITTED, submittedAt: new Date() },
      });
    }
  }
}
