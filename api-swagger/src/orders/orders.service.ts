import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      address: dto.address,
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

  // Продажи продавца: проходим по всем заказам и оставляем только позиции-питомцы,
  // владелец которых — текущий пользователь. Возвращаем заказ-подобные записи с покупателем,
  // обогащёнными названием/ценой товара и суммой именно по проданным позициям.
  async findSales(user: User) {
    const myAnimals = await this.animalRepo.find({ where: { owner: { id: user.id } } });
    if (myAnimals.length === 0) {
      return [];
    }
    const byId = new Map(myAnimals.map((animal) => [animal.id, animal] as [string, Animal]));

    const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' } });
    return orders
      // Собственные заказы продавца — это покупки, а не продажи.
      .filter((order) => order.user?.id !== user.id)
      .map((order) => {
        const items = (order.items ?? [])
          .filter((item) => item.type === 'pet' && byId.has(item.itemId))
          .map((item) => {
            const animal = byId.get(item.itemId)!;
            return {
              type: item.type,
              itemId: item.itemId,
              name: animal.name,
              quantity: item.quantity,
              price: animal.price != null ? Number(animal.price) : 0,
            };
          });
        return { order, items };
      })
      .filter(({ items }) => items.length > 0)
      .map(({ order, items }) => ({
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        address: order.address ?? null,
        buyer: {
          id: order.user?.id ?? null,
          firstName: order.user?.firstName ?? null,
          lastName: order.user?.lastName ?? null,
          email: order.user?.email ?? null,
        },
        items,
        total: items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
      }));
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

  // Отменить заказ можно, пока он не получен (delivered) и ещё не отменён.
  private assertCancellable(order: Order) {
    if (order.status === 'cancelled') {
      throw new BadRequestException('Заказ уже отменён');
    }
    if (order.status === 'delivered') {
      throw new BadRequestException('Полученный заказ отменить нельзя');
    }
  }

  // Отмена всего заказа.
  async cancel(id: string, user: User) {
    const order = await this.findById(id, user);
    this.assertCancellable(order);
    order.status = 'cancelled';
    return this.orderRepo.save(order);
  }

  // Отмена одной позиции заказа. Сумму уменьшаем на стоимость удалённой позиции;
  // если позиций не осталось — заказ отменяется целиком.
  async cancelItem(id: string, itemId: string, user: User) {
    const order = await this.findById(id, user);
    this.assertCancellable(order);

    const removed = (order.items ?? []).find((item) => item.itemId === itemId);
    if (!removed) {
      throw new NotFoundException('Item not found in order');
    }
    const remaining = (order.items ?? []).filter((item) => item.itemId !== itemId);

    const animal = await this.animalRepo.findOne({ where: { id: itemId } });
    const removedAmount =
      (animal?.price != null ? Number(animal.price) : 0) * (removed.quantity || 1);

    order.items = remaining;
    if (order.total != null) {
      order.total = Math.max(0, Number(order.total) - removedAmount);
    }
    if (remaining.length === 0) {
      order.status = 'cancelled';
    }
    return this.orderRepo.save(order);
  }

  // Подтверждение получения заказа покупателем — после этого отмена недоступна.
  async markReceived(id: string, user: User) {
    const order = await this.findById(id, user);
    if (order.status === 'cancelled') {
      throw new BadRequestException('Отменённый заказ нельзя отметить полученным');
    }
    order.status = 'delivered';
    return this.orderRepo.save(order);
  }
}
