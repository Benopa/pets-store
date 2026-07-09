import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

// Виды диалогов (совпадают с фронтовыми):
//  buyer-seller     — покупатель ↔ продавец (по товару); начать может только покупатель
//  buyer-support    — покупатель ↔ поддержка (видят все модераторы и админы)
//  seller-support   — продавец ↔ поддержка (видят все модераторы и админы)
//  admin-moderator  — администрация ↔ конкретный модератор
export type ConversationKind =
  | 'buyer-seller'
  | 'buyer-support'
  | 'seller-support'
  | 'admin-moderator';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  kind!: ConversationKind;

  // Стороны диалога. Заполняются в зависимости от kind:
  //  buyer-seller → buyerId + sellerId; buyer-support → buyerId;
  //  seller-support → sellerId; admin-moderator → moderatorId.
  // Сторона «поддержка»/«администрация» общая — не привязана к конкретному сотруднику.
  @Column({ type: 'uuid', nullable: true })
  buyerId?: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer?: User | null;

  @Column({ type: 'uuid', nullable: true })
  sellerId?: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller?: User | null;

  @Column({ type: 'uuid', nullable: true })
  moderatorId?: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moderatorId' })
  moderator?: User | null;

  // Чат «по товару» (кнопка «Написать продавцу» с карточки).
  @Column({ type: 'uuid', nullable: true })
  animalId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  productName?: string | null;

  // «Удаление» чата = скрыть у себя: id пользователей, скрывших диалог.
  // Новое сообщение очищает список — чат «всплывает» у всех обратно.
  @Column({ type: 'jsonb', default: () => "'[]'" })
  deletedFor!: string[];

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
