import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, resolvePagination } from '../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DomainAuditService } from '../audit-logs/domain-audit.service';
import { ALL_PERMISSION_IDS } from '../../security/permissions/permission-catalog';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: DomainAuditService,
  ) {}

  async findAll(tenantId: string, query: PaginationQueryDto) {
    const { page, limit, skip, take } = resolvePagination(query);
    const where: Prisma.RoleWhereInput = {
      tenantId,
      isSystem: false,
    };

    const [total, items] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          rolePermissions: { select: { permissionId: true } },
          _count: { select: { userRoles: true } },
        },
      }),
    ]);

    return paginated(items, buildMeta(total, page, limit));
  }

  async findOne(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId, isSystem: false },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return ok(role);
  }

  async create(tenantId: string, dto: CreateRoleDto, actorId: string) {
    const role = await this.prisma.role.create({
      data: { tenantId, name: dto.name, description: dto.description },
    });

    await this.audit.recordEvent('ROLE_CREATED', {
      tenantId,
      actorUserId: actorId,
      entityId: role.id,
    });

    return ok(role);
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto, actorId: string) {
    await this.ensureEditable(tenantId, id);
    const role = await this.prisma.role.update({
      where: { id },
      data: dto,
    });

    await this.audit.recordEvent('ROLE_UPDATED', {
      tenantId,
      actorUserId: actorId,
      entityId: id,
    });

    return ok(role);
  }

  async remove(tenantId: string, id: string, actorId: string) {
    const role = await this.ensureEditable(tenantId, id);
    const usersCount = await this.prisma.userRole.count({ where: { roleId: id } });
    if (usersCount > 0) {
      throw new BadRequestException('Role is assigned to users and cannot be deleted');
    }

    await this.prisma.role.delete({ where: { id: role.id } });

    await this.audit.recordEvent('ROLE_UPDATED', {
      tenantId,
      actorUserId: actorId,
      entityId: id,
      metadata: { operation: 'delete' },
    });

    return ok({ deleted: true, id });
  }

  async setPermissions(
    tenantId: string,
    roleId: string,
    permissionIds: string[],
    actorId: string,
  ) {
    await this.ensureEditable(tenantId, roleId);

    const invalid = permissionIds.filter((p) => !ALL_PERMISSION_IDS.includes(p));
    if (invalid.length) {
      throw new BadRequestException(`Unknown permissions: ${invalid.join(', ')}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    });

    await this.audit.recordEvent('PERMISSION_CHANGED', {
      tenantId,
      actorUserId: actorId,
      entityId: roleId,
      metadata: { permissionIds },
    });

    return this.findOne(tenantId, roleId);
  }

  private async ensureEditable(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({ where: { id, tenantId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified');
    }
    return role;
  }
}
