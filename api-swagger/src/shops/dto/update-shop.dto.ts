import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateShopDto {
  @ApiProperty({ example: 'Зоомагазин «Лапки»', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: 'Москва, ул. Пушкина, 10', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}
