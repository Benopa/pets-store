import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Dogs', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
