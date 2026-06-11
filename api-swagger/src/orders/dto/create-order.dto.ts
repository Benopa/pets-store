import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    example: [
      { type: 'pet', itemId: '6b8e8c3b-5e2a-4a8b-9b7c-9f5e7e4c1234', quantity: 1 },
      { type: 'food', itemId: '22c2f6b7-5dd6-4dbb-a3e2-1a9f8f1b1a2b', quantity: 3, note: 'premium' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ example: 120.5, required: false })
  @IsOptional()
  @IsNumber()
  total?: number;
}
