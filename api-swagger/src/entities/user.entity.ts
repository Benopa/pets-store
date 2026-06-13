import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Animal } from './animal.entity';
import { Order } from './order.entity';

export type UserRole = 'admin' | 'moderator' | 'seller' | 'buyer';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', nullable: true })
  lastName?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ type: 'varchar', default: 'buyer' })
  role!: UserRole;

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
