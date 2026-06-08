import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { IsDatabaseUuid } from '../../../common/validators/database-uuid.validator';
import { IsValidCpf } from '../../../common/validators/is-valid-cpf.validator';
import { normalizeCpf } from '../../../common/utils/cpf.util';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'CPF digits or formatted (000.000.000-00)' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeCpf(value) : value))
  @IsString()
  @IsNotEmpty()
  @IsValidCpf()
  cpf!: string;

  @ApiProperty({ description: 'Primary role ID' })
  @IsDatabaseUuid()
  roleId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}
