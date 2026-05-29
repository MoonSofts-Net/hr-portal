import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingStatus, Prisma } from '@prisma/client';
import { AuditEventKey } from '../audit-logs/audit-event.catalog';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, buildOrderBy, resolvePagination } from '../../common/utils/pagination.util';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { PermissionsResolverService } from '../auth/services/permissions-resolver.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { ListOnboardingQueryDto } from './dto/list-onboarding-query.dto';
import { DomainAuditService } from '../audit-logs/domain-audit.service';

const SORT_FIELDS: Record<string, string> = {
  createdAt: 'createdAt',
  status: 'status',
  updatedAt: 'updatedAt',
};

const includeDetail = {
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true } },
  submissions: {
    include: {
      requirement: { select: { code: true, label: true, isRequired: true } },
      document: { select: { id: true, name: true, status: true } },
    },
  },
} satisfies Prisma.OnboardingProcessInclude;

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: DomainAuditService,
    private readonly permissions: PermissionsResolverService,
  ) {}

  async findAll(tenantId: string, query: ListOnboardingQueryDto, user: AuthenticatedUser) {
    const { page, limit, skip, take, sortOrder } = resolvePagination(query);
    const isHr = this.permissions.hasAny(['onboarding.approve'], user.permissionIds);

    const where: Prisma.OnboardingProcessWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    if (!isHr) {
      where.userId = user.userId;
    }

    const [total, items] = await Promise.all([
      this.prisma.onboardingProcess.count({ where }),
      this.prisma.onboardingProcess.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(query.sortBy, sortOrder, SORT_FIELDS, 'createdAt'),
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return paginated(items, buildMeta(total, page, limit));
  }

  async findOne(tenantId: string, id: string, user: AuthenticatedUser) {
    const process = await this.getProcessOrThrow(tenantId, id);
    this.assertCanAccess(process, user);
    const full = await this.prisma.onboardingProcess.findFirst({
      where: { id, tenantId },
      include: includeDetail,
    });
    return ok(full);
  }

  async create(tenantId: string, dto: CreateOnboardingDto, user: AuthenticatedUser) {
    const targetUserId = dto.userId ?? user.userId;
    if (targetUserId !== user.userId) {
      this.assertHr(user);
    }

    const existing = await this.prisma.onboardingProcess.findFirst({
      where: {
        tenantId,
        userId: targetUserId,
        status: { in: [OnboardingStatus.DRAFT, OnboardingStatus.SUBMITTED, OnboardingStatus.IN_REVIEW] },
      },
    });
    if (existing) {
      throw new BadRequestException('User already has an active onboarding process');
    }

    const requirements = await this.prisma.onboardingDocumentRequirement.findMany({
      where: { tenantId, isActive: true },
    });

    const process = await this.prisma.$transaction(async (tx) => {
      const created = await tx.onboardingProcess.create({
        data: {
          tenantId,
          userId: targetUserId,
          status: OnboardingStatus.DRAFT,
          notes: dto.notes,
        },
      });

      for (const req of requirements) {
        await tx.onboardingDocumentSubmission.create({
          data: {
            tenantId,
            processId: created.id,
            requirementId: req.id,
          },
        });
      }

      return created;
    });

    return this.findOne(tenantId, process.id, user);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateOnboardingDto,
    user: AuthenticatedUser,
  ) {
    const process = await this.getProcessOrThrow(tenantId, id);
    this.assertOwnerDraft(process, user);

    const updated = await this.prisma.onboardingProcess.update({
      where: { id },
      data: { notes: dto.notes },
      include: includeDetail,
    });

    return ok(updated);
  }

  async submit(tenantId: string, id: string, user: AuthenticatedUser) {
    const process = await this.getProcessOrThrow(tenantId, id);
    this.assertOwnerDraft(process, user);

    if (process.status !== OnboardingStatus.DRAFT) {
      throw new BadRequestException('Only draft onboarding can be submitted');
    }

    const updated = await this.prisma.onboardingProcess.update({
      where: { id },
      data: {
        status: OnboardingStatus.IN_REVIEW,
        submittedAt: new Date(),
        progressPercent: 100,
      },
      include: includeDetail,
    });

    await this.logOnboarding(tenantId, user.userId, process.userId, id, 'ONBOARDING_SUBMITTED', {
      status: OnboardingStatus.IN_REVIEW,
    });

    return ok(updated);
  }

  async approve(tenantId: string, id: string, user: AuthenticatedUser) {
    this.assertHr(user);
    const process = await this.getProcessOrThrow(tenantId, id);

    if (process.userId === user.userId) {
      throw new ForbiddenException('Cannot approve your own onboarding');
    }

    const reviewable: OnboardingStatus[] = [
      OnboardingStatus.SUBMITTED,
      OnboardingStatus.IN_REVIEW,
    ];
    if (!reviewable.includes(process.status)) {
      throw new BadRequestException('Onboarding is not pending review');
    }

    const updated = await this.prisma.onboardingProcess.update({
      where: { id },
      data: {
        status: OnboardingStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: user.userId,
        rejectionReason: null,
      },
      include: includeDetail,
    });

    await this.logOnboarding(tenantId, user.userId, process.userId, id, 'ONBOARDING_APPROVED', {
      status: OnboardingStatus.APPROVED,
    });

    return ok(updated);
  }

  async reject(
    tenantId: string,
    id: string,
    rejectionReason: string,
    user: AuthenticatedUser,
  ) {
    this.assertHr(user);
    const process = await this.getProcessOrThrow(tenantId, id);

    const reviewable: OnboardingStatus[] = [
      OnboardingStatus.SUBMITTED,
      OnboardingStatus.IN_REVIEW,
    ];
    if (!reviewable.includes(process.status)) {
      throw new BadRequestException('Onboarding is not pending review');
    }

    const updated = await this.prisma.onboardingProcess.update({
      where: { id },
      data: {
        status: OnboardingStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: user.userId,
        rejectionReason,
      },
      include: includeDetail,
    });

    await this.logOnboarding(tenantId, user.userId, process.userId, id, 'ONBOARDING_REJECTED', {
      rejectionReason,
    });

    return ok(updated);
  }

  async getHistory(tenantId: string, id: string, user: AuthenticatedUser) {
    const process = await this.getProcessOrThrow(tenantId, id);
    this.assertCanAccess(process, user);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'onboarding',
        entityId: id,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        actorUserId: true,
        targetUserId: true,
        metadata: true,
        createdAt: true,
      },
    });

    return ok(logs);
  }

  private async getProcessOrThrow(tenantId: string, id: string) {
    const process = await this.prisma.onboardingProcess.findFirst({
      where: { id, tenantId },
    });
    if (!process) throw new NotFoundException('Onboarding not found');
    return process;
  }

  private assertCanAccess(
    process: { userId: string; status: OnboardingStatus },
    user: AuthenticatedUser,
  ) {
    const isOwner = process.userId === user.userId;
    const isHr = this.permissions.hasAny(['onboarding.approve'], user.permissionIds);
    if (!isOwner && !isHr) {
      throw new ForbiddenException('Access denied');
    }
  }

  private assertOwnerDraft(
    process: { userId: string; status: OnboardingStatus },
    user: AuthenticatedUser,
  ) {
    if (process.userId !== user.userId) {
      throw new ForbiddenException('Only the employee can edit draft onboarding');
    }
    if (process.status !== OnboardingStatus.DRAFT) {
      throw new BadRequestException('Onboarding is no longer editable');
    }
  }

  private assertHr(user: AuthenticatedUser) {
    if (!this.permissions.hasAny(['onboarding.approve'], user.permissionIds)) {
      throw new ForbiddenException('HR approval permission required');
    }
  }

  private async logOnboarding(
    tenantId: string,
    actorUserId: string,
    targetUserId: string,
    processId: string,
    eventKey: AuditEventKey,
    metadata?: Record<string, unknown>,
  ) {
    await this.audit.recordEvent(eventKey, {
      tenantId,
      actorUserId,
      targetUserId,
      entityId: processId,
      metadata: metadata as never,
    });
  }
}
