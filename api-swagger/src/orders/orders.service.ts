import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { Animal } from '../entities/animal.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Animal)
    private readonly animalRepo: Repository<Animal>,
    private readonly notificationsService: NotificationsService,
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
    const saved = await this.orderRepo.save(order);
    await this.notifySellers(dto, dbUser.id);
    return saved;
  }

  // Уведомляем продавцов о заказе их питомцев. Только позиции type='pet' привязаны к товару
  // (owner животного); food пропускаем. Себе уведомление не шлём.
  private async notifySellers(dto: CreateOrderDto, buyerId: string) {
    const petItems = dto.items.filter((item) => item.type === 'pet');
    for (const item of petItems) {
      const animal = await this.animalRepo.findOne({ where: { id: item.itemId } });
      if (!animal?.owner || animal.owner.id === buyerId) {
        continue;
      }
      await this.notificationsService.create(animal.owner.id, {
        type: 'order_placed',
        title: 'Новый заказ',
        body: `Вашего питомца «${animal.name}» заказали${item.quantity > 1 ? ` (×${item.quantity})` : ''}.`,
        animalId: animal.id,
      });
    }
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
