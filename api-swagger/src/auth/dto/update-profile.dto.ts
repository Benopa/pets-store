import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PaymentMethod } from '../../entities/user.entity';

// Самостоятельное редактирование профиля пользователем.
// Пароль/email тут менять нельзя; роль — только в пределах buyer/seller.
export class UpdateProfileDto {
  @ApiProperty({ example: 'Иван', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiProperty({ example: 'Иванов', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiProperty({ example: '1990-05-17', required: false, description: 'Дата рождения (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ example: 'Москва, ул. Пушкина, д. 1', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'card', required: false, enum: ['card', 'sbp', 'cash'] })
  @IsOptional()
  @IsIn(['card', 'sbp', 'cash'])
  paymentMethod?: PaymentMethod;

  // Тип кабинета — пользователь может переключаться только между покупателем и продавцом.
  @ApiProperty({ example: 'seller', required: false, enum: ['buyer', 'seller'] })
  @IsOptional()
  @IsIn(['buyer', 'seller'])
  role?: 'buyer' | 'seller';
}
