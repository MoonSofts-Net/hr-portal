import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ required: false, description: 'Revoke specific refresh token session' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
