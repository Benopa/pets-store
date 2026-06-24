import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateAnimalDto {
  @ApiProperty({ example: 'Tommy', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: 'cat', required: false })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiProperty({ example: 'Very friendly cat', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'female', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 18, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ageMonths?: number;

  @ApiProperty({ example: 200, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 5.4, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiProperty({ example: 25, required: false, description: 'Остаток на складе (шт.)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 'sold', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'e3b2c5a8-4f2d-4b9f-9b5d-6e1d8b0b9c5a', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
