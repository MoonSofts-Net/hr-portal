import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class SetRolePermissionsDto {
  @ApiProperty({ type: [String], example: ['users.read', 'users.create'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionIds!: string[];
}
