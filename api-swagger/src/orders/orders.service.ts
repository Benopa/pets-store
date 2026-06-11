import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateOrderDto, user: User) {
    const dbUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }
    const order = this.orderRepo.create({
      user: dbUser,
      items: dto.items,
      total: dto.total,
    });
    return this.orderRepo.save(order);
  }

  async findAll(user: User) {
    return this.orderRepo.find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string, user: User) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.user.id !== user.id) {
      throw new ForbiddenException('Not allowed');
    }
    return order;
  }

  async update(id: string, dto: UpdateOrderDto, user: User) {
    const order = await this.findById(id, user);
    if (dto.items) {
      order.items = dto.items;
    }
    if (dto.total !== undefined) {
      order.total = dto.total;
    }
    if (dto.status) {
      order.status = dto.status;
    }
    return this.orderRepo.save(order);
  }
}
