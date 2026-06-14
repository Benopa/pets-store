import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateFavoritesDto {
  @ApiProperty({ type: [String], description: 'Полный список id избранных животных' })
  @IsArray()
  @IsString({ each: true })
  favorites!: string[];
}
