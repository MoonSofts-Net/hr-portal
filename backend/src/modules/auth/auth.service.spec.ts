import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FieldEncryptionService } from '../../security/field-encryption.service';
import { PasswordHasherService } from '../../security/password-hasher.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PermissionsResolverService } from './services/permissions-resolver.service';
import { DomainAuditService } from '../audit-logs/domain-audit.service';
import { ResendIntegration } from '../../integrations/resend/resend.integration';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock; update: jest.Mock };
    employeeProfile: { findFirst: jest.Mock };
  };
  let passwordHasher: { verify: jest.Mock };
  let audit: { recordEvent: jest.Mock };
  let tokenService: {
    signAccessToken: jest.Mock;
    signRefreshToken: jest.Mock;
    getAccessExpiresInSeconds: jest.Mock;
  };
  let sessionService: { createSessionId: jest.Mock; persistRefreshToken: jest.Mock };

  const activeUser = {
    id: 'user-1',
    email: 'user@test.com',
    name: 'User',
    status: 'ACTIVE',
    tenantId: 'tenant-1',
    passwordHash: 'hash',
    mfaEnabled: false,
    tenant: { id: 'tenant-1', name: 'Tenant', slug: 'tenant' },
    userRoles: [{ role: { id: 'role-1', name: 'Employee' } }],
  };

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn() },
      employeeProfile: { findFirst: jest.fn() },
    };
    passwordHasher = { verify: jest.fn() };
    audit = { recordEvent: jest.fn() };
    tokenService = {
      signAccessToken: jest.fn().mockResolvedValue('access'),
      signRefreshToken: jest.fn().mockResolvedValue('refresh'),
      getAccessExpiresInSeconds: jest.fn().mockReturnValue(900),
    };
    sessionService = {
      createSessionId: jest.fn().mockReturnValue('sid-1'),
      persistRefreshToken: jest.fn(),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      { get: jest.fn() } as unknown as ConfigService,
      { hashForLookup: jest.fn() } as unknown as FieldEncryptionService,
      passwordHasher as unknown as PasswordHasherService,
      tokenService as unknown as TokenService,
      sessionService as unknown as SessionService,
      { resolveForRole: jest.fn().mockResolvedValue(['users.read']) } as unknown as PermissionsResolverService,
      audit as unknown as DomainAuditService,
      { isEnabled: jest.fn().mockReturnValue(false), send: jest.fn() } as unknown as ResendIntegration,
    );
  });

  it('records LOGIN_FAILURE and throws on invalid password', async () => {
    prisma.user.findFirst.mockResolvedValue(activeUser);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(
      service.login({ identifier: 'user@test.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(audit.recordEvent).toHaveBeenCalledWith(
      'LOGIN_FAILURE',
      expect.objectContaining({ tenantId: 'tenant-1', actorUserId: 'user-1' }),
    );
  });

  it('records LOGIN_SUCCESS on valid credentials', async () => {
    prisma.user.findFirst.mockResolvedValue(activeUser);
    passwordHasher.verify.mockResolvedValue(true);
    prisma.user.update.mockResolvedValue(activeUser);

    const result = await service.login(
      { identifier: 'user@test.com', password: 'secret' },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result.accessToken).toBe('access');
    expect(audit.recordEvent).toHaveBeenCalledWith(
      'LOGIN_SUCCESS',
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorUserId: 'user-1',
        ipAddress: '127.0.0.1',
      }),
    );
  });
});
