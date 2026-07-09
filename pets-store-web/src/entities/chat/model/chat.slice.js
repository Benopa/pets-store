import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/entities/auth';
import {
  fetchConversations,
  fetchMessages,
  createConversation,
  deleteConversation,
  markConversationRead,
} from './chat.thunks';
import { roleInChat } from './chat.helpers';

// Сводка бэкенда { conversation, lastMessage, unreadCount } → плоский объект диалога.
const flatten = ({ conversation, lastMessage, unreadCount }) => ({
  ...conversation,
  lastMessage: lastMessage ?? null,
  unreadCount: unreadCount ?? 0,
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    // Диалоги (с lastMessage/unreadCount), новые сверху.
    conversations: [],
    // Сообщения по id диалога: { [conversationId]: [...] } — грузятся при открытии.
    messages: {},
    // Открытый диалог.
    selectedId: null,
    connected: false,
    loading: false,
    error: null,
  },
  reducers: {
    selectChat(state, action) {
      state.selectedId = action.payload;
    },
    socketConnected(state) {
      state.connected = true;
    },
    socketDisconnected(state) {
      state.connected = false;
    },
    // Событие message:new по сокету. me передаёт сокет-модуль (редьюсер не видит auth).
    // Приходит и для закрытых диалогов — обновляет последнее сообщение и бейджи.
    messageReceived(state, action) {
      const { conversation, message, me } = action.payload;
      let chat = state.conversations.find((c) => c.id === conversation.id);
      if (!chat) {
        chat = { ...conversation, lastMessage: null, unreadCount: 0 };
        state.conversations.unshift(chat);
      } else {
        Object.assign(chat, conversation, {
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCount,
        });
        // Свежий диалог — наверх.
        state.conversations = [chat, ...state.conversations.filter((c) => c.id !== chat.id)];
      }
      chat.lastMessage = message;
      const mine = message.senderRole === roleInChat(chat, me);
      // Чужое сообщение в неоткрытый диалог — плюс к непрочитанным
      // (в открытом чате окно сразу пометит прочитанным).
      if (!mine && state.selectedId !== chat.id) {
        chat.unreadCount += 1;
      }
      const list = state.messages[chat.id];
      if (list && !list.some((m) => m.id === message.id)) {
        list.push(message);
      }
    },
    // Событие conversation:read: сторона readerSide открыла диалог.
    readReceiptReceived(state, action) {
      const { conversationId, readerSide, me } = action.payload;
      const chat = state.conversations.find((c) => c.id === conversationId);
      if (!chat) return;
      const mySide = roleInChat(chat, me);
      if (readerSide === mySide) {
        // Прочитал я сам (другая вкладка / коллега по стороне поддержки) — сбросить бейдж.
        chat.unreadCount = 0;
        (state.messages[conversationId] || []).forEach((m) => {
          if (m.senderRole !== mySide) m.isRead = true;
        });
      } else {
        // Прочитал собеседник — мои сообщения получают статус «прочитано».
        (state.messages[conversationId] || []).forEach((m) => {
          if (m.senderRole !== readerSide) m.isRead = true;
        });
        if (chat.lastMessage && chat.lastMessage.senderRole !== readerSide) {
          chat.lastMessage = { ...chat.lastMessage, isRead: true };
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConversations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.conversations = (action.payload || []).map(flatten);
      state.loading = false;
      // Выбранный диалог мог быть скрыт/недоступен — сбрасываем выбор.
      if (state.selectedId && !state.conversations.some((c) => c.id === state.selectedId)) {
        state.selectedId = null;
      }
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
    });
    builder.addCase(createConversation.fulfilled, (state, action) => {
      const conversation = action.payload;
      if (!state.conversations.some((c) => c.id === conversation.id)) {
        state.conversations.unshift({ ...conversation, lastMessage: null, unreadCount: 0 });
      }
      state.selectedId = conversation.id;
    });
    builder.addCase(deleteConversation.fulfilled, (state, action) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload);
      delete state.messages[action.payload];
      if (state.selectedId === action.payload) {
        state.selectedId = null;
      }
    });
    builder.addCase(markConversationRead.fulfilled, (state, action) => {
      const chat = state.conversations.find((c) => c.id === action.payload);
      if (chat) chat.unreadCount = 0;
    });
    builder.addCase(logout, (state) => {
      state.conversations = [];
      state.messages = {};
      state.selectedId = null;
      state.connected = false;
      state.error = null;
    });
  },
});

// «Я» для чата — из auth-стора.
export const selectChatMe = (state) => ({
  id: state.auth.userId,
  role: state.auth.role,
  firstName: state.auth.firstName,
  lastName: state.auth.lastName,
});

// Всего непрочитанных сообщений — бейдж чата в шапке.
export const selectChatUnreadTotal = (state) =>
  state.chat.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

export const {
  selectChat,
  socketConnected,
  socketDisconnected,
  messageReceived,
  readReceiptReceived,
} = chatSlice.actions;
export default chatSlice.reducer;
