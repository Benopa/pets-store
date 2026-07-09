import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ConversationKind } from '../../entities/conversation.entity';

const KINDS: ConversationKind[] = [
  'buyer-seller',
  'buyer-support',
  'seller-support',
  'admin-moderator',
];

export class CreateConversationDto {
  @ApiProperty({ enum: KINDS })
  @IsIn(KINDS)
  kind!: ConversationKind;

  // Для buyer-seller: кому пишем.
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  // Для admin-moderator (когда диалог создаёт админ): с кем.
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  moderatorId?: string;

  // Чат «по товару» (кнопка «Написать продавцу»).
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  animalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;
}
