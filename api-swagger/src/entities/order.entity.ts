import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

// Поток статусов: created/paid → ready (продавец отметил «готов к отправке») → shipped → delivered.
// ready — продавец подготовил заказ; только после этого доступна передача в доставку.
// delivered — заказ получен покупателем (терминальный статус, отмена больше недоступна).
export type OrderStatus = 'created' | 'paid' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

// Способ оплаты, выбранный при оформлении.
export type PaymentMethod = 'card' | 'sbp' | 'cash';

// Статус оплаты заказа:
//   paid        — оплачено онлайн (карта/СБП), банк подтвердил;
//   awaiting    — ждём подтверждения из банка (онлайн-оплата ещё не подтверждена);
//   on_delivery — оплата при получении (наличные/курьер).
export type PaymentStatus = 'paid' | 'awaiting' | 'on_delivery';

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

  // Адрес доставки заказа (как указал покупатель при оформлении).
  @Column({ type: 'varchar', nullable: true })
  address?: string;

  // Способ оплаты, выбранный при оформлении (card | sbp | cash).
  @Column({ type: 'varchar', nullable: true })
  paymentMethod?: PaymentMethod;

  // Статус оплаты: paid | awaiting | on_delivery (по умолчанию — оплата при получении).
  @Column({ type: 'varchar', default: 'on_delivery' })
  paymentStatus!: PaymentStatus;

  // Причина отмены заказа (заполняется при отмене продавцом, видна покупателю).
  @Column({ type: 'varchar', nullable: true })
  cancelReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
