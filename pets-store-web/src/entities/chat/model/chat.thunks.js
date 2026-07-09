import { createAsyncThunk } from '@reduxjs/toolkit';
import { axios, bearer, errMessage } from '@/shared/api';

// Список моих диалогов: [{ conversation, lastMessage, unreadCount }].
// Грузится при входе — накопленные за оффлайн непрочитанные видны сразу.
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get('/api/chat/conversations', { headers: bearer(getState) });
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// История сообщений диалога (при открытии).
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/chat/conversations/${conversationId}/messages`, {
        headers: bearer(getState),
      });
      return { conversationId, messages: res.data };
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Создать (или получить существующий) диалог: buyer-seller / *-support / admin-moderator.
export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (dto, { getState, rejectWithValue }) => {
    try {
      const res = await axios.post('/api/chat/conversations', dto, { headers: bearer(getState) });
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// «Удалить чат» — скрыть только у себя (у собеседника переписка остаётся).
export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`/api/chat/conversations/${conversationId}`, {
        headers: bearer(getState),
      });
      return conversationId;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Открытие диалога: все входящие становятся прочитанными; бэкенд оповещает
// собеседника по сокету (статус «прочитано» обновляется у него живьём).
export const markConversationRead = createAsyncThunk(
  'chat/markConversationRead',
  async (conversationId, { getState, rejectWithValue }) => {
    try {
      await axios.post(
        `/api/chat/conversations/${conversationId}/read`,
        {},
        { headers: bearer(getState) },
      );
      return conversationId;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Загрузка вложения перед отправкой сообщения → { type, name, size, url }.
export const uploadChatFile = createAsyncThunk(
  'chat/uploadChatFile',
  async (file, { getState, rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post('/api/chat/upload', form, { headers: bearer(getState) });
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);
