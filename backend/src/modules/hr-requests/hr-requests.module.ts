import { Module } from '@nestjs/common';
import { HrRequestsController } from './hr-requests.controller';
import { HrRequestsService } from './hr-requests.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [HrRequestsController],
  providers: [HrRequestsService],
  exports: [HrRequestsService],
})
export class HrRequestsModule {}
