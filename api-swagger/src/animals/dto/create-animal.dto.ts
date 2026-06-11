import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateAnimalDto {
  @ApiProperty({ example: 'Tom' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'cat', required: false })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiProperty({ example: 'Friendly cat', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ageMonths?: number;

  @ApiProperty({ example: 120.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 4.2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiProperty({ example: 'available', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'e3b2c5a8-4f2d-4b9f-9b5d-6e1d8b0b9c5a' })
  @IsString()
  categoryId!: string;
}
