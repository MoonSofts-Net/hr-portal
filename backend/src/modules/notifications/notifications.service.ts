import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ResendIntegration } from '../../integrations/resend/resend.integration';
import { notificationEmailHtml } from '../../integrations/resend/email-templates';
import { ok } from '../../common/utils/api-response.util';

export interface NotifyUserParams {
  tenantId: string;
  userId: string;
  title: string;
  body: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resend: ResendIntegration,
    private readonly config: ConfigService,
  ) {}

  async findForUser(tenantId: string, userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(items);
  }

  /** Creates an in-app notification and sends email when Resend is configured. */
  async notify(params: NotifyUserParams) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    });

    void this.sendNotificationEmail(params);
    return notification;
  }

  private async sendNotificationEmail(params: NotifyUserParams) {
    if (!this.resend.isEnabled()) return;

    const user = await this.prisma.user.findFirst({
      where: { id: params.userId, tenantId: params.tenantId },
      select: { email: true, name: true },
    });
    if (!user?.email) return;

    const appUrl = this.config.get<string>('appUrl', 'http://localhost:3000');
    const fullLink = params.link ? `${appUrl}${params.link}` : appUrl;

    await this.resend.send({
      to: user.email,
      subject: params.title,
      html: notificationEmailHtml({
        name: user.name,
        title: params.title,
        body: params.body,
        link: fullLink,
      }),
      text: `${params.title}\n\n${params.body}${params.link ? `\n\n${fullLink}` : ''}`,
    });
  }
}
