import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';
import { AnimalImage } from './animal-image.entity';

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

  @Column({ type: 'numeric', nullable: true })
  price?: number;

  @Column({ type: 'numeric', nullable: true })
  weightKg?: number;

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

  @OneToMany(() => AnimalImage, (image) => image.animal, { cascade: true, eager: true })
  images!: AnimalImage[];

  @CreateDateColumn()
  createdAt!: Date;
}
