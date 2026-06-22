// Демо-данные чата (только фронтенд). Позже заменяются данными с бэкенда.
// Переключатель ролей на странице подставляет одного из этих пользователей как «меня».
export const DEMO_USERS = {
  buyer: { id: 'buyer', firstName: 'Гость', lastName: '', role: 'buyer' },
  seller: {
    id: 's1',
    firstName: 'SKZoo',
    lastName: 'House',
    role: 'seller',
    shopName: 'SKZoo House',
  },
  moderator: { id: 'm1', firstName: 'Анна', lastName: 'Модераторова', role: 'moderator' },
  admin: { id: 'admin', firstName: 'Админ', lastName: '', role: 'admin' },
};

export const DEMO_MODERATORS = [{ id: 'm1', name: 'Анна Модераторова' }];

export const ROLE_OPTIONS = [
  { label: 'Покупатель', value: 'buyer' },
  { label: 'Продавец', value: 'seller' },
  { label: 'Модератор', value: 'moderator' },
  { label: 'Администратор', value: 'admin' },
];

// Виды чатов:
//  buyer-seller     — покупатель ↔ продавец (по товару)
//  buyer-support    — покупатель ↔ поддержка (модератор)
//  seller-support   — продавец ↔ модератор
//  admin-moderator  — администрация ↔ модератор
// read = { role: число прочитанных сообщений } — указатель прочитанного для каждой стороны.
export const INITIAL_CHATS = [
  {
    id: 'ch1',
    kind: 'buyer-seller',
    productName: 'Wolf Chan',
    buyer: { id: 'buyer', name: 'Гость' },
    seller: { id: 's1', name: 'SKZoo House' },
    read: { buyer: 1, seller: 3 },
    messages: [
      { from: 'buyer', at: '12:30', text: 'Здравствуйте! Wolf Chan ещё в наличии?' },
      { from: 'seller', at: '12:42', text: 'Добрый день! Да, доступен. Готовы оформить?' },
      { from: 'seller', at: '12:43', text: 'При необходимости пришлю дополнительные фото.' },
    ],
  },
  {
    id: 'ch2',
    kind: 'buyer-support',
    buyer: { id: 'buyer', name: 'Гость' },
    moderatorId: 'm1',
    read: { buyer: 1, moderator: 2 },
    messages: [
      { from: 'buyer', at: '09:10', text: 'Не приходит подтверждение по заказу №1042.' },
      {
        from: 'moderator',
        at: '09:25',
        text: 'Здравствуйте! Проверяем оплату, ответим в течение часа.',
      },
    ],
  },
  {
    id: 'ch3',
    kind: 'seller-support',
    seller: { id: 's1', name: 'SKZoo House' },
    moderatorId: 'm1',
    read: { seller: 1, moderator: 2 },
    messages: [
      { from: 'seller', at: 'Вчера', text: 'Подскажите, почему отклонили карточку «BbokAri»?' },
      {
        from: 'moderator',
        at: 'Вчера',
        text: 'Нужно добавить чёткое фото питомца — текущее не проходит модерацию.',
      },
    ],
  },
  {
    id: 'ch4',
    kind: 'admin-moderator',
    moderatorId: 'm1',
    moderator: { id: 'm1', name: 'Анна Модераторова' },
    read: { admin: 1, moderator: 2 },
    messages: [
      {
        from: 'admin',
        at: '10:05',
        text: 'Анна, обратите внимание на новые карточки в очереди модерации.',
      },
      { from: 'moderator', at: '10:12', text: 'Приняла, проверю до конца дня.' },
    ],
  },
];
