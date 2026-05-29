import { Module } from '@nestjs/common';
import { PointRecordsController } from './point-records.controller';
import { PointAdjustmentsController } from './point-adjustments.controller';
import { PointRecordsService } from './point-records.service';
import { PointAdjustmentsService } from './point-adjustments.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [PointRecordsController, PointAdjustmentsController],
  providers: [PointRecordsService, PointAdjustmentsService],
  exports: [PointRecordsService, PointAdjustmentsService],
})
export class PointModule {}
