import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';
import { AnimalImage } from './animal-image.entity';
import { Shop } from './shop.entity';

@Entity({ name: 'animals' })
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  species?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ type: 'int', nullable: true })
  ageMonths?: number;

  // Покупательская цена — уже с учётом комиссии сайта (basePrice * (1 + commissionRate)).
  // Именно её видят покупатели в каталоге, корзине и заказах.
  @Column({ type: 'numeric', nullable: true })
  price?: number;

  // Базовая цена, которую указал продавец (без комиссии сайта).
  @Column({ type: 'numeric', nullable: true })
  basePrice?: number;

  // Комиссия сайта (доля): для товаров продавцов — 0.05 (5%), для админских — 0.
  @Column({ type: 'numeric', default: 0 })
  commissionRate!: number;

  @Column({ type: 'numeric', nullable: true })
  weightKg?: number;

  // Остаток на складе: сколько единиц доступно к покупке. Списывается при оформлении
  // заказа, возвращается при отмене. При 0 покупка недоступна («Нет в наличии»).
  @Column({ type: 'int', default: 30 })
  stock!: number;

  @Column({ default: 'available' })
  status!: string;

  // Статус модерации: 'pending' (на проверке) | 'approved' (одобрен) | 'rejected' (отклонён).
  // Товары продавцов создаются как 'pending'; товары админа — сразу 'approved'.
  @Column({ default: 'approved' })
  moderationStatus!: string;

  // Причина отклонения — заполняется модератором, видна продавцу.
  @Column({ type: 'varchar', nullable: true })
  rejectReason?: string | null;

  @ManyToOne(() => Category, (category) => category.animals, { eager: true })
  category!: Category;

  @ManyToOne(() => User, (user) => user.animals, { eager: true })
  owner!: User;

  // Магазин, которому принадлежит товар (товаром торгует магазин — онлайн через доставку,
  // офлайн добавим позже). Заполняется администратором; null — товар без привязки к магазину.
  @ManyToOne(() => Shop, { eager: true, nullable: true, onDelete: 'SET NULL' })
  shop?: Shop | null;

  @OneToMany(() => AnimalImage, (image) => image.animal, { cascade: true, eager: true })
  images!: AnimalImage[];

  @CreateDateColumn()
  createdAt!: Date;
}
