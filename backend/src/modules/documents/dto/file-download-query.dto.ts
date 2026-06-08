import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FileDownloadQueryDto {
  @ApiProperty({ description: 'Storage key for the file' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: 'Signed download token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'ISO expiry timestamp' })
  @IsString()
  @IsNotEmpty()
  expires!: string;

  @ApiPropertyOptional({ description: 'Suggested download filename' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ description: 'MIME type hint' })
  @IsOptional()
  @IsString()
  mime?: string;
}
