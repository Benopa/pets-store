import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty({ example: 'newpass123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'user', required: false, enum: ['admin', 'user'] })
  @IsOptional()
  @IsIn(['admin', 'user'])
  role?: UserRole;
}
