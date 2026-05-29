import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SelectTenantDto {
  @ApiProperty({ description: 'Target tenant UUID for scoped operations' })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;
}
