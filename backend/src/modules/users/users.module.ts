import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { BranchesModule } from '../branches/branches.module';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogsModule, BranchesModule, IntegrationsModule, NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
