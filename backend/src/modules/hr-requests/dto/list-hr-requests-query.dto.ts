import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';
import { HRRequestStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListHrRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: HRRequestStatus })
  @IsOptional()
  @IsEnum(HRRequestStatus)
  status?: HRRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDatabaseUuid()
  requesterId?: string;
}
