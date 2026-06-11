import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Animal } from '../entities/animal.entity';
import { AnimalImage } from '../entities/animal-image.entity';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

@Injectable()
export class AnimalsService {
  constructor(
    @InjectRepository(Animal)
    private readonly animalRepo: Repository<Animal>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AnimalImage)
    private readonly imageRepo: Repository<AnimalImage>,
  ) {}

  async create(dto: CreateAnimalDto, userId: string) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const owner = await this.userRepo.findOne({ where: { id: userId } });
    if (!owner) {
      throw new NotFoundException('User not found');
    }
    const animal = this.animalRepo.create({
      name: dto.name,
      species: dto.species,
      description: dto.description,
      gender: dto.gender,
      ageMonths: dto.ageMonths,
      price: dto.price,
      weightKg: dto.weightKg,
      status: dto.status ?? 'available',
      category,
      owner,
    });
    return this.animalRepo.save(animal);
  }

  async findAll(query: {
    categoryId?: string;
    species?: string;
    status?: string;
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    minAgeMonths?: number;
    maxAgeMonths?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }) {
    const qb = this.animalRepo.createQueryBuilder('animal')
      .leftJoinAndSelect('animal.category', 'category')
      .leftJoinAndSelect('animal.owner', 'owner')
      .leftJoinAndSelect('animal.images', 'images');

    if (query.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.species) {
      qb.andWhere('animal.species = :species', { species: query.species });
    }
    if (query.status) {
      qb.andWhere('animal.status = :status', { status: query.status });
    }
    if (query.name) {
      qb.andWhere('LOWER(animal.name) LIKE :name', { name: `%${query.name.toLowerCase()}%` });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('animal.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('animal.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (query.minAgeMonths !== undefined) {
      qb.andWhere('animal.ageMonths >= :minAgeMonths', { minAgeMonths: query.minAgeMonths });
    }
    if (query.maxAgeMonths !== undefined) {
      qb.andWhere('animal.ageMonths <= :maxAgeMonths', { maxAgeMonths: query.maxAgeMonths });
    }

    const sortMap: Record<string, string> = {
      createdAt: 'animal.createdAt',
      price: 'animal.price',
      ageMonths: 'animal.ageMonths',
      name: 'animal.name',
    };
    const sortField = sortMap[query.sortBy ?? 'createdAt'] ?? 'animal.createdAt';
    qb.orderBy(sortField, query.order ?? 'DESC');

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findById(id: string) {
    const animal = await this.animalRepo.findOne({ where: { id } });
    if (!animal) {
      throw new NotFoundException('Animal not found');
    }
    return animal;
  }

  async update(id: string, dto: UpdateAnimalDto, userId: string, role: string) {
    const animal = await this.findById(id);
    if (animal.owner.id !== userId && role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }
    if (dto.name) {
      animal.name = dto.name;
    }
    if (dto.species !== undefined) {
      animal.species = dto.species;
    }
    if (dto.description !== undefined) {
      animal.description = dto.description;
    }
    if (dto.gender !== undefined) {
      animal.gender = dto.gender;
    }
    if (dto.ageMonths !== undefined) {
      animal.ageMonths = dto.ageMonths;
    }
    if (dto.price !== undefined) {
      animal.price = dto.price;
    }
    if (dto.weightKg !== undefined) {
      animal.weightKg = dto.weightKg;
    }
    if (dto.status !== undefined) {
      animal.status = dto.status;
    }
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      animal.category = category;
    }
    return this.animalRepo.save(animal);
  }

  async listSpecies() {
    const rows = await this.animalRepo
      .createQueryBuilder('animal')
      .select('DISTINCT animal.species', 'species')
      .where('animal.species IS NOT NULL')
      .orderBy('animal.species', 'ASC')
      .getRawMany();
    return rows.map((row) => row.species);
  }

  async remove(id: string, user: User) {
    const animal = await this.findById(id);
    if (animal.owner.id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }
    await this.animalRepo.delete(id);
  }

  async addImage(id: string, url: string, userId: string, role: string) {
    const animal = await this.findById(id);
    if (animal.owner.id !== userId && role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }
    const image = this.imageRepo.create({ url, animal });
    await this.imageRepo.save(image);
    return this.findById(id);
  }
}
