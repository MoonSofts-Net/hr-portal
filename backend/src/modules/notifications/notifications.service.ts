import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import { notificationEmailHtml } from '../../integrations/resend/email-templates';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, resolvePagination } from '../../common/utils/pagination.util';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

export interface NotifyUserParams {
  tenantId: string;
  userId: string;
  type: string;
  category: string;
  messageKey: string;
  actorUserId?: string;
  metadata?: Prisma.InputJsonValue;
  title?: string;
  body?: string;
  link?: string;
  dedupeWindowSeconds?: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async markAsRead(tenantId: string, userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, tenantId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return ok({ id: notificationId, read: true });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, userId, read: false },
      data: { read: true },
    });
    return ok({ updated: result.count });
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const unread = await this.prisma.notification.count({
      where: { tenantId, userId, read: false },
    });
    return ok({ unread });
  }

  async findForUser(tenantId: string, userId: string, query: ListNotificationsQueryDto) {
    const { page, limit, skip, take } = resolvePagination(query);
    const where: Prisma.NotificationWhereInput = {
      tenantId,
      userId,
      ...(query.unreadOnly ? { read: false } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return paginated(items, buildMeta(total, page, limit));
  }

  /** Creates an in-app notification and sends email when Resend is configured. */
  async notify(params: NotifyUserParams) {
    if (params.dedupeWindowSeconds && params.dedupeWindowSeconds > 0) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          tenantId: params.tenantId,
          userId: params.userId,
          type: params.type,
          messageKey: params.messageKey,
          link: params.link,
          createdAt: {
            gte: new Date(Date.now() - params.dedupeWindowSeconds * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return existing;
    }

    const title = params.title ?? params.messageKey;
    const body = params.body ?? params.messageKey;
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        type: params.type,
        category: params.category,
        messageKey: params.messageKey,
        actorUserId: params.actorUserId,
        metadata: params.metadata,
        title,
        body,
        link: params.link,
      },
    });

    void this.sendNotificationEmail(params);
    return notification;
  }

  private async sendNotificationEmail(params: NotifyUserParams) {
    if (!this.email.isEnabled()) return;

    const user = await this.prisma.user.findFirst({
      where: { id: params.userId, tenantId: params.tenantId },
      select: { email: true, name: true },
    });
    if (!user?.email) return;

    const appUrl = this.config.get<string>('appUrl', 'http://localhost:3000');
    const fullLink = params.link ? `${appUrl}${params.link}` : appUrl;

    await this.email.send({
      to: user.email,
      subject: params.title ?? params.messageKey,
      html: notificationEmailHtml({
        name: user.name,
        title: params.title ?? params.messageKey,
        body: params.body ?? params.messageKey,
        link: fullLink,
      }),
      text: `${params.title ?? params.messageKey}\n\n${params.body ?? params.messageKey}${params.link ? `\n\n${fullLink}` : ''}`,
    });
  }
}
