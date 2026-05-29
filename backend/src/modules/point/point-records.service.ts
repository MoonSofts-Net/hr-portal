import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { paginated } from '../../common/utils/api-response.util';
import { buildMeta, resolvePagination } from '../../common/utils/pagination.util';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { PermissionsResolverService } from '../auth/services/permissions-resolver.service';
import { ListPointRecordsQueryDto } from './dto/list-point-records-query.dto';

@Injectable()
export class PointRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsResolverService,
  ) {}

  async findAll(tenantId: string, query: ListPointRecordsQueryDto, user: AuthenticatedUser) {
    const { page, limit, skip, take } = resolvePagination(query);
    const canViewTeam = this.permissions.hasAny(
      ['point.read', 'point.adjust.approve'],
      user.permissionIds,
    );

    const targetUserId = query.userId ?? user.userId;
    if (query.userId && query.userId !== user.userId && !canViewTeam) {
      throw new ForbiddenException('Cannot view other users point records');
    }

    const where: Prisma.PointRecordWhereInput = {
      tenantId,
      userId: targetUserId,
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.pointRecord.count({ where }),
      this.prisma.pointRecord.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

    return paginated(items, buildMeta(total, page, limit));
  }

  async findMine(
    tenantId: string,
    query: ListPointRecordsQueryDto,
    user: AuthenticatedUser,
  ) {
    return this.findAll(tenantId, { ...query, userId: user.userId }, user);
  }
}
