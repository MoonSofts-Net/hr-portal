import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { HRRequestStatus } from '@prisma/client';

export class UpdateHrRequestStatusDto {
  @ApiProperty({ enum: HRRequestStatus })
  @IsEnum(HRRequestStatus)
  status!: HRRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
