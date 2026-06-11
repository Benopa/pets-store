import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export type OrderStatus = 'created' | 'paid' | 'shipped' | 'cancelled';

export interface OrderItem {
  type: 'pet' | 'food';
  itemId: string;
  quantity: number;
  note?: string;
}

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.orders, { eager: true })
  user!: User;

  @Column({ type: 'jsonb' })
  items!: OrderItem[];

  @Column({ type: 'varchar', default: 'created' })
  status!: OrderStatus;

  @Column({ type: 'numeric', nullable: true })
  total?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
