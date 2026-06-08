import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';
import { AuditAction, PermissionModule } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDatabaseUuid()
  actorUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDatabaseUuid()
  targetUserId?: string;

  @ApiPropertyOptional({ enum: PermissionModule })
  @IsOptional()
  @IsEnum(PermissionModule)
  module?: PermissionModule;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ description: 'Entity type filter (e.g. user, document)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
