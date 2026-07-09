import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

// Вложение сообщения: файл уже загружен через POST /chat/upload, храним метаданные.
export interface ChatAttachment {
  type: 'image' | 'file';
  name: string;
  size: number;
  url: string;
}

// «Сторона» отправителя в диалоге (как from в демо-чате): по ней клиент решает,
// слева или справа рисовать сообщение. В support-чатах модератор и админ — одна сторона.
export type ChatSenderRole = 'buyer' | 'seller' | 'moderator' | 'admin';

@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @Column('uuid')
  conversationId!: string;

  @Column('uuid')
  senderId!: string;

  @Column({ type: 'varchar' })
  senderRole!: ChatSenderRole;

  @Column({ type: 'varchar', default: '' })
  text!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments!: ChatAttachment[];

  // Прочитано противоположной стороной (проставляется при открытии диалога).
  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
