import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FieldEncryptionService } from '../../security/field-encryption.service';
import { PasswordHasherService } from '../../security/password-hasher.service';
import { DomainAuditService } from '../audit-logs/domain-audit.service';
import { BranchesService } from '../branches/branches.service';
import { EmailService } from '../../integrations/email/email.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';

describe('UsersService', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';

  let service: UsersService;
  let prisma: jest.Mocked<Pick<PrismaService, 'user' | 'role' | '$transaction'>>;
  let audit: { recordEvent: jest.Mock };
  let notifications: { notify: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      } as unknown as jest.Mocked<PrismaService>['user'],
      role: { findFirst: jest.fn() } as unknown as jest.Mocked<PrismaService>['role'],
      $transaction: jest.fn(),
    };
    audit = { recordEvent: jest.fn() };
    notifications = { notify: jest.fn() };

    service = new UsersService(
      prisma as unknown as PrismaService,
      {
        encrypt: jest.fn((v: string) => `enc:${v}`),
        hashForLookup: jest.fn((v: string) => `hash:${v}`),
      } as unknown as FieldEncryptionService,
      { hash: jest.fn(), verify: jest.fn() } as unknown as PasswordHasherService,
      audit as unknown as DomainAuditService,
      { ensureAssignableBranch: jest.fn() } as unknown as BranchesService,
      { isEnabled: jest.fn().mockReturnValue(false), send: jest.fn() } as unknown as EmailService,
      { get: jest.fn() } as unknown as ConfigService,
      notifications as unknown as NotificationsService,
    );
  });

  it('findOne returns not found when user belongs to another tenant', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(tenantA, 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1', tenantId: tenantA },
      }),
    );
  });

  it('findAll scopes query to tenantId', async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(0);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    await service.findAll(tenantB, { page: 1, limit: 20 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: tenantB }),
      }),
    );
  });

  it('updateStatus emits user status notification', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'user-1', tenantId: tenantA });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'User',
      status: 'DISABLED',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      branch: null,
      employeeProfile: null,
      userRoles: [],
    });

    await service.updateStatus(tenantA, 'user-1', 'DISABLED' as never, 'actor-1');

    expect(audit.recordEvent).toHaveBeenCalledWith(
      'USER_DISABLED',
      expect.objectContaining({ tenantId: tenantA, targetUserId: 'user-1' }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: tenantA,
        userId: 'user-1',
        type: 'user.status_changed',
      }),
    );
  });
});
