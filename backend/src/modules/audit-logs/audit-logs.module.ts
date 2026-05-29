import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { DomainAuditService } from './domain-audit.service';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, DomainAuditService],
  exports: [AuditLogsService, DomainAuditService],
})
export class AuditLogsModule {}
