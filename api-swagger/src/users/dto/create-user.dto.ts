import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

const ROLES: UserRole[] = ['admin', 'moderator', 'seller', 'buyer'];

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6)
  password!: string;

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

  // Админ может назначить любую роль, включая moderator и admin.
  @ApiProperty({ example: 'buyer', required: false, enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: UserRole;
}
