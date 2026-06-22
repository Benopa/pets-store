import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

// Типы событий, о которых уведомляем. Расширяется по мере добавления новых сценариев
// (избранное и т.д.).
export type NotificationType = 'animal_approved' | 'animal_rejected' | 'order_placed';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Получатель уведомления. При удалении пользователя его уведомления тоже удаляются.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar' })
  type!: NotificationType;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  body?: string;

  // Ссылка на товар (для перехода к карточке), если уведомление о животном.
  @Column({ type: 'uuid', nullable: true })
  animalId?: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
