import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

const ROLES: UserRole[] = ['admin', 'moderator', 'seller', 'buyer'];

export class UpdateUserDto {
  @ApiProperty({ example: 'newpass123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Иван', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Иванов', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '1990-05-17', required: false, description: 'Дата рождения (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ example: 'buyer', required: false, enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: UserRole;
}
