import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentAccessLevel, DocumentCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentCategory })
  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional({ enum: DocumentAccessLevel, default: DocumentAccessLevel.PRIVATE })
  @IsOptional()
  @IsEnum(DocumentAccessLevel)
  accessLevel?: DocumentAccessLevel;

  @ApiPropertyOptional({ description: 'HR may upload on behalf of employee' })
  @IsOptional()
  @IsDatabaseUuid()
  userId?: string;
}
