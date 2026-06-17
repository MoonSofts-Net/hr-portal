import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Current user notifications' })
  findMine(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.service.findForUser(tenantId, user.userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Current user unread notification count' })
  unreadCount(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getUnreadCount(tenantId, user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.markAsRead(tenantId, user.userId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.markAllAsRead(tenantId, user.userId);
  }
}
