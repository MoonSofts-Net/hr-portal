import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';

export class CreateOnboardingDto {
  @ApiPropertyOptional({ description: 'Target user (HR only). Defaults to current user.' })
  @IsOptional()
  @IsDatabaseUuid()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
