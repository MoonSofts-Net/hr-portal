import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { PrismaService } from '../../database/prisma/prisma.service';
import { DomainAuditService } from '../../modules/audit-logs/domain-audit.service';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';

describe('TenantGuard integration', () => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as unknown as Reflector;

  const prisma = {
    setTenantContext: jest.fn(),
    setSuperAdminContext: jest.fn(),
    tenant: { findFirst: jest.fn() },
  } as unknown as PrismaService;

  const audit = { recordEvent: jest.fn() } as unknown as DomainAuditService;

  const guard = new TenantGuard(reflector, prisma, audit);

  const employee: AuthenticatedUser = {
    userId: 'u1',
    email: 'e@t.com',
    name: 'Employee',
    homeTenantId: 'tenant-a',
    activeTenantId: 'tenant-a',
    tenantId: 'tenant-a',
    roleId: 'role-1',
    roleName: 'Employee',
    sessionId: 'sid',
    permissionIds: ['users.read'],
    isSuperAdmin: false,
    isGlobal: false,
    mfaEnabled: false,
    mfaVerified: true,
  };

  function mockContext(user?: AuthenticatedUser, headerTenant?: string) {
    const req: Record<string, unknown> = {
      headers: headerTenant ? { 'x-tenant-id': headerTenant } : {},
      user,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks non-global user from cross-tenant header', async () => {
    const ctx = mockContext(employee, 'tenant-b');
    await expect(guard.canActivate(ctx as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      'CROSS_TENANT_ACCESS_ATTEMPT',
      expect.objectContaining({
        tenantId: 'tenant-a',
        actorUserId: 'u1',
        entityId: 'tenant-b',
      }),
    );
  });

  it('allows global operator to switch tenant via header', async () => {
    const superUser: AuthenticatedUser = {
      ...employee,
      isSuperAdmin: true,
      isGlobal: true,
      permissionIds: ['*'],
    };
    (prisma.tenant.findFirst as jest.Mock).mockResolvedValue({ id: 'tenant-b', isActive: true });

    const ctx = mockContext(superUser, 'tenant-b');
    const allowed = await guard.canActivate(ctx as never);
    expect(allowed).toBe(true);
    const req = ctx.switchToHttp().getRequest() as { tenantId: string };
    expect(req.tenantId).toBe('tenant-b');
    expect(prisma.setTenantContext).toHaveBeenCalledWith('tenant-b');
  });

  it('locks regular user to home tenant when no header', async () => {
    const ctx = mockContext(employee);
    await guard.canActivate(ctx as never);
    const req = ctx.switchToHttp().getRequest() as { tenantId: string };
    expect(req.tenantId).toBe('tenant-a');
  });
});
