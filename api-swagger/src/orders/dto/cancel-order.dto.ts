import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// Тело запроса на отмену заказа продавцом — причина отмены (необязательна).
export class CancelOrderDto {
  @ApiProperty({ example: 'Закончился товар', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
