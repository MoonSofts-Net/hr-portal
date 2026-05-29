import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PointAdjustmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, resolvePagination } from '../../common/utils/pagination.util';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { PermissionsResolverService } from '../auth/services/permissions-resolver.service';
import { CreatePointAdjustmentDto } from './dto/create-point-adjustment.dto';
import { ListPointAdjustmentsQueryDto } from './dto/list-point-adjustments-query.dto';
import { DomainAuditService } from '../audit-logs/domain-audit.service';

@Injectable()
export class PointAdjustmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: DomainAuditService,
    private readonly permissions: PermissionsResolverService,
  ) {}

  async findAll(
    tenantId: string,
    query: ListPointAdjustmentsQueryDto,
    user: AuthenticatedUser,
  ) {
    const { page, limit, skip, take } = resolvePagination(query);
    const canApprove = this.permissions.hasAny(
      ['point.adjust.approve'],
      user.permissionIds,
    );

    const where: Prisma.PointAdjustmentRequestWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(canApprove ? {} : { userId: user.userId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.pointAdjustmentRequest.count({ where }),
      this.prisma.pointAdjustmentRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    return paginated(items, buildMeta(total, page, limit));
  }

  async findOne(tenantId: string, id: string, user: AuthenticatedUser) {
    const item = await this.prisma.pointAdjustmentRequest.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
    if (!item) throw new NotFoundException('Adjustment request not found');

    const canApprove = this.permissions.hasAny(
      ['point.adjust.approve'],
      user.permissionIds,
    );
    if (!canApprove && item.userId !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    return ok(item);
  }

  async create(tenantId: string, dto: CreatePointAdjustmentDto, user: AuthenticatedUser) {
    const item = await this.prisma.pointAdjustmentRequest.create({
      data: {
        tenantId,
        userId: user.userId,
        date: new Date(dto.date),
        reason: dto.reason,
        requestedChanges: dto.requestedChanges,
        status: PointAdjustmentStatus.PENDING,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await this.audit.recordEvent('POINT_ADJUSTMENT_REQUESTED', {
      tenantId,
      actorUserId: user.userId,
      targetUserId: user.userId,
      entityId: item.id,
      metadata: { date: dto.date },
    });

    return ok(item);
  }

  async approve(tenantId: string, id: string, user: AuthenticatedUser) {
    return this.review(tenantId, id, user, PointAdjustmentStatus.APPROVED);
  }

  async reject(
    tenantId: string,
    id: string,
    reviewComment: string,
    user: AuthenticatedUser,
  ) {
    return this.review(
      tenantId,
      id,
      user,
      PointAdjustmentStatus.REJECTED,
      reviewComment,
    );
  }

  private async review(
    tenantId: string,
    id: string,
    user: AuthenticatedUser,
    status: PointAdjustmentStatus,
    reviewComment?: string,
  ) {
    if (!this.permissions.hasAny(['point.adjust.approve'], user.permissionIds)) {
      throw new ForbiddenException('Approval permission required');
    }

    const existing = await this.prisma.pointAdjustmentRequest.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Adjustment request not found');
    if (existing.status !== PointAdjustmentStatus.PENDING) {
      throw new BadRequestException('Request already reviewed');
    }

    if (status === PointAdjustmentStatus.REJECTED && !reviewComment?.trim()) {
      throw new BadRequestException('Rejection comment is required');
    }

    const updated = await this.prisma.pointAdjustmentRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: user.userId,
        reviewedAt: new Date(),
        reviewComment,
      },
      include: {
        user: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    await this.audit.recordEvent(
      status === PointAdjustmentStatus.APPROVED
        ? 'POINT_ADJUSTMENT_APPROVED'
        : 'POINT_ADJUSTMENT_REJECTED',
      {
        tenantId,
        actorUserId: user.userId,
        targetUserId: existing.userId,
        entityId: id,
        metadata: { status, reviewComment },
      },
    );

    return ok(updated);
  }
}
