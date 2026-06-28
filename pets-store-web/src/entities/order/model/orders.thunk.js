import { createAsyncThunk } from '@reduxjs/toolkit';
import { axios, bearer } from '@/shared/api';

const errText = (err) => {
  const message = err.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || err.message;
};

// История заказов — под JWT (заголовок Authorization: Bearer ...).
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get('/api/orders', { headers: bearer(getState) });
      return response.data;
    } catch (err) {
      return rejectWithValue(errText(err));
    }
  },
);

// Сводка по комиссии сайта (только для админа): сколько магазин заработал на комиссии.
export const fetchCommission = createAsyncThunk(
  'orders/fetchCommission',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get('/api/orders/commission', { headers: bearer(getState) });
      return response.data;
    } catch (err) {
      return rejectWithValue(errText(err));
    }
  },
);

// Детализация зачислений сайту (только для админа): список поступлений с датой, товаром,
// продавцом и магазином. Используется в разделе «Прибыль» с фильтрами по периоду/магазину/продавцу.
export const fetchCommissionDetails = createAsyncThunk(
  'orders/fetchCommissionDetails',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get('/api/orders/commission/details', {
        headers: bearer(getState),
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(errText(err));
    }
  },
);

// Заказы для доставщика (роль courier): готовы к отправке / в доставке / получены, с адресами.
export const fetchDeliveries = createAsyncThunk(
  'orders/fetchDeliveries',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get('/api/orders/deliveries', { headers: bearer(getState) });
      return response.data;
    } catch (err) {
      return rejectWithValue(errText(err));
    }
  },
);

// История продаж продавца: заказы, содержащие его товары (которые уже купили).
export const fetchSales = createAsyncThunk(
  'orders/fetchSales',
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await axios.get('/api/orders/sales', { headers: bearer(getState) });
      return response.data;
    } catch (err) {
      return rejectWithValue(errText(err));
    }
  },
);

const patchOrder = async (url, getState, rejectWithValue) => {
  try {
    const response = await axios.patch(url, {}, { headers: bearer(getState) });
    return response.data;
  } catch (err) {
    return rejectWithValue(errText(err));
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

// Отметка «готов к отправке» продавцом (статус → ready). Первый шаг перед передачей в доставку.
export const markReady = createAsyncThunk(
  'orders/markReady',
  (orderId, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/ready`, getState, rejectWithValue),
);

// Передача заказа в доставку продавцом (статус → shipped). Доступна только после «готов к отправке».
export const markShipped = createAsyncThunk(
  'orders/markShipped',
  (orderId, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/ship`, getState, rejectWithValue),
);

// Доставщик отмечает заказ переданным покупателю (статус → delivered).
export const markDelivered = createAsyncThunk(
  'orders/markDelivered',
  (orderId, { getState, rejectWithValue }) =>
    patchOrder(`/api/orders/${orderId}/delivered`, getState, rejectWithValue),
);

// Отмена заказа продавцом с указанием причины (для заказов, содержащих его товар).
export const cancelSale = createAsyncThunk(
  'orders/cancelSale',
  async ({ orderId, reason }, { getState, rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `/api/orders/${orderId}/cancel-sale`,
        { reason },
        { headers: bearer(getState) },
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(errText(err));
    }
  },
);
