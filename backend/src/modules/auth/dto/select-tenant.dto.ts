import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';

export class SelectTenantDto {
  @ApiProperty({ description: 'Target tenant UUID for scoped operations' })
  @IsDatabaseUuid()
  @IsNotEmpty()
  tenantId!: string;
}
