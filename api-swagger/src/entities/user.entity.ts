import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Animal } from './animal.entity';
import { Order } from './order.entity';

export type UserRole = 'admin' | 'moderator' | 'seller' | 'buyer' | 'courier';

export type PaymentMethod = 'card' | 'sbp' | 'cash';

export interface CartItem {
  animalId: string;
  quantity: number;
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  // Хеш пароля не отдаётся никогда: select:false — не выбирается из БД,
  // @Exclude — не сериализуется даже если где-то загружен явно. Где он нужен (сравнение
  // пароля при входе/смене), грузим через addSelect — см. UsersService.
  @Exclude()
  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', nullable: true })
  lastName?: string;

  // Секреты и PII ниже помечены @Exclude — НЕ сериализуются в ответах-сущностях, поэтому
  // не утекают через eager-связи owner (животные) / user (заказы) и список пользователей.
  // Владельцу они отдаются явно через plain-объекты AuthService.toProfile / issueTokens.
  @Exclude()
  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  address?: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @Exclude()
  @Column({ type: 'jsonb', default: () => "'[]'" })
  favorites!: string[];

  @Exclude()
  @Column({ type: 'jsonb', default: () => "'[]'" })
  cart!: CartItem[];

  @Column({ type: 'varchar', default: 'buyer' })
  role!: UserRole;

  // apiKey — активный секрет (авторизация заказов по x-api-key). Не сериализуется в
  // ответах-сущностях; владелец получает его через issueTokens/toProfile (plain-объекты).
  @Exclude()
  @Column({ unique: true })
  apiKey!: string;

  @OneToMany(() => Animal, (animal) => animal.owner)
  animals!: Animal[];

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
