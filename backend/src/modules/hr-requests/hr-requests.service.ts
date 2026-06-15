import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HRRequestStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, buildOrderBy, resolvePagination } from '../../common/utils/pagination.util';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { PermissionsResolverService } from '../auth/services/permissions-resolver.service';
import { CreateHrRequestDto } from './dto/create-hr-request.dto';
import { UpdateHrRequestStatusDto } from './dto/update-hr-request-status.dto';
import { ListHrRequestsQueryDto } from './dto/list-hr-requests-query.dto';
import { DomainAuditService } from '../audit-logs/domain-audit.service';
import { NotificationsService } from '../notifications/notifications.service';

const SORT_FIELDS: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
};

@Injectable()
export class HrRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: DomainAuditService,
    private readonly permissions: PermissionsResolverService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: ListHrRequestsQueryDto, user: AuthenticatedUser) {
    const { page, limit, skip, take, sortOrder } = resolvePagination(query);
    const canManage = this.permissions.hasAny(['hr_requests.respond'], user.permissionIds);

    const where: Prisma.HRRequestWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.requesterId ? { requesterId: query.requesterId } : {}),
      ...(canManage ? {} : { requesterId: user.userId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.hRRequest.count({ where }),
      this.prisma.hRRequest.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(query.sortBy, sortOrder, SORT_FIELDS, 'updatedAt'),
        include: {
          requester: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    return paginated(items, buildMeta(total, page, limit));
  }

  async findOne(tenantId: string, id: string, user: AuthenticatedUser) {
    const request = await this.getRequestOrThrow(tenantId, id);
    this.assertCanAccess(request, user);

    const full = await this.prisma.hRRequest.findFirst({
      where: { id, tenantId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    return ok(full);
  }

  async create(tenantId: string, dto: CreateHrRequestDto, user: AuthenticatedUser) {
    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.hRRequest.create({
        data: {
          tenantId,
          requesterId: user.userId,
          subject: dto.subject,
          category: dto.category,
          priority: dto.priority,
        },
      });

      if (dto.initialMessage) {
        await tx.hRRequestMessage.create({
          data: {
            tenantId,
            requestId: created.id,
            authorId: user.userId,
            body: dto.initialMessage,
            isInternal: false,
          },
        });
      }

      return created;
    });

    await this.notifications.notify({
      tenantId,
      userId: user.userId,
      title: 'Solicitação registrada',
      body: `Sua solicitação "${dto.subject}" foi criada.`,
      link: `/requests/${request.id}`,
    });

    await this.audit.recordEvent('HR_REQUEST_CREATED', {
      tenantId,
      actorUserId: user.userId,
      entityId: request.id,
      metadata: { subject: dto.subject },
    });

    return this.findOne(tenantId, request.id, user);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateHrRequestStatusDto,
    user: AuthenticatedUser,
  ) {
    if (!this.permissions.hasAny(['hr_requests.respond'], user.permissionIds)) {
      throw new ForbiddenException('HR respond permission required');
    }

    await this.getRequestOrThrow(tenantId, id);

    const updated = await this.prisma.hRRequest.update({
      where: { id },
      data: {
        status: dto.status,
        assignedToId: dto.assignedToId,
        resolvedAt:
          dto.status === HRRequestStatus.RESOLVED || dto.status === HRRequestStatus.CLOSED
            ? new Date()
            : undefined,
      },
      include: {
        requester: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    await this.audit.recordEvent('HR_REQUEST_STATUS_CHANGED', {
      tenantId,
      actorUserId: user.userId,
      entityId: id,
      metadata: { status: dto.status },
    });

    return ok(updated);
  }

  async addMessage(
    tenantId: string,
    requestId: string,
    body: string,
    isInternal: boolean,
    user: AuthenticatedUser,
  ) {
    const request = await this.getRequestOrThrow(tenantId, requestId);
    this.assertCanAccess(request, user);

    if (isInternal && !this.permissions.hasAny(['hr_requests.respond'], user.permissionIds)) {
      throw new ForbiddenException('Cannot post internal notes');
    }

    const message = await this.prisma.hRRequestMessage.create({
      data: {
        tenantId,
        requestId,
        authorId: user.userId,
        body,
        isInternal,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    const notifyUserId =
      user.userId === request.requesterId ? request.assignedToId : request.requesterId;
    if (notifyUserId) {
      await this.notifications.notify({
        tenantId,
        userId: notifyUserId,
        title: 'Nova mensagem na solicitação',
        body: request.subject,
        link: `/requests/${requestId}`,
      });
    }

    await this.audit.recordEvent('HR_REQUEST_STATUS_CHANGED', {
      tenantId,
      actorUserId: user.userId,
      entityId: requestId,
      metadata: { event: 'message_added', messageId: message.id, isInternal },
    });

    return ok(message);
  }

  private async getRequestOrThrow(tenantId: string, id: string) {
    const request = await this.prisma.hRRequest.findFirst({ where: { id, tenantId } });
    if (!request) throw new NotFoundException('HR request not found');
    return request;
  }

  private assertCanAccess(
    request: { requesterId: string },
    user: AuthenticatedUser,
  ) {
    const canManage = this.permissions.hasAny(['hr_requests.respond'], user.permissionIds);
    if (!canManage && request.requesterId !== user.userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
