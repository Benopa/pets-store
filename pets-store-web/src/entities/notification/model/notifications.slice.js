import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/entities/auth';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.thunk';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.isRead = true;
    });
    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.items.forEach((n) => {
        n.isRead = true;
      });
    });
    builder.addCase(logout, (state) => {
      state.items = [];
      state.error = null;
    });
  },
});

// Число непрочитанных — для бейджа в шапке.
export const selectUnreadCount = (state) =>
  state.notifications.items.filter((n) => !n.isRead).length;

export default notificationsSlice.reducer;
