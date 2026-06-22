import { createAsyncThunk } from '@reduxjs/toolkit';
import { axios, bearer, errMessage } from '@/shared/api';

// Лента уведомлений текущего пользователя (JWT).
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get('/api/notifications', { headers: bearer(getState) });
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Отметить одно уведомление прочитанным → возвращаем его id для обновления стора.
export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, { headers: bearer(getState) });
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Отметить все уведомления прочитанными.
export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { getState, rejectWithValue }) => {
    try {
      await axios.patch('/api/notifications/read-all', {}, { headers: bearer(getState) });
      return true;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);
