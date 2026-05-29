import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, buildOrderBy, resolvePagination } from '../../common/utils/pagination.util';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { DomainAuditService } from '../audit-logs/domain-audit.service';

const SORT_FIELDS: Record<string, string> = {
  name: 'name',
  slug: 'slug',
  createdAt: 'createdAt',
};

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: DomainAuditService,
  ) {}

  async findAll(query: ListTenantsQueryDto) {
    const { page, limit, skip, take, sortOrder } = resolvePagination(query);
    const where: Prisma.TenantWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.tenant.count({ where }),
      this.prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(query.sortBy, sortOrder, SORT_FIELDS, 'createdAt'),
      }),
    ]);

    return paginated(items, buildMeta(total, page, limit));
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return ok(tenant);
  }

  async create(dto: CreateTenantDto, actorId: string, homeTenantId: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Tenant slug already exists');

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        legalName: dto.legalName,
        taxId: dto.taxId,
        logoUrl: dto.logoUrl,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.recordEvent('TENANT_CREATED', {
      tenantId: homeTenantId,
      actorUserId: actorId,
      entityId: tenant.id,
      metadata: { name: tenant.name, slug: tenant.slug },
    });

    return ok(tenant);
  }

  async update(id: string, dto: UpdateTenantDto, actorId: string, homeTenantId: string) {
    await this.ensureExists(id);
    if (dto.slug) {
      const clash = await this.prisma.tenant.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (clash) throw new ConflictException('Tenant slug already exists');
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });

    await this.audit.recordEvent('TENANT_UPDATED', {
      tenantId: homeTenantId,
      actorUserId: actorId,
      entityId: id,
    });

    return ok(tenant);
  }

  async softDelete(id: string, actorId: string, homeTenantId: string) {
    await this.ensureExists(id);
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.recordEvent('TENANT_UPDATED', {
      tenantId: homeTenantId,
      actorUserId: actorId,
      entityId: id,
      metadata: { operation: 'soft_delete' },
    });

    return ok(tenant);
  }

  private async ensureExists(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
