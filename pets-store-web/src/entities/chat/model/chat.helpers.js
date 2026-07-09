// Чистые помощники логики чата (без UI). Используются и в slice, и в компонентах.
// Диалог (conversation) приходит с бэкенда: { id, kind, buyerId, sellerId, moderatorId,
// buyer, seller, moderator, productName, lastMessage, unreadCount, ... }.

// Базовая роль пользователя (admin приравнивается к moderator — сторона «поддержка»).
export function mineRole(user) {
  if (!user) return 'buyer';
  if (user.role === 'seller') return 'seller';
  if (user.role === 'moderator' || user.role === 'admin') return 'moderator';
  return 'buyer';
}

export function displayName(user) {
  return (
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Гость'
  );
}

// «Сторона» текущего пользователя именно в этом чате — зеркалит ChatService.sideOf.
// Сообщение рисуется справа, если message.senderRole === roleInChat(chat, me).
export function roleInChat(chat, user) {
  if (!user) return 'buyer';
  if (chat.kind === 'admin-moderator') return user.role === 'admin' ? 'admin' : 'moderator';
  if (chat.buyerId === user.id) return 'buyer';
  if (chat.sellerId === user.id) return 'seller';
  return 'moderator';
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

// Время/дата сообщения: сегодня — только время, вчера — «Вчера HH:mm», старше — дата и время.
export function formatMessageAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return time;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Вчера ${time}`;
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  return `${date} ${time}`;
}

// Описание собеседника с точки зрения текущего пользователя.
// icon — ключ ('shop' | 'user' | 'support' | 'crown' | 'safety'), элемент рисуется в UI.
export function counterparty(chat, user) {
  const role = mineRole(user);
  const sub = chat.productName ? `по товару «${chat.productName}»` : null;
  if (chat.kind === 'admin-moderator') {
    return user?.role === 'admin'
      ? {
          name: displayName(chat.moderator) || 'Модератор',
          sub: 'Модератор',
          tag: 'Модератор',
          color: '#2f54eb',
          icon: 'safety',
        }
      : {
          name: 'Администрация',
          sub: 'Команда поддержки',
          tag: 'Администратор',
          color: '#9850fd',
          icon: 'crown',
        };
  }
  // Товарные чаты: смотрю ли я как покупающая сторона этого диалога.
  if (chat.kind === 'buyer-seller') {
    return chat.buyerId === user?.id
      ? {
          name: displayName(chat.seller),
          sub: sub || 'Продавец',
          tag: 'Продавец',
          color: '#9850fd',
          icon: 'shop',
        }
      : {
          name: displayName(chat.buyer),
          sub: sub || 'Покупатель',
          tag: 'Покупатель',
          color: '#d48806',
          icon: 'user',
        };
  }
  // Support-чаты: клиент видит «Поддержку», персонал — клиента.
  if (role === 'buyer' || role === 'seller') {
    return {
      name: 'Поддержка',
      sub: 'Модератор',
      tag: 'Поддержка',
      color: '#2aa775',
      icon: 'support',
    };
  }
  return chat.kind === 'buyer-support'
    ? {
        name: displayName(chat.buyer),
        sub: 'Покупатель',
        tag: 'Покупатель',
        color: '#d48806',
        icon: 'user',
      }
    : {
        name: displayName(chat.seller),
        sub: 'Продавец',
        tag: 'Продавец',
        color: '#9850fd',
        icon: 'shop',
      };
}

export const TAG_COLOR = {
  Продавец: 'purple',
  Покупатель: 'gold',
  Поддержка: 'green',
  Модератор: 'blue',
  Администратор: 'purple',
};
