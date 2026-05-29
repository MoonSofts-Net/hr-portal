import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePointAdjustmentDto {
  @ApiProperty({ example: '2026-05-20' })
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;

  @ApiProperty({ description: 'Description of requested schedule changes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  requestedChanges!: string;
}
