import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// История заказов закрыта API-ключом (заголовок x-api-key), ключ берём из auth-стора.
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const apiKey = getState().auth?.apiKey;
      const response = await axios.get('/api/orders', {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);
