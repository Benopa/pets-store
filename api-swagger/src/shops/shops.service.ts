import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Shop } from '../entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
  ) {}

  create(dto: CreateShopDto) {
    const shop = this.shopRepo.create({ name: dto.name, address: dto.address ?? null });
    return this.shopRepo.save(shop);
  }

  findAll() {
    return this.shopRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    const shop = await this.shopRepo.findOne({ where: { id } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async update(id: string, dto: UpdateShopDto) {
    const shop = await this.findById(id);
    if (dto.name !== undefined) {
      shop.name = dto.name;
    }
    if (dto.address !== undefined) {
      shop.address = dto.address;
    }
    return this.shopRepo.save(shop);
  }

  async remove(id: string) {
    await this.shopRepo.delete(id);
  }
}
