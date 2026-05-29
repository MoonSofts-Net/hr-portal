import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { paginated } from '../../common/utils/api-response.util';
import { buildMeta, buildOrderBy, resolvePagination } from '../../common/utils/pagination.util';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

const SORT_FIELDS: Record<string, string> = {
  createdAt: 'createdAt',
  action: 'action',
  module: 'module',
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string, query: ListAuditLogsQueryDto) {
    const { page, limit, skip, take, sortOrder } = resolvePagination(query);

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.targetUserId ? { targetUserId: query.targetUserId } : {}),
      ...(query.module ? { module: query.module } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(query.sortBy, sortOrder, SORT_FIELDS, 'createdAt'),
        select: {
          id: true,
          tenantId: true,
          actorUserId: true,
          targetUserId: true,
          module: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true } },
          target: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return paginated(items, buildMeta(total, page, limit));
  }
}
