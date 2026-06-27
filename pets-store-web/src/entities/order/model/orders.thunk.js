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

// Сводка по комиссии сайта (только для админа): сколько магазин заработал на комиссии.
export const fetchCommission = createAsyncThunk(
  'orders/fetchCommission',
  async (_, { getState, rejectWithValue }) => {
    try {
      const apiKey = getState().auth?.apiKey;
      const response = await axios.get('/api/orders/commission', {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);

// Детализация зачислений сайту (только для админа): список поступлений с датой, товаром,
// продавцом и магазином. Используется в разделе «Прибыль» с фильтрами по периоду/магазину/продавцу.
export const fetchCommissionDetails = createAsyncThunk(
  'orders/fetchCommissionDetails',
  async (_, { getState, rejectWithValue }) => {
    try {
      const apiKey = getState().auth?.apiKey;
      const response = await axios.get('/api/orders/commission/details', {
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

// Подтверждение онлайн-оплаты заказа (после имитации связи с банком): awaiting → paid.
export const confirmOrderPayment = createAsyncThunk(
  'orders/confirmOrderPayment',
  (orderId, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/pay`, getState, rejectWithValue),
);

// Передача заказа в доставку продавцом (статус → shipped).
export const markShipped = createAsyncThunk(
  'orders/markShipped',
  (orderId, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/ship`, getState, rejectWithValue),
);

// Отмена заказа продавцом с указанием причины (для заказов, содержащих его товар).
export const cancelSale = createAsyncThunk(
  'orders/cancelSale',
  async ({ orderId, reason }, { getState, rejectWithValue }) => {
    try {
      const apiKey = getState().auth?.apiKey;
      const response = await axios.patch(
        `/api/orders/${orderId}/cancel-sale`,
        { reason },
        { headers: apiKey ? { 'x-api-key': apiKey } : {} },
      );
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);
