import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectAnimalDto {
  @ApiProperty({
    example: 'Фото не соответствует описанию',
    required: false,
    description: 'Причина отклонения — продавец увидит её и сможет исправить товар',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
