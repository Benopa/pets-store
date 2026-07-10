import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order, OrderItem, OrderItemStatus } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { Animal } from '../entities/animal.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { NotificationsService } from '../notifications/notifications.service';

// Сервисный сбор сайта на товары магазинов (8%): у таких товаров комиссия в цену не зашита,
// выручку сайт получает сервисным сбором при оформлении заказа. Совпадает со ставкой на фронте.
const SERVICE_FEE_RATE = 0.08;

// Короткий номер заказа для текстов уведомлений — первые 8 символов id
// (то же представление «Заказ №XXXXXXXX», что и в интерфейсе).
const orderNo = (id: string) => String(id).slice(0, 8);

// Порядок стадий позиции: нет статуса (готовится) < ready < shipped < delivered.
// cancelled — вне порядка, отменённые позиции в агрегат не входят.
const ITEM_STAGE_RANK: Record<Exclude<OrderItemStatus, 'cancelled'>, number> = {
  ready: 1,
  shipped: 2,
  delivered: 3,
};

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
    // Продавец не может купить собственный товар — отклоняем до списания остатка.
    await this.assertNotOwnProducts(dto.items, dbUser.id);
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
    await this.notifySellers(dto, dbUser.id, saved.id);
    return saved;
  }

  // Запрет покупки собственного товара: если среди позиций-питомцев есть товар, владелец
  // которого — сам покупатель, заказ отклоняется (продавец не покупает свой товар).
  private async assertNotOwnProducts(items: { type: string; itemId: string }[], userId: string) {
    const petItems = items.filter((item) => item.type === 'pet');
    for (const item of petItems) {
      const animal = await this.animalRepo.findOne({ where: { id: item.itemId } });
      if (animal?.owner?.id === userId) {
        throw new BadRequestException(`Нельзя купить собственный товар «${animal.name}»`);
      }
    }
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
  private async notifySellers(dto: CreateOrderDto, buyerId: string, orderId: string) {
    const petItems = dto.items.filter((item) => item.type === 'pet');
    for (const item of petItems) {
      const animal = await this.animalRepo.findOne({ where: { id: item.itemId } });
      if (!animal?.owner || animal.owner.id === buyerId) {
        continue;
      }
      await this.notificationsService.create(animal.owner.id, {
        type: 'order_placed',
        title: `Новый заказ №${orderNo(orderId)}`,
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
              status: this.effectiveItemStatus(order, item),
              cancelReason: item.cancelReason ?? null,
            };
          });
        return { order, items };
      })
      .filter(({ items }) => items.length > 0)
      .map(({ order, items }) => {
        // Статус ЧАСТИ заказа этого продавца: части разных продавцов независимы,
        // поэтому смотрим только на его позиции, а не на агрегат заказа.
        const activeItems = items.filter((item) => item.status !== 'cancelled');
        let partStatus: string;
        if (!activeItems.length) {
          partStatus = 'cancelled';
        } else {
          const rank = Math.min(
            ...activeItems.map((item) =>
              item.status && item.status !== 'cancelled' ? ITEM_STAGE_RANK[item.status] : 0,
            ),
          );
          if (rank === ITEM_STAGE_RANK.ready) partStatus = 'ready';
          else if (rank === ITEM_STAGE_RANK.shipped) partStatus = 'shipped';
          else if (rank === ITEM_STAGE_RANK.delivered) partStatus = 'delivered';
          else partStatus = order.status === 'paid' ? 'paid' : 'created';
        }
        const partCancelReason =
          items.find((item) => item.status === 'cancelled' && item.cancelReason)?.cancelReason ??
          order.cancelReason ??
          null;
        // Выручка — только по неотменённым позициям продавца.
        const total = activeItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
        return {
          id: order.id,
          status: partStatus,
          cancelReason: partStatus === 'cancelled' ? partCancelReason : null,
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
          total,
        };
      });
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
        // Отменённая продавцом позиция (при живом заказе) выручку не приносит.
        if (item.status === 'cancelled') {
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
    // Возвращаем остаток по активным позициям: уже отменённые продавцом части
    // возвращены на склад раньше — второй раз не возвращаем.
    await this.restoreStock(
      (order.items ?? []).filter((item) => this.effectiveItemStatus(order, item) !== 'cancelled'),
    );
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
    const removedStatus = this.effectiveItemStatus(order, removed);
    if (removedStatus === 'cancelled') {
      throw new BadRequestException('Позиция уже отменена продавцом');
    }
    if (removedStatus === 'shipped' || removedStatus === 'delivered') {
      throw new BadRequestException('Позиция уже в доставке — отменить нельзя');
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
    } else {
      // Оставшиеся позиции могли быть отменены продавцами — пересчитываем агрегат.
      this.recomputeOrderStatus(order);
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
    this.markActiveItemsDelivered(order);
    order.status = 'delivered';
    return this.orderRepo.save(order);
  }

  // Все активные (неотменённые) позиции получают статус delivered — доставка
  // завершает заказ целиком, независимая подготовка частей на этом заканчивается.
  private markActiveItemsDelivered(order: Order) {
    (order.items ?? []).forEach((item) => {
      if (item.type === 'pet' && this.effectiveItemStatus(order, item) !== 'cancelled') {
        item.status = 'delivered';
      }
    });
  }

  // Отмена продавцом своей части заказа с указанием причины. Позиции других
  // продавцов не затрагиваются; заказ целиком отменяется, только если отменены
  // все позиции. Возвращаем остаток и уменьшаем сумму заказа на отменённую часть.
  async cancelBySeller(id: string, reason: string | undefined, user: User) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const { items: mine, animalsById, partial } = await this.sellerItemsOf(
      order,
      user.id,
      'Можно отменить только заказ со своим товаром',
    );
    this.assertCancellable(order);
    const active = mine.filter((item) => this.effectiveItemStatus(order, item) !== 'cancelled');
    if (!active.length) {
      throw new BadRequestException('Ваши позиции в этом заказе уже отменены');
    }
    if (
      active.some((item) => {
        const status = this.effectiveItemStatus(order, item);
        return status === 'shipped' || status === 'delivered';
      })
    ) {
      throw new BadRequestException('Ваша часть заказа уже в доставке — отменить нельзя');
    }
    await this.restoreStock(active);
    const reasonText = reason?.trim() || null;
    // Сумма заказа уменьшается на отменённые позиции (по покупательской цене).
    let removedAmount = 0;
    for (const item of active) {
      const animal = animalsById.get(item.itemId);
      removedAmount += (animal?.price != null ? Number(animal.price) : 0) * (item.quantity || 1);
      item.status = 'cancelled';
      item.cancelReason = reasonText;
    }
    if (order.total != null && removedAmount > 0) {
      order.total = Math.max(0, Number(order.total) - removedAmount);
    }
    this.recomputeOrderStatus(order);
    if (order.status === 'cancelled') {
      order.cancelReason = reasonText;
    }
    const saved = await this.orderRepo.save(order);
    await this.notificationsService.create(order.user.id, {
      type: 'order_cancelled',
      title:
        partial && order.status !== 'cancelled'
          ? `Часть заказа №${orderNo(order.id)} отменена продавцом`
          : `Заказ №${orderNo(order.id)} отменён продавцом`,
      body: [
        partial && order.status !== 'cancelled'
          ? `Отменено: ${this.itemNames(active, animalsById)}.`
          : null,
        reasonText ? `Причина: ${reasonText}` : 'Продавец отменил ваш заказ.',
      ]
        .filter(Boolean)
        .join(' '),
    });
    return saved;
  }

  // Эффективный статус позиции: свой статус позиции, а у старых заказов (позиции
  // без статуса) — статус заказа, если он уже про логистику/отмену.
  private effectiveItemStatus(order: Order, item: OrderItem): OrderItemStatus | null {
    if (item.status) {
      return item.status;
    }
    return order.status === 'ready' ||
      order.status === 'shipped' ||
      order.status === 'delivered' ||
      order.status === 'cancelled'
      ? order.status
      : null;
  }

  // Пересчёт агрегатного статуса заказа по позициям: отменён — если отменены все
  // позиции, иначе минимальная стадия среди активных (позиции разных продавцов
  // независимы, заказ «догоняет» самую отстающую часть). Стадию оплаты
  // (created/paid) агрегат не трогает — это отдельный этап жизни заказа.
  private recomputeOrderStatus(order: Order) {
    const petItems = (order.items ?? []).filter((item) => item.type === 'pet');
    if (!petItems.length) {
      return;
    }
    const statuses = petItems.map((item) => this.effectiveItemStatus(order, item));
    const active = statuses.filter((status) => status !== 'cancelled');
    if (!active.length) {
      order.status = 'cancelled';
      return;
    }
    const rank = Math.min(...active.map((status) => (status ? ITEM_STAGE_RANK[status] : 0)));
    if (rank === ITEM_STAGE_RANK.ready) order.status = 'ready';
    else if (rank === ITEM_STAGE_RANK.shipped) order.status = 'shipped';
    else if (rank === ITEM_STAGE_RANK.delivered) order.status = 'delivered';
    else if (
      order.status === 'ready' ||
      order.status === 'shipped' ||
      order.status === 'delivered' ||
      order.status === 'cancelled'
    ) {
      // Защитная ветка: часть заказа снова в подготовке — агрегат откатывается.
      order.status = 'created';
    }
  }

  // Позиции заказа, принадлежащие продавцу (+ карта его товаров — для названий
  // в уведомлениях). Если своих позиций нет — действие продавцу недоступно.
  private async sellerItemsOf(order: Order, userId: string, message: string) {
    const myAnimals = await this.animalRepo.find({ where: { owner: { id: userId } } });
    const animalsById = new Map(myAnimals.map((animal) => [animal.id, animal] as [string, Animal]));
    const items = (order.items ?? []).filter(
      (item) => item.type === 'pet' && animalsById.has(item.itemId),
    );
    if (!items.length) {
      throw new ForbiddenException(message);
    }
    // Частичный ли это заказ: есть ли в нём позиции других продавцов.
    const partial = (order.items ?? []).some(
      (item) => item.type === 'pet' && !animalsById.has(item.itemId),
    );
    return { items, animalsById, partial };
  }

  // Названия позиций для текстов уведомлений: «Tom», «Rex».
  private itemNames(items: OrderItem[], animalsById: Map<string, Animal>) {
    return items
      .map((item) => `«${animalsById.get(item.itemId)?.name ?? 'товар'}»`)
      .join(', ');
  }

  // Отметка «готов к отправке» продавцом — первый шаг перед передачей в доставку.
  // Затрагивает только позиции этого продавца: части разных продавцов готовятся
  // независимо. Идемпотентна.
  async markReady(id: string, user: User) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const { items: mine, animalsById, partial } = await this.sellerItemsOf(
      order,
      user.id,
      'Можно подготовить только заказ со своим товаром',
    );
    const active = mine.filter((item) => this.effectiveItemStatus(order, item) !== 'cancelled');
    if (!active.length) {
      throw new BadRequestException('Ваши позиции в этом заказе отменены');
    }
    if (active.every((item) => this.effectiveItemStatus(order, item) === 'ready')) {
      return order; // уже готово — ничего не меняем
    }
    if (
      active.some((item) => {
        const status = this.effectiveItemStatus(order, item);
        return status === 'shipped' || status === 'delivered';
      })
    ) {
      throw new BadRequestException('Ваша часть заказа уже в доставке');
    }
    active.forEach((item) => {
      item.status = 'ready';
    });
    this.recomputeOrderStatus(order);
    const saved = await this.orderRepo.save(order);
    await this.notificationsService.create(order.user.id, {
      type: 'order_ready',
      title: partial
        ? `Часть заказа №${orderNo(order.id)} готова к отправке`
        : `Заказ №${orderNo(order.id)} готов к отправке`,
      body: partial
        ? `Продавец подготовил к отправке: ${this.itemNames(active, animalsById)}.`
        : 'Продавец подготовил ваш заказ к отправке.',
    });
    return saved;
  }

  // Передача в доставку продавцом — только своей части заказа и только после
  // отметки «готов к отправке». Части других продавцов не затрагиваются.
  async markShipped(id: string, user: User) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const { items: mine, animalsById, partial } = await this.sellerItemsOf(
      order,
      user.id,
      'Можно передать в доставку только заказ со своим товаром',
    );
    const active = mine.filter((item) => this.effectiveItemStatus(order, item) !== 'cancelled');
    if (!active.length) {
      throw new BadRequestException('Ваши позиции в этом заказе отменены');
    }
    if (
      active.every((item) => {
        const status = this.effectiveItemStatus(order, item);
        return status === 'shipped' || status === 'delivered';
      })
    ) {
      return order; // уже в доставке — ничего не меняем
    }
    if (active.some((item) => this.effectiveItemStatus(order, item) === null)) {
      throw new BadRequestException('Сначала отметьте заказ готовым к отправке');
    }
    active.forEach((item) => {
      if (this.effectiveItemStatus(order, item) === 'ready') {
        item.status = 'shipped';
      }
    });
    this.recomputeOrderStatus(order);
    const saved = await this.orderRepo.save(order);
    await this.notificationsService.create(order.user.id, {
      type: 'order_shipped',
      title: partial
        ? `Часть заказа №${orderNo(order.id)} передана в доставку`
        : `Заказ №${orderNo(order.id)} передан в доставку`,
      body: partial
        ? `В доставке: ${this.itemNames(active, animalsById)}.`
        : 'Ваш заказ в доставке.',
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

  // Заказы для курьера (только роль courier): попавшие в логистику — готовы к отправке,
  // в доставке или получены. Позиции обогащаем названием товара; в фокусе — адрес доставки.
  async deliveriesForCourier(user: User) {
    if (user.role !== 'courier') {
      throw new ForbiddenException('Доступно только курьеру');
    }
    const deliveryStatuses = new Set(['ready', 'shipped', 'delivered']);
    const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' } });
    const animals = await this.animalRepo.find();
    const byId = new Map(animals.map((animal) => [animal.id, animal] as [string, Animal]));
    return orders
      .filter((order) => deliveryStatuses.has(order.status))
      .map((order) => ({
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        address: order.address ?? null,
        paymentMethod: order.paymentMethod ?? null,
        paymentStatus: order.paymentStatus ?? 'on_delivery',
        total: order.total != null ? Number(order.total) : null,
        buyer: {
          id: order.user?.id ?? null,
          firstName: order.user?.firstName ?? null,
          lastName: order.user?.lastName ?? null,
          email: order.user?.email ?? null,
        },
        items: (order.items ?? []).map((item) => {
          const animal = item.type === 'pet' ? byId.get(item.itemId) : undefined;
          return {
            type: item.type,
            itemId: item.itemId,
            name: animal?.name ?? (item.type === 'food' ? 'Корм' : 'Товар'),
            quantity: item.quantity || 1,
          };
        }),
      }));
  }

  // Отметка «передан покупателю» курьером — та же логика, что у покупателя «подтвердить
  // получение»: заказ из доставки (shipped) становится полученным (delivered). Только роль courier.
  async markDeliveredByCourier(id: string, user: User) {
    if (user.role !== 'courier') {
      throw new ForbiddenException('Доступно только курьеру');
    }
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'shipped') {
      throw new BadRequestException('Передать покупателю можно только заказ в доставке');
    }
    this.markActiveItemsDelivered(order);
    order.status = 'delivered';
    const saved = await this.orderRepo.save(order);
    await this.notificationsService.create(order.user.id, {
      type: 'order_delivered',
      title: `Заказ №${orderNo(order.id)} доставлен`,
      body: 'Курьер отметил ваш заказ как переданный покупателю.',
    });
    return saved;
  }
}
