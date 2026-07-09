import { ChatService } from './chat.service';

// Лёгкие моки репозиториев/сервиса — инстанцируем сервис напрямую (без Nest DI).
const makeService = () => {
  const conversationRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (c: unknown) => c),
    create: jest.fn((c: unknown) => c),
    createQueryBuilder: jest.fn(),
  };
  const messageRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (m: unknown) => ({ ...(m as object), id: 'msg1', createdAt: new Date() })),
    create: jest.fn((m: unknown) => m),
    createQueryBuilder: jest.fn(),
  };
  const usersService = { findById: jest.fn() };
  const service = new ChatService(
    conversationRepo as any,
    messageRepo as any,
    usersService as any,
  );
  return { service, conversationRepo, messageRepo, usersService };
};

const buyer = { id: 'b1', role: 'buyer' } as any;
const seller = { id: 's1', role: 'seller' } as any;
const moderator = { id: 'm1', role: 'moderator' } as any;
const admin = { id: 'a1', role: 'admin' } as any;

describe('ChatService.findOrCreateConversation — матрица прав', () => {
  it('покупатель может начать чат с продавцом', async () => {
    const { service, conversationRepo, usersService } = makeService();
    usersService.findById.mockResolvedValue({ id: 's1', role: 'seller' });
    conversationRepo.findOne.mockResolvedValue(null);
    const conv = await service.findOrCreateConversation(buyer, {
      kind: 'buyer-seller',
      sellerId: 's1',
      productName: 'Wolf Chan',
    } as any);
    expect(conv).toMatchObject({ kind: 'buyer-seller', buyerId: 'b1', sellerId: 's1' });
  });

  it('модератор не может начать buyer-seller чат', async () => {
    const { service } = makeService();
    await expect(
      service.findOrCreateConversation(moderator, { kind: 'buyer-seller', sellerId: 's1' } as any),
    ).rejects.toThrow('Only buyers');
  });

  it('нельзя написать самому себе', async () => {
    const { service } = makeService();
    await expect(
      service.findOrCreateConversation(seller, { kind: 'buyer-seller', sellerId: 's1' } as any),
    ).rejects.toThrow('yourself');
  });

  it('получателем buyer-seller чата не может быть модератор или курьер', async () => {
    const { service, usersService } = makeService();
    usersService.findById.mockResolvedValue({ id: 'm1', role: 'moderator' });
    await expect(
      service.findOrCreateConversation(buyer, { kind: 'buyer-seller', sellerId: 'm1' } as any),
    ).rejects.toThrow('not a seller');
  });

  it('владельцу товара, переключившемуся в кабинет покупателя, можно написать', async () => {
    const { service, conversationRepo, usersService } = makeService();
    usersService.findById.mockResolvedValue({ id: 's1', role: 'buyer' });
    conversationRepo.findOne.mockResolvedValue(null);
    const conv = await service.findOrCreateConversation(buyer, {
      kind: 'buyer-seller',
      sellerId: 's1',
    } as any);
    expect(conv).toMatchObject({ kind: 'buyer-seller', buyerId: 'b1', sellerId: 's1' });
  });

  it('продавец не может открыть buyer-support (его чат — seller-support)', async () => {
    const { service } = makeService();
    await expect(
      service.findOrCreateConversation(seller, { kind: 'buyer-support' } as any),
    ).rejects.toThrow('Only buyers');
  });

  it('продавец открывает seller-support', async () => {
    const { service, conversationRepo } = makeService();
    conversationRepo.findOne.mockResolvedValue(null);
    const conv = await service.findOrCreateConversation(seller, { kind: 'seller-support' } as any);
    expect(conv).toMatchObject({ kind: 'seller-support', sellerId: 's1' });
  });

  it('модератор открывает чат с администрацией (своя сторона)', async () => {
    const { service, conversationRepo } = makeService();
    conversationRepo.findOne.mockResolvedValue(null);
    const conv = await service.findOrCreateConversation(moderator, {
      kind: 'admin-moderator',
    } as any);
    expect(conv).toMatchObject({ kind: 'admin-moderator', moderatorId: 'm1' });
  });

  it('админ начинает диалог с конкретным модератором', async () => {
    const { service, conversationRepo, usersService } = makeService();
    usersService.findById.mockResolvedValue({ id: 'm1', role: 'moderator' });
    conversationRepo.findOne.mockResolvedValue(null);
    const conv = await service.findOrCreateConversation(admin, {
      kind: 'admin-moderator',
      moderatorId: 'm1',
    } as any);
    expect(conv).toMatchObject({ kind: 'admin-moderator', moderatorId: 'm1' });
  });

  it('покупатель не может открыть admin-moderator чат', async () => {
    const { service } = makeService();
    await expect(
      service.findOrCreateConversation(buyer, { kind: 'admin-moderator' } as any),
    ).rejects.toThrow('Not allowed');
  });

  it('существующий диалог возвращается и «всплывает» из скрытых', async () => {
    const { service, conversationRepo } = makeService();
    const existing = {
      id: 'c1',
      kind: 'buyer-support',
      buyerId: 'b1',
      deletedFor: ['b1', 'x'],
    };
    conversationRepo.findOne.mockResolvedValue(existing);
    const conv = await service.findOrCreateConversation(buyer, { kind: 'buyer-support' } as any);
    expect(conv.id).toBe('c1');
    expect(conv.deletedFor).toEqual(['x']);
    expect(conversationRepo.save).toHaveBeenCalled();
  });
});

