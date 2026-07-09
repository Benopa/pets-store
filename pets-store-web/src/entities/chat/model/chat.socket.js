import { io } from 'socket.io-client';
import {
  socketConnected,
  socketDisconnected,
  messageReceived,
  readReceiptReceived,
} from './chat.slice';

// Синглтон Socket.IO-соединения. Подключается в app.component при наличии токена
// (store передаётся параметром — без импорта, чтобы не создавать цикл слоёв FSD).
// Авторизация: JWT в handshake (auth.token) — сервер рвёт соединение при невалидном.
// Соединение ходит на same-origin /socket.io: в dev проксирует vite, в проде nginx.
let socket = null;

export function connectChatSocket(store) {
  if (socket) return socket;
  const token = store.getState().auth.accessToken || localStorage.getItem('token');
  if (!token) return null;

  socket = io('/', { path: '/socket.io', auth: { token } });

  // me читаем в момент события (auth мог догрузиться после подключения).
  const me = () => {
    const { userId, role } = store.getState().auth;
    return { id: userId, role };
  };

  socket.on('connect', () => store.dispatch(socketConnected()));
  socket.on('disconnect', () => store.dispatch(socketDisconnected()));
  socket.on('message:new', (payload) => {
    store.dispatch(messageReceived({ ...payload, me: me() }));
  });
  socket.on('conversation:read', (payload) => {
    store.dispatch(readReceiptReceived({ ...payload, me: me() }));
  });
  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Отправка сообщения; ack бэкенда → колбэк ({ status } | { error }).
export function emitChatMessage({ conversationId, text, attachments }, callback) {
  if (!socket?.connected) {
    callback?.({ error: 'Нет соединения с чатом' });
    return;
  }
  socket.emit('message:send', { conversationId, text, attachments }, callback);
}
