import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

// Лёгкие моки репозиториев/сервиса — инстанцируем сервис напрямую (без Nest DI).
const makeService = () => {
  const orderRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
  const userRepo = { findOne: jest.fn() };
  const animalRepo = { find: jest.fn(), findOne: jest.fn() };
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const service = new OrdersService(
    orderRepo as any,
    userRepo as any,
    animalRepo as any,
    notifications as any,
  );
  return { service, orderRepo, userRepo, animalRepo, notifications };
};

const admin = { id: 'admin1', role: 'admin' } as any;
const seller = { id: 'seller1', role: 'seller' } as any;

describe('OrdersService.create', () => {
  it('продавец не может купить собственный товар', async () => {
    const { service, userRepo, animalRepo } = makeService();
    userRepo.findOne.mockResolvedValue({ id: 'u1', role: 'seller' });
    animalRepo.findOne.mockResolvedValue({ id: 'A1', name: 'Tom', owner: { id: 'u1' } });
    await expect(
      service.create(
        { items: [{ type: 'pet', itemId: 'A1', quantity: 1 }] } as any,
        { id: 'u1' } as any,
      ),
    ).rejects.toThrow('собственный товар');
  });
});

describe('OrdersService.commissionDetails (зачисления)', () => {
  it('комиссия для товара продавца и сервисный сбор для товара магазина', async () => {
    const { service, orderRepo, animalRepo } = makeService();
    orderRepo.find.mockResolvedValue([
      {
        id: 'o1',
        status: 'delivered',
        createdAt: new Date('2026-06-01'),
        items: [
          { type: 'pet', itemId: 'A1', quantity: 1 },
          { type: 'pet', itemId: 'A2', quantity: 1 },
        ],
      },
      { id: 'o2', status: 'cancelled', items: [{ type: 'pet', itemId: 'A1', quantity: 5 }] },
    ]);
    animalRepo.find.mockResolvedValue([
      // товар продавца: комиссия зашита в цену (105 - 100 = 5)
      {
        id: 'A1',
        name: 'Tom',
        price: 105,
        basePrice: 100,
        shop: null,
        owner: { id: 'seller1', firstName: 'Иван', lastName: 'И', email: 's@b.c' },
      },
      // товар магазина: комиссии в цене нет, сбор 8% = 200 * 0.08 = 16
      {
        id: 'A2',
        name: 'Rex',
        price: 200,
        basePrice: 200,
        shop: { id: 's1', name: 'SKZoo' },
        owner: { id: 'admin1' },
      },
    ]);

    const { total, items } = await service.commissionDetails(admin);

    expect(total).toBe(21); // 5 + 16; отменённый заказ не учитывается
    const commissionRow = items.find((r) => r.type === 'commission');
    const serviceRow = items.find((r) => r.type === 'service');
    expect(commissionRow).toMatchObject({ amount: 5, shop: null });
    expect(commissionRow?.seller?.id).toBe('seller1');
    expect(serviceRow).toMatchObject({ amount: 16, seller: null });
    expect(serviceRow?.shop).toEqual({ id: 's1', name: 'SKZoo' });
  });

  it('не-админу доступ запрещён', async () => {
    const { service } = makeService();
    await expect(service.commissionDetails(seller)).rejects.toThrow('администратору');
  });
});

describe('OrdersService — двухшаговая отправка', () => {
  const order = (status: string) => ({
    id: 'o1',
    status,
    user: { id: 'buyer1' },
    items: [{ type: 'pet', itemId: 'A1', quantity: 1 }],
  });

  it('markReady переводит оплаченный заказ в ready и уведомляет покупателя', async () => {
    const { service, orderRepo, animalRepo, notifications } = makeService();
    orderRepo.findOne.mockResolvedValue(order('paid'));
    animalRepo.find.mockResolvedValue([{ id: 'A1' }]); // товар продавца есть в заказе
    orderRepo.save.mockImplementation((o: any) => Promise.resolve(o));

    const result = await service.markReady('o1', seller);

    expect(result.status).toBe('ready');
    expect(notifications.create).toHaveBeenCalledWith(
      'buyer1',
      expect.objectContaining({ type: 'order_ready' }),
    );
  });

  it('markShipped нельзя до отметки «готов к отправке»', async () => {
    const { service, orderRepo, animalRepo } = makeService();
    orderRepo.findOne.mockResolvedValue(order('paid'));
    animalRepo.find.mockResolvedValue([{ id: 'A1' }]);
    await expect(service.markShipped('o1', seller)).rejects.toThrow(BadRequestException);
  });

  it('markShipped из ready переводит в shipped', async () => {
    const { service, orderRepo, animalRepo } = makeService();
    orderRepo.findOne.mockResolvedValue(order('ready'));
    animalRepo.find.mockResolvedValue([{ id: 'A1' }]);
    orderRepo.save.mockImplementation((o: any) => Promise.resolve(o));
    const result = await service.markShipped('o1', seller);
    expect(result.status).toBe('shipped');
  });

  it('markDeliveredByCourier: только курьер и только из shipped', async () => {
    const { service, orderRepo, notifications } = makeService();
    orderRepo.findOne.mockResolvedValue(order('shipped'));
    orderRepo.save.mockImplementation((o: any) => Promise.resolve(o));
    const courier = { id: 'c1', role: 'courier' } as any;
    const result = await service.markDeliveredByCourier('o1', courier);
    expect(result.status).toBe('delivered');
    expect(notifications.create).toHaveBeenCalledWith(
      'buyer1',
      expect.objectContaining({ type: 'order_delivered' }),
    );
    // не курьеру — запрет
    await expect(service.markDeliveredByCourier('o1', seller)).rejects.toThrow('доставщику');
  });
});