describe('ChatService.canAccess / sideOf', () => {
  const support = { kind: 'buyer-support', buyerId: 'b1' } as any;
  const staffChat = { kind: 'admin-moderator', moderatorId: 'm1' } as any;
  const bs = { kind: 'buyer-seller', buyerId: 'b1', sellerId: 's1' } as any;

  it('support-чат видят клиент, модератор и админ, но не чужой покупатель', () => {
    const { service } = makeService();
    expect(service.canAccess(support, buyer)).toBe(true);
    expect(service.canAccess(support, moderator)).toBe(true);
    expect(service.canAccess(support, admin)).toBe(true);
    expect(service.canAccess(support, { id: 'b2', role: 'buyer' } as any)).toBe(false);
    expect(service.canAccess(support, seller)).toBe(false);
  });

  it('admin-moderator чат виден только своему модератору и админам', () => {
    const { service } = makeService();
    expect(service.canAccess(staffChat, moderator)).toBe(true);
    expect(service.canAccess(staffChat, admin)).toBe(true);
    expect(service.canAccess(staffChat, { id: 'm2', role: 'moderator' } as any)).toBe(false);
  });

  it('buyer-seller чат виден только участникам', () => {
    const { service } = makeService();
    expect(service.canAccess(bs, buyer)).toBe(true);
    expect(service.canAccess(bs, seller)).toBe(true);
    expect(service.canAccess(bs, moderator)).toBe(false);
  });

  it('сторона в support-чате: клиент против staff (админ = moderator)', () => {
    const { service } = makeService();
    expect(service.sideOf(support, buyer)).toBe('buyer');
    expect(service.sideOf(support, moderator)).toBe('moderator');
    expect(service.sideOf(support, admin)).toBe('moderator');
    expect(service.sideOf(staffChat, admin)).toBe('admin');
    expect(service.sideOf(staffChat, moderator)).toBe('moderator');
  });
});

describe('ChatService.sendMessage', () => {
  it('пустое сообщение отклоняется', async () => {
    const { service } = makeService();
    await expect(service.sendMessage(buyer, 'c1', '   ', [])).rejects.toThrow('empty');
  });

  it('сообщение сохраняется, диалог поднимается и раскрывается у скрывших', async () => {
    const { service, conversationRepo, messageRepo } = makeService();
    const conv = { id: 'c1', kind: 'buyer-seller', buyerId: 'b1', sellerId: 's1', deletedFor: ['s1'] };
    conversationRepo.findOne.mockResolvedValue(conv);
    const { message, conversation } = await service.sendMessage(buyer, 'c1', 'Привет', []);
    expect(message).toMatchObject({ senderId: 'b1', senderRole: 'buyer', text: 'Привет' });
    expect(conversation.deletedFor).toEqual([]);
    expect(conversation.lastMessageAt).toBeInstanceOf(Date);
    expect(messageRepo.save).toHaveBeenCalled();
  });

  it('вложения фильтруются: только ссылки на /uploads/', async () => {
    const { service, conversationRepo } = makeService();
    const conv = { id: 'c1', kind: 'buyer-seller', buyerId: 'b1', sellerId: 's1', deletedFor: [] };
    conversationRepo.findOne.mockResolvedValue(conv);
    const { message } = await service.sendMessage(buyer, 'c1', '', [
      { type: 'image', name: 'a.png', size: 10, url: '/uploads/a.png' },
      { type: 'file', name: 'evil', size: 10, url: 'javascript:alert(1)' } as any,
    ]);
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0].url).toBe('/uploads/a.png');
  });

  it('чужой пользователь не может писать в диалог', async () => {
    const { service, conversationRepo } = makeService();
    conversationRepo.findOne.mockResolvedValue({
      id: 'c1',
      kind: 'buyer-seller',
      buyerId: 'b1',
      sellerId: 's1',
      deletedFor: [],
    });
    await expect(
      service.sendMessage({ id: 'b2', role: 'buyer' } as any, 'c1', 'hi', []),
    ).rejects.toThrow('Not allowed');
  });
});

describe('ChatService.hideForUser', () => {
  it('скрывает диалог только у себя', async () => {
    const { service, conversationRepo } = makeService();
    const conv = { id: 'c1', kind: 'buyer-seller', buyerId: 'b1', sellerId: 's1', deletedFor: [] };
    conversationRepo.findOne.mockResolvedValue(conv);
    await service.hideForUser(buyer, 'c1');
    expect(conv.deletedFor).toEqual(['b1']);
    expect(conversationRepo.save).toHaveBeenCalled();
  });
});
