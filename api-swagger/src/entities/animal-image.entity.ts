import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Animal } from './animal.entity';

@Entity({ name: 'animal_images' })
export class AnimalImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  url!: string;

  // Порядок фото: 0 — обложка. Меняется при выборе обложки/удалении.
  @Column({ type: 'int', default: 0 })
  position!: number;

  @ManyToOne(() => Animal, (animal) => animal.images, { onDelete: 'CASCADE' })
  animal!: Animal;
}
