import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, buildOrderBy, resolvePagination } from '../../common/utils/pagination.util';
import { DomainAuditService } from '../audit-logs/domain-audit.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

const SORT_FIELDS: Record<string, string> = {
  name: 'name',
  code: 'code',
  createdAt: 'createdAt',
};

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: DomainAuditService,
  ) {}

  async findAll(tenantId: string, query: ListBranchesQueryDto) {
    const { page, limit, skip, take, sortOrder } = resolvePagination(query);
    const where: Prisma.BranchWhereInput = {
      tenantId,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isContracted !== undefined ? { isContracted: query.isContracted } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.branch.count({ where }),
      this.prisma.branch.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(query.sortBy, sortOrder, SORT_FIELDS, 'name'),
        include: {
          _count: { select: { users: true } },
        },
      }),
    ]);

    const data = items.map((b) => ({
      id: b.id,
      tenantId: b.tenantId,
      code: b.code,
      name: b.name,
      legalName: b.legalName,
      taxId: b.taxId,
      address: b.address,
      city: b.city,
      state: b.state,
      isContracted: b.isContracted,
      isActive: b.isActive,
      userCount: b._count.users,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return paginated(data, buildMeta(total, page, limit));
  }

  async findById(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { users: true } } },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return ok({
      id: branch.id,
      tenantId: branch.tenantId,
      code: branch.code,
      name: branch.name,
      legalName: branch.legalName,
      taxId: branch.taxId,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      isContracted: branch.isContracted,
      isActive: branch.isActive,
      userCount: branch._count.users,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    });
  }

  async create(tenantId: string, dto: CreateBranchDto, actorId: string) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.branch.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) throw new ConflictException('Branch code already exists in this company');

    const branch = await this.prisma.branch.create({
      data: {
        tenantId,
        code,
        name: dto.name.trim(),
        legalName: dto.legalName?.trim(),
        taxId: dto.taxId?.trim(),
        address: dto.address?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim()?.toUpperCase(),
        isContracted: dto.isContracted ?? true,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.recordEvent('BRANCH_CREATED', {
      tenantId,
      actorUserId: actorId,
      entityId: branch.id,
      metadata: { code: branch.code, name: branch.name },
    });

    return ok(branch);
  }

  async update(tenantId: string, id: string, dto: UpdateBranchDto, actorId: string) {
    await this.ensureInTenant(tenantId, id);

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const clash = await this.prisma.branch.findFirst({
        where: { tenantId, code, NOT: { id } },
      });
      if (clash) throw new ConflictException('Branch code already exists in this company');
    }

    const branch = await this.prisma.branch.update({
      where: { id },
      data: {
        code: dto.code?.trim().toUpperCase(),
        name: dto.name?.trim(),
        legalName: dto.legalName?.trim(),
        taxId: dto.taxId?.trim(),
        address: dto.address?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim()?.toUpperCase(),
        isContracted: dto.isContracted,
        isActive: dto.isActive,
      },
    });

    await this.audit.recordEvent('BRANCH_UPDATED', {
      tenantId,
      actorUserId: actorId,
      entityId: id,
      metadata: { code: branch.code, name: branch.name },
    });

    return ok(branch);
  }

  async softDelete(tenantId: string, id: string, actorId: string) {
    await this.ensureInTenant(tenantId, id);
    const branch = await this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.recordEvent('BRANCH_UPDATED', {
      tenantId,
      actorUserId: actorId,
      entityId: id,
      metadata: { operation: 'soft_delete', code: branch.code },
    });

    return ok(branch);
  }

  async ensureAssignableBranch(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, isActive: true },
    });
    if (!branch) throw new NotFoundException('Branch not found or inactive');
    return branch;
  }

  private async ensureInTenant(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }
}
