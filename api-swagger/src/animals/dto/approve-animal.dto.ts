import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

// Параметры одобрения товара. Нужны только когда продавец предложил новую категорию
// (animal.proposedCategoryName): модератор либо создаёт её (createCategory), либо назначает
// существующую (categoryId). Для обычного одобрения тело пустое.
export class ApproveAnimalDto {
  @ApiProperty({
    example: true,
    required: false,
    description: 'Создать предложенную продавцом новую категорию и назначить её товару.',
  })
  @IsOptional()
  @IsBoolean()
  createCategory?: boolean;

  @ApiProperty({
    example: 'e3b2c5a8-4f2d-4b9f-9b5d-6e1d8b0b9c5a',
    required: false,
    description: 'Назначить товару существующую категорию (id) вместо предложенной новой.',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
