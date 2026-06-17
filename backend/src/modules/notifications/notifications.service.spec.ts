import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      notification: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'n1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    service = new NotificationsService(
      prisma as unknown as PrismaService,
      { isEnabled: jest.fn().mockReturnValue(false), send: jest.fn() } as unknown as EmailService,
      { get: jest.fn().mockReturnValue('http://localhost:3000') } as unknown as ConfigService,
    );
  });

  it('returns unread count for user', async () => {
    prisma.notification.count.mockResolvedValue(3);

    const result = await service.getUnreadCount('tenant-1', 'user-1');

    expect(result.data.unread).toBe(3);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', read: false },
    });
  });

  it('filters notifications by unread and category', async () => {
    await service.findForUser('tenant-1', 'user-1', {
      page: 1,
      limit: 20,
      unreadOnly: true,
      category: 'users',
    });

    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        read: false,
        category: 'users',
      }),
    });
  });
});
