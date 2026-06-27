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

// Сервисный сбор сайта на товары магазинов (8%): у таких товаров комиссия в цену не зашита,
// выручку сайт получает сервисным сбором при оформлении заказа. Совпадает со ставкой на фронте.
const SERVICE_FEE_RATE = 0.08;

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
    // Списываем остаток со склада (с проверкой наличия) до создания заказа.
    await this.decrementStock(dto.items);
    // Онлайн-оплата (карта/СБП) создаётся в статусе «ждём подтверждения из банка» и подтверждается
    // отдельным запросом после имитации связи с банком; наличные — «оплата при получении».
    const paymentMethod = dto.paymentMethod ?? 'cash';
    const paymentStatus = paymentMethod === 'cash' ? 'on_delivery' : 'awaiting';
    const order = this.orderRepo.create({
      user: dbUser,
      items: dto.items,
      total: dto.total,
      address: dto.address,
      paymentMethod,
      paymentStatus,
    });
    const saved = await this.orderRepo.save(order);
    await this.notifySellers(dto, dbUser.id);
    return saved;
  }

  // Списание остатка при оформлении: сначала проверяем наличие по всем позициям-питомцам,
  // и только потом уменьшаем — чтобы при нехватке хотя бы одной позиции ничего не сохранить.
  private async decrementStock(items: { type: string; itemId: string; quantity: number }[]) {
    const petItems = items.filter((item) => item.type === 'pet');
    const toSave: Animal[] = [];
    for (const item of petItems) {
      const animal = await this.animalRepo.findOne({ where: { id: item.itemId } });
      if (!animal) {
        continue; // позиция без привязки к товару — пропускаем
      }
      const qty = item.quantity || 1;
      if (animal.stock < qty) {
        throw new BadRequestException(
          `Недостаточно товара «${animal.name}»: осталось ${animal.stock} шт.`,
        );
      }
      animal.stock -= qty;
      toSave.push(animal);
    }
    if (toSave.length) {
      await this.animalRepo.save(toSave);
    }
  }

  // Возврат остатка на склад при отмене заказа или отдельной позиции.
  private async restoreStock(items: { type: string; itemId: string; quantity: number }[]) {
    const petItems = items.filter((item) => item.type === 'pet');
    const toSave: Animal[] = [];
    for (const item of petItems) {
      const animal = await this.animalRepo.findOne({ where: { id: item.itemId } });
      if (!animal) {
        continue;
      }
      animal.stock += item.quantity || 1;
      toSave.push(animal);
    }
    if (toSave.length) {
      await this.animalRepo.save(toSave);
    }
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
            // Выручка продавца — его базовая цена (без комиссии сайта). Комиссия идёт магазину
            // и в выручку продавца не входит. Для старых товаров без basePrice берём price.
            const sellerPrice =
              animal.basePrice != null
                ? Number(animal.basePrice)
                : animal.price != null
                  ? Number(animal.price)
                  : 0;
            return {
              type: item.type,
              itemId: item.itemId,
              name: animal.name,
              quantity: item.quantity,
              price: sellerPrice,
            };
          });
        return { order, items };
      })
      .filter(({ items }) => items.length > 0)
      .map(({ order, items }) => ({
        id: order.id,
        status: order.status,
        cancelReason: order.cancelReason ?? null,
        paymentMethod: order.paymentMethod ?? null,
        paymentStatus: order.paymentStatus ?? 'on_delivery',
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

  // Зачисления сайту (только админ): по каждой проданной позиции — отдельная запись.
  //  • товар продавца (без магазина) → комиссия = (покупательская цена − базовая) × кол-во;
  //  • товар магазина → сервисный сбор = цена × кол-во × ставка сбора (наценки в цене нет).
  // Отменённые заказы не учитываются. Общий источник и для сводки, и для детализации.
  private async buildAccruals() {
    const [orders, animals] = await Promise.all([
      this.orderRepo.find({ order: { createdAt: 'DESC' } }),
      this.animalRepo.find(),
    ]);
    const byId = new Map(animals.map((animal) => [animal.id, animal] as [string, Animal]));
    const rows: Array<{
      orderId: string;
      date: Date;
      animalId: string;
      animalName: string;
      quantity: number;
      type: 'commission' | 'service';
      amount: number;
      seller: { id: string; name: string | null; email: string | null } | null;
      shop: { id: string; name: string } | null;
    }> = [];
    for (const order of orders) {
      if (order.status === 'cancelled') {
        continue;
      }
      for (const item of order.items ?? []) {
        if (item.type !== 'pet') {
          continue;
        }
        const animal = byId.get(item.itemId);
        if (!animal) {
          continue;
        }
        const quantity = item.quantity || 1;
        if (animal.shop) {
          // Товар магазина: выручка сайта — сервисный сбор (комиссии в цене нет).
          const amount =
            Math.round(Number(animal.price ?? 0) * quantity * SERVICE_FEE_RATE * 100) / 100;
          if (amount <= 0) {
            continue;
          }
          rows.push({
            orderId: order.id,
            date: order.createdAt,
            animalId: animal.id,
            animalName: animal.name,
            quantity,
            type: 'service',
            amount,
            seller: null,
            shop: { id: animal.shop.id, name: animal.shop.name },
          });
        } else {
          // Товар продавца: выручка сайта — зашитая комиссия.
          const per = Number(animal.price ?? 0) - Number(animal.basePrice ?? 0);
          if (per <= 0) {
            continue;
          }
          const owner = animal.owner;
          rows.push({
            orderId: order.id,
            date: order.createdAt,
            animalId: animal.id,
            animalName: animal.name,
            quantity,
            type: 'commission',
            amount: Math.round(per * quantity * 100) / 100,
            seller: owner
              ? {
                  id: owner.id,
                  name: [owner.firstName, owner.lastName].filter(Boolean).join(' ') || null,
                  email: owner.email ?? null,
                }
              : null,
            shop: null,
          });
        }
      }
    }
    return rows;
  }

  // Сводка по выручке сайта (только админ): сумма всех зачислений (комиссии + сервисные сборы).
  async commissionSummary(user: User) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Доступно только администратору');
    }
    const rows = await this.buildAccruals();
    const commission = Math.round(rows.reduce((sum, row) => sum + row.amount, 0) * 100) / 100;
    return { commission };
  }

  // Детализация зачислений сайту (только админ) для раздела «Прибыль»
  // с фильтрами по периоду / магазину / продавцу.
  async commissionDetails(user: User) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Доступно только администратору');
    }
    const items = await this.buildAccruals();
    const total = Math.round(items.reduce((sum, row) => sum + row.amount, 0) * 100) / 100;
    return { total, items };
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
    // Возвращаем остаток по всем позициям отменяемого заказа.
    await this.restoreStock(order.items ?? []);
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
    // Возвращаем остаток по отменяемой позиции.
    await this.restoreStock([removed]);
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

  // Подтверждение получения заказа покупателем — доступно только для заказа в доставке
  // ('shipped'). После этого статус становится 'delivered' и отмена недоступна.
  async markReceived(id: string, user: User) {
    const order = await this.findById(id, user);
    if (order.status !== 'shipped') {
      throw new BadRequestException('Подтвердить получение можно только для заказа в доставке');
    }
    order.status = 'delivered';
    return this.orderRepo.save(order);
  }

  // Отмена заказа продавцом с указанием причины. Доступна, если в заказе есть товар продавца
  // и заказ ещё можно отменить. Возвращаем остаток, ставим статус cancelled, сохраняем причину
  // и уведомляем покупателя.
  async cancelBySeller(id: string, reason: string | undefined, user: User) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const myAnimals = await this.animalRepo.find({ where: { owner: { id: user.id } } });
    const myIds = new Set(myAnimals.map((animal) => animal.id));
    const ownsItem = (order.items ?? []).some(
      (item) => item.type === 'pet' && myIds.has(item.itemId),
    );
    if (!ownsItem) {
      throw new ForbiddenException('Можно отменить только заказ со своим товаром');
    }
    if (order.status === 'shipped') {
      throw new BadRequestException('Заказ уже в доставке — отменить нельзя');
    }
    this.assertCancellable(order);
    await this.restoreStock(order.items ?? []);
    order.status = 'cancelled';
    order.cancelReason = reason?.trim() || null;
    const saved = await this.orderRepo.save(order);
    await this.notificationsService.create(order.user.id, {
      type: 'order_cancelled',
      title: 'Заказ отменён продавцом',
      body: order.cancelReason
        ? `Причина: ${order.cancelReason}`
        : 'Продавец отменил ваш заказ.',
    });
    return saved;
  }

  // Передача заказа в доставку продавцом. Доступна, если в заказе есть товар продавца
  // и заказ ещё не отменён/не получен/не отправлен. Ставит статус 'shipped' и уведомляет покупателя.
  async markShipped(id: string, user: User) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const myAnimals = await this.animalRepo.find({ where: { owner: { id: user.id } } });
    const myIds = new Set(myAnimals.map((animal) => animal.id));
    const ownsItem = (order.items ?? []).some(
      (item) => item.type === 'pet' && myIds.has(item.itemId),
    );
    if (!ownsItem) {
      throw new ForbiddenException('Можно передать в доставку только заказ со своим товаром');
    }
    if (order.status === 'cancelled') {
      throw new BadRequestException('Отменённый заказ нельзя передать в доставку');
    }
    if (order.status === 'delivered') {
      throw new BadRequestException('Полученный заказ уже доставлен');
    }
    order.status = 'shipped';
    const saved = await this.orderRepo.save(order);
    await this.notificationsService.create(order.user.id, {
      type: 'order_shipped',
      title: 'Заказ передан в доставку',
      body: 'Ваш заказ в доставке.',
    });
    return saved;
  }

  // Подтверждение онлайн-оплаты (после имитации связи с банком): awaiting → paid.
  // Идемпотентно: для уже оплаченных заказов и оплаты при получении просто возвращаем заказ.
  async confirmPayment(id: string, user: User) {
    const order = await this.findById(id, user);
    if (order.paymentStatus === 'awaiting') {
      order.paymentStatus = 'paid';
      return this.orderRepo.save(order);
    }
    return order;
  }
}
