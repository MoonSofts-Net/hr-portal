import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HRRequestStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FieldEncryptionService } from '../../security/field-encryption.service';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { ok } from '../../common/utils/api-response.util';
import { maskCpfFromDigits } from '../../common/utils/cpf-mask.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  STORAGE_SERVICE,
  StorageService,
} from '../../storage/interfaces/storage-service.interface';
import { NotificationsService } from '../notifications/notifications.service';

const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldEncryption: FieldEncryptionService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async getMyProfile(tenantId: string, user: AuthenticatedUser) {
    const dbUser = await this.prisma.user.findFirst({
      where: { id: user.userId, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        branch: { select: { id: true, code: true, name: true } },
        tenant: { select: { id: true, name: true } },
        employeeProfile: {
          select: {
            department: true,
            jobTitle: true,
            hireDate: true,
            birthDate: true,
            cpfEncrypted: true,
            phoneEncrypted: true,
            addressEncrypted: true,
          },
        },
      },
    });
    if (!dbUser) throw new NotFoundException('User not found');

    const profile = dbUser.employeeProfile;
    let cpfMasked: string | undefined;
    if (profile?.cpfEncrypted) {
      try {
        const digits = this.fieldEncryption.decrypt(profile.cpfEncrypted);
        cpfMasked = maskCpfFromDigits(digits);
      } catch {
        cpfMasked = undefined;
      }
    }

    const [pendingRequests, openRequests] = await Promise.all([
      this.prisma.hRRequest.count({
        where: {
          tenantId,
          requesterId: user.userId,
          status: { in: [HRRequestStatus.OPEN, HRRequestStatus.IN_PROGRESS, HRRequestStatus.WAITING_EMPLOYEE] },
        },
      }),
      this.prisma.hRRequest.findMany({
        where: { tenantId, requesterId: user.userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return ok({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      status: dbUser.status,
      createdAt: dbUser.createdAt,
      lastLoginAt: dbUser.lastLoginAt,
      branch: dbUser.branch,
      company: dbUser.tenant,
      department: profile?.department,
      jobTitle: profile?.jobTitle,
      hireDate: profile?.hireDate,
      birthDate: profile?.birthDate,
      cpfMasked,
      phone: profile?.phoneEncrypted
        ? this.safeDecrypt(profile.phoneEncrypted)
        : undefined,
      address: profile?.addressEncrypted
        ? this.safeDecrypt(profile.addressEncrypted)
        : undefined,
      pendingRequestsCount: pendingRequests,
      recentRequests: openRequests,
    });
  }

  async updateMyProfile(
    tenantId: string,
    user: AuthenticatedUser,
    dto: UpdateProfileDto,
  ) {
    const exists = await this.prisma.user.findFirst({
      where: { id: user.userId, tenantId },
    });
    if (!exists) throw new NotFoundException('User not found');

    if (dto.name) {
      await this.prisma.user.update({
        where: { id: user.userId },
        data: { name: dto.name.trim() },
      });
    }

    if (dto.phone !== undefined || dto.address !== undefined) {
      await this.prisma.employeeProfile.update({
        where: { userId: user.userId },
        data: {
          ...(dto.phone !== undefined
            ? { phoneEncrypted: this.fieldEncryption.encrypt(dto.phone) }
            : {}),
          ...(dto.address !== undefined
            ? { addressEncrypted: this.fieldEncryption.encrypt(dto.address) }
            : {}),
        },
      });
    }

    await this.notifications.notify({
      tenantId,
      userId: user.userId,
      type: 'profile.updated',
      category: 'profile',
      messageKey: 'notifications.profile.updated',
      actorUserId: user.userId,
      metadata: {
        updatedFields: Object.keys(dto).filter((key) => (dto as Record<string, unknown>)[key] !== undefined),
      },
      title: 'Perfil atualizado',
      body: 'Seus dados de perfil foram atualizados.',
      link: '/profile',
      dedupeWindowSeconds: 10,
    });

    return this.getMyProfile(tenantId, user);
  }

  async uploadAvatar(
    tenantId: string,
    user: AuthenticatedUser,
    file: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Avatar file is required');
    }
    if (!AVATAR_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Avatar must be JPEG, PNG, or WebP');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Avatar must be under 2 MB');
    }

    const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';

    const uploadResult = await this.storage.uploadFile({
      tenantId,
      documentId: `avatar-${user.userId}`,
      version: 1,
      filename: `avatar.${ext}`,
      contentType: file.mimetype,
      body: file.buffer,
    });

    const signed = await this.storage.getSignedDownloadUrl({
      storageKey: uploadResult.storageKey,
      filename: `avatar.${ext}`,
      contentType: file.mimetype,
      expiresInSeconds: 60 * 60 * 24 * 7,
    });

    await this.prisma.user.update({
      where: { id: user.userId },
      data: { avatarUrl: signed.url },
    });

    await this.notifications.notify({
      tenantId,
      userId: user.userId,
      type: 'profile.avatar_updated',
      category: 'profile',
      messageKey: 'notifications.profile.avatarUpdated',
      actorUserId: user.userId,
      metadata: { avatarUpdated: true },
      title: 'Foto de perfil atualizada',
      body: 'Sua foto de perfil foi atualizada.',
      link: '/profile',
      dedupeWindowSeconds: 10,
    });

    return ok({ avatarUrl: signed.url });
  }

  private safeDecrypt(value: string): string | undefined {
    try {
      return this.fieldEncryption.decrypt(value);
    } catch {
      return undefined;
    }
  }
}
