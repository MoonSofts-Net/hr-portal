import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOnboardingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
