import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';
import { HRRequestStatus } from '@prisma/client';

export class UpdateHrRequestStatusDto {
  @ApiProperty({ enum: HRRequestStatus })
  @IsEnum(HRRequestStatus)
  status!: HRRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDatabaseUuid()
  assignedToId?: string;
}
