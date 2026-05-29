import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';
import { RequestDownloadUrlDto } from './dto/request-download-url.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('upload')
  @RequirePermissions('documents.upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string' },
        name: { type: 'string' },
        accessLevel: { type: 'string' },
        userId: { type: 'string', format: 'uuid' },
      },
      required: ['file', 'category'],
    },
  })
  @ApiOperation({ summary: 'Upload document (metadata in DB, file in object storage)' })
  upload(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.upload(tenantId, file, dto, user);
  }

  @Get()
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'List documents (tenant-scoped, access-filtered)' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ListDocumentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(tenantId, query, user);
  }

  @Get(':id')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Get document metadata and version list' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(tenantId, id, user);
  }

  @Post(':id/versions')
  @RequirePermissions('documents.upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload new document version' })
  addVersion(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.addVersion(tenantId, id, file, user);
  }

  @Get(':id/versions')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'List document versions (no storage URLs)' })
  listVersions(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listVersions(tenantId, id, user);
  }

  @Post(':id/request-download-url')
  @RequirePermissions('documents.download')
  @ApiOperation({ summary: 'Get short-lived signed download URL' })
  requestDownloadUrl(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RequestDownloadUrlDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.requestDownloadUrl(tenantId, id, dto, user);
  }

  @Post(':id/approve')
  @RequirePermissions('documents.approve')
  @ApiOperation({ summary: 'Approve document (onboarding-aware)' })
  approve(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(tenantId, id, user);
  }

  @Post(':id/reject')
  @RequirePermissions('documents.approve')
  @ApiOperation({ summary: 'Reject document with reason' })
  reject(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(tenantId, id, dto.rejectionReason, user);
  }

  @Delete(':id')
  @RequirePermissions('documents.upload')
  @ApiOperation({ summary: 'Soft-delete document and remove files from storage' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.softDelete(tenantId, id, user);
  }
}
