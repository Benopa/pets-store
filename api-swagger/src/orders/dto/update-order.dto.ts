import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class UpdateOrderDto {
  @ApiProperty({
    example: [
      { type: 'pet', itemId: '6b8e8c3b-5e2a-4a8b-9b7c-9f5e7e4c1234', quantity: 2 },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiProperty({ example: 99.9, required: false })
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiProperty({ example: 'paid', required: false, enum: ['created', 'paid', 'shipped', 'cancelled'] })
  @IsOptional()
  @IsIn(['created', 'paid', 'shipped', 'cancelled'])
  status?: 'created' | 'paid' | 'shipped' | 'cancelled';
}
