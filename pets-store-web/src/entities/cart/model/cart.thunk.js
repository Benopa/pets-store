import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { fetchOrders } from '@/entities/order';
import { addItem, setQty, removeItem, clearItems } from './cart.slice';

const authHeader = (getState) => {
  const token = getState().auth?.accessToken || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Сохраняет текущую корзину на бэкенд (PUT /auth/me/cart).
export const saveCart = createAsyncThunk('cart/save', async (_, { getState, rejectWithValue }) => {
  try {
    const cart = getState().cart.items;
    const response = await axios.put(
      '/api/auth/me/cart',
      { cart },
      { headers: authHeader(getState) },
    );
    return response.data.cart;
  } catch (err) {
    const message = err.response?.data?.message;
    return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
  }
});

// Оптимистичные операции: меняем стор и сразу персистим на бэкенд.
export const addToCart = (animalId) => (dispatch) => {
  dispatch(addItem(animalId));
  dispatch(saveCart());
};

export const setCartQty = (animalId, quantity) => (dispatch) => {
  dispatch(setQty({ animalId, quantity }));
  dispatch(saveCart());
};

export const removeFromCart = (animalId) => (dispatch) => {
  dispatch(removeItem(animalId));
  dispatch(saveCart());
};

export const clearCart = () => (dispatch) => {
  dispatch(clearItems());
  dispatch(saveCart());
};

// Оформление заказа: создаём заказ из ВЫБРАННЫХ позиций (по API-ключу) →
// убираем из корзины только заказанное (остальное остаётся) → обновляем историю.
export const checkout = createAsyncThunk(
  'cart/checkout',
  async (
    { selectedIds, total, comment, address } = {},
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const apiKey = getState().auth?.apiKey;
      const cartItems = getState().cart.items;
      const ids = selectedIds?.length ? selectedIds : cartItems.map((i) => i.animalId);
      const idSet = new Set(ids);
      const items = cartItems
        .filter((i) => idSet.has(i.animalId))
        .map((i) => ({
          type: 'pet',
          itemId: i.animalId,
          quantity: i.quantity,
          ...(comment ? { note: comment } : {}),
        }));
      const response = await axios.post(
        '/api/orders',
        { items, total, ...(address ? { address } : {}) },
        { headers: apiKey ? { 'x-api-key': apiKey } : {} },
      );
      ids.forEach((id) => dispatch(removeItem(id)));
      await dispatch(saveCart());
      dispatch(fetchOrders());
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);
