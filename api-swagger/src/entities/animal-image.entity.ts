import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Animal } from './animal.entity';

@Entity({ name: 'animal_images' })
export class AnimalImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  url!: string;

  @ManyToOne(() => Animal, (animal) => animal.images, { onDelete: 'CASCADE' })
  animal!: Animal;
}
