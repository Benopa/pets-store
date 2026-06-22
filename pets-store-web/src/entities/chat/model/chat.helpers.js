// Чистые помощники логики чата (без UI). Используются и в slice, и в компонентах.

// Базовая роль пользователя в обычном чате (admin приравнивается к moderator).
export function mineRole(user) {
  if (!user) return 'buyer';
  if (user.role === 'seller') return 'seller';
  if (user.role === 'moderator' || user.role === 'admin') return 'moderator';
  return 'buyer';
}

export function displayName(user) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Гость';
}

// Роль текущего пользователя именно в этом чате (в admin-moderator различаем admin/moderator).
export function roleInChat(chat, user) {
  if (!user) return 'buyer';
  if (chat.kind === 'admin-moderator') return user.role === 'admin' ? 'admin' : 'moderator';
  return mineRole(user);
}

// Непрочитанные для роли = сообщения после её указателя, отправленные не ею.
export function chatUnread(chat, role) {
  const r = (chat.read && chat.read[role]) || 0;
  return chat.messages.slice(r).filter((m) => m.from !== role).length;
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

// Какие чаты видит данный пользователь.
export function visibleChatsFor(chats, user) {
  const r = user.role;
  if (r === 'admin') {
    return chats.filter(
      (c) =>
        c.kind === 'buyer-support' || c.kind === 'seller-support' || c.kind === 'admin-moderator',
    );
  }
  if (r === 'moderator') {
    return chats.filter(
      (c) =>
        c.kind === 'buyer-support' ||
        c.kind === 'seller-support' ||
        (c.kind === 'admin-moderator' && c.moderatorId === user.id),
    );
  }
  if (r === 'seller') return chats.filter((c) => c.seller && c.seller.id === user.id);
  return chats.filter((c) => c.buyer && c.buyer.id === user.id);
}

// Описание собеседника с точки зрения текущего пользователя.
// icon — ключ ('shop' | 'user' | 'support' | 'crown' | 'safety'), элемент рисуется в UI.
export function counterparty(chat, user) {
  const role = mineRole(user);
  const sub = chat.productName ? `по товару «${chat.productName}»` : null;
  if (chat.kind === 'admin-moderator') {
    return user.role === 'admin'
      ? {
          name: chat.moderator?.name || 'Модератор',
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
  if (role === 'buyer') {
    return chat.kind === 'buyer-seller'
      ? {
          name: chat.seller?.name || 'Магазин',
          sub: sub || 'Продавец',
          tag: 'Продавец',
          color: '#9850fd',
          icon: 'shop',
        }
      : {
          name: 'Поддержка',
          sub: 'Модератор',
          tag: 'Поддержка',
          color: '#2aa775',
          icon: 'support',
        };
  }
  if (role === 'seller') {
    return chat.kind === 'buyer-seller'
      ? {
          name: chat.buyer?.name || 'Покупатель',
          sub: sub || 'Покупатель',
          tag: 'Покупатель',
          color: '#d48806',
          icon: 'user',
        }
      : {
          name: 'Поддержка',
          sub: 'Модератор',
          tag: 'Поддержка',
          color: '#2aa775',
          icon: 'support',
        };
  }
  return chat.kind === 'buyer-support'
    ? {
        name: chat.buyer?.name || 'Покупатель',
        sub: 'Покупатель',
        tag: 'Покупатель',
        color: '#d48806',
        icon: 'user',
      }
    : {
        name: chat.seller?.name || 'Продавец',
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
