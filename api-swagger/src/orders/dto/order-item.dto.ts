import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'pet', enum: ['pet', 'food'] })
  @IsIn(['pet', 'food'])
  type!: 'pet' | 'food';

  @ApiProperty({ example: '6b8e8c3b-5e2a-4a8b-9b7c-9f5e7e4c1234' })
  @IsString()
  itemId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 'for weekend', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
