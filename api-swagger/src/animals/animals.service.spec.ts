import { AnimalsService } from './animals.service';

// Прямое инстанцирование сервиса с мок-репозиториями.
const makeService = () => {
  const animalRepo = {
    create: jest.fn((o) => o),
    save: jest.fn((o) => Promise.resolve(o)),
  };
  const categoryRepo = { findOne: jest.fn().mockResolvedValue({ id: 'c1', name: 'Dogs' }) };
  const userRepo = { findOne: jest.fn() };
  const imageRepo = {};
  const shopRepo = { findOne: jest.fn() };
  const notifications = { create: jest.fn() };
  const service = new AnimalsService(
    animalRepo as any,
    categoryRepo as any,
    userRepo as any,
    imageRepo as any,
    shopRepo as any,
    notifications as any,
  );
  return { service, animalRepo, categoryRepo, userRepo, shopRepo };
};

describe('AnimalsService.create', () => {
  it('товар продавца: комиссия 5% зашита в цену (100 → 105)', async () => {
    const { service, userRepo } = makeService();
    userRepo.findOne.mockResolvedValue({ id: 'u1', role: 'seller' });
    const result: any = await service.create(
      { name: 'Tom', categoryId: 'c1', price: 100 } as any,
      'u1',
    );
    expect(result.commissionRate).toBe(0.05);
    expect(result.basePrice).toBe(100);
    expect(result.price).toBe(105);
  });

  it('товар админа без магазина — ошибка (магазин обязателен)', async () => {
    const { service, userRepo } = makeService();
    userRepo.findOne.mockResolvedValue({ id: 'admin1', role: 'admin' });
    await expect(
      service.create({ name: 'X', categoryId: 'c1', price: 100 } as any, 'admin1'),
    ).rejects.toThrow('магазин');
  });

  it('товар админа с магазином: комиссии в цене нет (price = basePrice), shop проставлен', async () => {
    const { service, userRepo, shopRepo } = makeService();
    userRepo.findOne.mockResolvedValue({ id: 'admin1', role: 'admin' });
    shopRepo.findOne.mockResolvedValue({ id: 's1', name: 'SKZoo' });
    const result: any = await service.create(
      { name: 'X', categoryId: 'c1', price: 100, shopId: 's1' } as any,
      'admin1',
    );
    expect(result.commissionRate).toBe(0);
    expect(result.price).toBe(100);
    expect(result.shop).toEqual({ id: 's1', name: 'SKZoo' });
  });
});
