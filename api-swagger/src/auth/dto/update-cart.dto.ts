import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class CartItemDto {
  @ApiProperty({ example: '6b8e8c3b-5e2a-4a8b-9b7c-9f5e7e4c1234' })
  @IsString()
  animalId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartDto {
  @ApiProperty({ type: [CartItemDto], description: 'Полная корзина пользователя' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cart!: CartItemDto[];
}
