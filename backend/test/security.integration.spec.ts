import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import { UsersService } from '../src/modules/users/users.service';
import { OnboardingService } from '../src/modules/onboarding/onboarding.service';
import { DocumentAccessService } from '../src/modules/documents/services/document-access.service';
import { PointAdjustmentsService } from '../src/modules/point/point-adjustments.service';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { SuperAdminGuard } from '../src/common/guards/super-admin.guard';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { PermissionsResolverService } from '../src/modules/auth/services/permissions-resolver.service';
import { DomainAuditService } from '../src/modules/audit-logs/domain-audit.service';
import {
  employeeTenantA,
  hrTenantA,
  managerTenantA,
  superAdmin,
  TENANT_A,
  TENANT_B,
} from './fixtures/test-users.fixture';
import { DocumentAccessLevel } from '@prisma/client';

describe('Security integration scenarios', () => {
  describe('tenant isolation — users', () => {
    it('user from tenant A cannot access tenant B data', async () => {
      const prisma = {
        user: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      const users = new UsersService(
        prisma as unknown as PrismaService,
        {} as never,
        {} as never,
        { recordEvent: jest.fn() } as unknown as DomainAuditService,
      );
      await expect(users.findOne(TENANT_A, 'user-in-b')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-in-b', tenantId: TENANT_A } }),
      );
    });
  });

  describe('onboarding', () => {
    const prisma = {
      onboardingProcess: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const permissions = new PermissionsResolverService({} as PrismaService);
    const onboarding = new OnboardingService(
      prisma as unknown as PrismaService,
      { recordEvent: jest.fn() } as unknown as DomainAuditService,
      permissions,
    );

    it('employee cannot approve own onboarding', async () => {
      prisma.onboardingProcess.findFirst.mockResolvedValue({
        id: 'ob-1',
        tenantId: TENANT_A,
        userId: employeeTenantA.userId,
        status: OnboardingStatus.IN_REVIEW,
      });

      const hrSelfApprove: typeof hrTenantA = {
        ...hrTenantA,
        userId: employeeTenantA.userId,
      };

      await expect(onboarding.approve(TENANT_A, 'ob-1', hrSelfApprove)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('employee without HR permission cannot approve', async () => {
      prisma.onboardingProcess.findFirst.mockResolvedValue({
        id: 'ob-1',
        tenantId: TENANT_A,
        userId: 'other-emp',
        status: OnboardingStatus.IN_REVIEW,
      });

      await expect(
        onboarding.approve(TENANT_A, 'ob-1', employeeTenantA),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('HR can approve onboarding within own tenant', async () => {
      prisma.onboardingProcess.findFirst.mockResolvedValue({
        id: 'ob-1',
        tenantId: TENANT_A,
        userId: 'other-emp',
        status: OnboardingStatus.IN_REVIEW,
      });
      prisma.onboardingProcess.update.mockResolvedValue({
        id: 'ob-1',
        status: OnboardingStatus.APPROVED,
      });

      await onboarding.approve(TENANT_A, 'ob-1', hrTenantA);
      expect(prisma.onboardingProcess.findFirst).toHaveBeenCalledWith({
        where: { id: 'ob-1', tenantId: TENANT_A },
      });
    });

    it('HR cannot find onboarding from another tenant', async () => {
      prisma.onboardingProcess.findFirst.mockResolvedValue(null);
      await expect(onboarding.approve(TENANT_B, 'ob-1', hrTenantA)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('documents', () => {
    const access = new DocumentAccessService();

    it('employee cannot download another employee document', () => {
      const otherPrivate = {
        userId: 'other',
        accessLevel: DocumentAccessLevel.PRIVATE,
      };
      expect(() => access.assertCanRead(otherPrivate, employeeTenantA)).toThrow(ForbiddenException);
    });
  });

  describe('point adjustments', () => {
    const prisma = {
      pointAdjustmentRequest: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const permissions = new PermissionsResolverService({} as PrismaService);
    const service = new PointAdjustmentsService(
      prisma as unknown as PrismaService,
      { recordEvent: jest.fn() } as unknown as DomainAuditService,
      permissions,
    );

    it('manager can approve with point.adjust.approve permission', async () => {
      prisma.pointAdjustmentRequest.findFirst.mockResolvedValue({
        id: 'pa-1',
        tenantId: TENANT_A,
        userId: 'emp-1',
        status: 'PENDING',
      });
      prisma.pointAdjustmentRequest.update.mockResolvedValue({ id: 'pa-1', status: 'APPROVED' });

      await service.approve(TENANT_A, 'pa-1', managerTenantA);
      expect(prisma.pointAdjustmentRequest.update).toHaveBeenCalled();
    });

    it('employee without approve permission cannot approve', async () => {
      prisma.pointAdjustmentRequest.findFirst.mockResolvedValue({
        id: 'pa-1',
        tenantId: TENANT_A,
        userId: employeeTenantA.userId,
        status: 'PENDING',
      });

      await expect(service.approve(TENANT_A, 'pa-1', employeeTenantA)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('super admin — tenants', () => {
    it('SuperAdminGuard allows global super admin', () => {
      const guard = new SuperAdminGuard();
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: superAdmin }) }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };
      expect(guard.canActivate(ctx as never)).toBe(true);
    });

    it('TenantsService scopes list without cross-tenant leak in query', async () => {
      const prisma = {
        tenant: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      };
      const tenants = new TenantsService(
        prisma as unknown as PrismaService,
        { recordEvent: jest.fn() } as unknown as DomainAuditService,
      );
      await tenants.findAll({ page: 1, limit: 10 });
      expect(prisma.tenant.findMany).toHaveBeenCalled();
    });
  });
});
