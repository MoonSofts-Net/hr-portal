import { NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { DomainAuditService } from '../audit-logs/domain-audit.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: jest.Mocked<Pick<PrismaService, 'tenant'>>;

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      } as unknown as jest.Mocked<PrismaService>['tenant'],
    };

    service = new TenantsService(
      prisma as unknown as PrismaService,
      { recordEvent: jest.fn() } as unknown as DomainAuditService,
    );
  });

  it('findById throws when tenant does not exist', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('softDelete sets isActive to false', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 't1' });
    (prisma.tenant.update as jest.Mock).mockResolvedValue({ id: 't1', isActive: false });

    const result = await service.softDelete('t1', 'actor', 'home-tenant');
    expect(result.data.isActive).toBe(false);
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { isActive: false },
    });
  });
});
