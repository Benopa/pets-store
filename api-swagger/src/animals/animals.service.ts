import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Animal } from '../entities/animal.entity';
import { AnimalImage } from '../entities/animal-image.entity';
import { Category } from '../entities/category.entity';
import { Shop } from '../entities/shop.entity';
import { User } from '../entities/user.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { NotificationsService } from '../notifications/notifications.service';

// Комиссия сайта на товары продавцов (5%). Покупательская цена = базовая + комиссия (вниз до целых рублей).
const SELLER_COMMISSION_RATE = 0.05;

// Цена с учётом комиссии: комиссию округляем вниз до целых рублей. null/undefined базовая → цена не задаётся.
const withCommission = (basePrice: number | null | undefined, rate: number) =>
  basePrice == null ? undefined : Number(basePrice) + Math.floor(Number(basePrice) * Number(rate));

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
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Находит магазин по id (для привязки товара). Пустая строка/null → товар без магазина.
  private async resolveShop(shopId: string | null | undefined): Promise<Shop | null> {
    if (!shopId) {
      return null;
    }
    const shop = await this.shopRepo.findOne({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async create(dto: CreateAnimalDto, userId: string) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const owner = await this.userRepo.findOne({ where: { id: userId } });
    if (!owner) {
      throw new NotFoundException('User not found');
    }
    // Карточки продавцов уходят на модерацию; админ/модератор публикуют сразу.
    const moderationStatus = owner.role === 'seller' ? 'pending' : 'approved';
    // Комиссия сайта начисляется только на товары продавцов. Продавец указывает свою (базовую)
    // цену в dto.price; покупательская price уже включает комиссию.
    const commissionRate = owner.role === 'seller' ? SELLER_COMMISSION_RATE : 0;
    const shop = await this.resolveShop(dto.shopId);
    // Администратор добавляет товары только в магазин (не «на себя») — магазин обязателен.
    if (owner.role === 'admin' && !shop) {
      throw new BadRequestException('Укажите магазин, в котором находится товар');
    }
    const animal = this.animalRepo.create({
      name: dto.name,
      species: dto.species,
      description: dto.description,
      gender: dto.gender,
      ageMonths: dto.ageMonths,
      basePrice: dto.price,
      commissionRate,
      price: withCommission(dto.price, commissionRate),
      weightKg: dto.weightKg,
      stock: dto.stock ?? 30,
      status: dto.status ?? 'available',
      moderationStatus,
      category,
      owner,
      shop,
    });
    return this.animalRepo.save(animal);
  }

  async findAll(query: {
    categoryId?: string;
    species?: string;
    status?: string;
    moderationStatus?: string;
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
      .leftJoinAndSelect('animal.shop', 'shop')
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
    if (query.moderationStatus) {
      qb.andWhere('animal.moderationStatus = :moderationStatus', {
        moderationStatus: query.moderationStatus,
      });
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
    // Фото — по позиции (первая = обложка).
    qb.addOrderBy('images.position', 'ASC');

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
    if (animal.images) {
      animal.images.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
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
      // Продавец/админ редактирует базовую цену; покупательскую пересчитываем с комиссией товара.
      animal.basePrice = dto.price;
      animal.price = withCommission(dto.price, Number(animal.commissionRate));
    }
    if (dto.weightKg !== undefined) {
      animal.weightKg = dto.weightKg;
    }
    if (dto.status !== undefined) {
      animal.status = dto.status;
    }
    if (dto.stock !== undefined) {
      animal.stock = dto.stock;
    }
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      animal.category = category;
    }
    // Привязка/отвязка магазина: shopId передан (включая null — отвязать).
    if (dto.shopId !== undefined) {
      animal.shop = await this.resolveShop(dto.shopId);
    }
    // Любое редактирование карточки продавцом возвращает её на модерацию;
    // админ и модератор сохраняют изменения без повторной проверки.
    if (role !== 'admin' && role !== 'moderator') {
      animal.moderationStatus = 'pending';
      animal.rejectReason = null;
    }
    return this.animalRepo.save(animal);
  }

  // Одобрение карточки модератором/админом — публикуется в каталоге.
  async approve(id: string) {
    const animal = await this.findById(id);
    animal.moderationStatus = 'approved';
    animal.rejectReason = null;
    const saved = await this.animalRepo.save(animal);
    // Уведомляем владельца: карточка прошла модерацию.
    await this.notificationsService.create(animal.owner.id, {
      type: 'animal_approved',
      title: 'Объявление одобрено',
      body: `«${animal.name}» опубликовано в каталоге.`,
      animalId: animal.id,
    });
    return saved;
  }

  // Отклонение карточки с причиной — продавец увидит причину и сможет исправить товар.
  async reject(id: string, reason?: string) {
    const animal = await this.findById(id);
    animal.moderationStatus = 'rejected';
    animal.rejectReason = reason ?? null;
    const saved = await this.animalRepo.save(animal);
    // Уведомляем владельца об отклонении (с причиной, если она указана).
    await this.notificationsService.create(animal.owner.id, {
      type: 'animal_rejected',
      title: 'Объявление отклонено',
      body: reason ? `«${animal.name}»: ${reason}` : `«${animal.name}» отклонено модератором.`,
      animalId: animal.id,
    });
    return saved;
  }

  // Повторная отправка на проверку (продавцом-владельцем или админом).
  async resubmit(id: string, userId: string, role: string) {
    const animal = await this.findById(id);
    if (animal.owner.id !== userId && role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }
    animal.moderationStatus = 'pending';
    animal.rejectReason = null;
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
    // Новое фото добавляем в конец (после текущей обложки).
    const maxPos = animal.images?.length ? Math.max(...animal.images.map((i) => i.position)) : -1;
    const image = this.imageRepo.create({ url, animal, position: maxPos + 1 });
    await this.imageRepo.save(image);
    return this.findById(id);
  }

  async removeImage(animalId: string, imageId: string, userId: string, role: string) {
    const animal = await this.findById(animalId);
    if (animal.owner.id !== userId && role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }
    const target = animal.images?.find((img) => img.id === imageId);
    if (!target) {
      throw new NotFoundException('Image not found');
    }
    await this.imageRepo.delete(imageId);
    // Переиндексируем оставшиеся, сохраняя порядок.
    const rest = (animal.images ?? [])
      .filter((img) => img.id !== imageId)
      .sort((a, b) => a.position - b.position);
    await Promise.all(rest.map((img, idx) => this.imageRepo.update(img.id, { position: idx })));
    return this.findById(animalId);
  }

  async setCover(animalId: string, imageId: string, userId: string, role: string) {
    const animal = await this.findById(animalId);
    if (animal.owner.id !== userId && role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }
    const images = (animal.images ?? []).slice().sort((a, b) => a.position - b.position);
    if (!images.some((img) => img.id === imageId)) {
      throw new NotFoundException('Image not found');
    }
    // Выбранное фото — на позицию 0, остальные сохраняют относительный порядок.
    const reordered = [
      ...images.filter((img) => img.id === imageId),
      ...images.filter((img) => img.id !== imageId),
    ];
    await Promise.all(reordered.map((img, idx) => this.imageRepo.update(img.id, { position: idx })));
    return this.findById(animalId);
  }
}
