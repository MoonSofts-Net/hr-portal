import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { FileValidationService } from './services/file-validation.service';
import { DocumentAccessService } from './services/document-access.service';
import { NoOpVirusScannerService, VIRUS_SCANNER } from './services/virus-scan.service';

@Module({
  imports: [
    AuditLogsModule,
    AuthModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    FileValidationService,
    DocumentAccessService,
    { provide: VIRUS_SCANNER, useClass: NoOpVirusScannerService },
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
