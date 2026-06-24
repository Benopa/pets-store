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

// История продаж продавца: заказы, содержащие его товары (которые уже купили).
export const fetchSales = createAsyncThunk(
  'orders/fetchSales',
  async (_, { getState, rejectWithValue }) => {
    try {
      const apiKey = getState().auth?.apiKey;
      const response = await axios.get('/api/orders/sales', {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);

const patchOrder = async (url, getState, rejectWithValue) => {
  try {
    const apiKey = getState().auth?.apiKey;
    const response = await axios.patch(url, {}, { headers: apiKey ? { 'x-api-key': apiKey } : {} });
    return response.data;
  } catch (err) {
    const message = err.response?.data?.message;
    return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
  }
};

// Отмена всего заказа (доступна, пока заказ не получен).
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  (orderId, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/cancel`, getState, rejectWithValue),
);

// Отмена одной позиции заказа.
export const cancelOrderItem = createAsyncThunk(
  'orders/cancelOrderItem',
  ({ orderId, itemId }, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/items/${itemId}/cancel`, getState, rejectWithValue),
);

// Подтверждение получения заказа.
export const markOrderReceived = createAsyncThunk(
  'orders/markOrderReceived',
  (orderId, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/received`, getState, rejectWithValue),
);
