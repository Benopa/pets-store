import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

// Публичная регистрация: разрешены только роли покупателя и продавца.
// Модератор и админ создаются администратором через POST /users.
export type SelfRegisterRole = Extract<UserRole, 'buyer' | 'seller'>;

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Иван' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Иванов' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ example: '1990-05-17', description: 'Дата рождения (YYYY-MM-DD)' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: 'buyer', enum: ['buyer', 'seller'], default: 'buyer', required: false })
  @IsOptional()
  @IsIn(['buyer', 'seller'])
  role?: SelfRegisterRole;
}
