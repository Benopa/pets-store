import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldsecret', description: 'Текущий пароль' })
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @ApiProperty({ example: 'newsecret', minLength: 6, description: 'Новый пароль' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
