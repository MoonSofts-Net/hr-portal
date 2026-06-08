import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';
import { PointAdjustmentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPointAdjustmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PointAdjustmentStatus })
  @IsOptional()
  @IsEnum(PointAdjustmentStatus)
  status?: PointAdjustmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDatabaseUuid()
  userId?: string;
}
