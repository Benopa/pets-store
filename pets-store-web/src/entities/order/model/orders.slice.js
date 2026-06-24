import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/entities/auth';
import {
  fetchOrders,
  fetchSales,
  cancelOrder,
  cancelOrderItem,
  markOrderReceived,
} from './orders.thunk';

// Заменяет заказ в списке покупок свежей версией (после отмены/получения).
const replaceOrder = (state, order) => {
  if (!order) return;
  const i = state.items.findIndex((o) => o.id === order.id);
  if (i !== -1) state.items[i] = order;
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    sales: [],
    loading: false,
    salesLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
    });
    builder.addCase(fetchOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(fetchSales.pending, (state) => {
      state.salesLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSales.fulfilled, (state, action) => {
      state.sales = Array.isArray(action.payload) ? action.payload : [];
      state.salesLoading = false;
    });
    builder.addCase(fetchSales.rejected, (state, action) => {
      state.salesLoading = false;
      state.error = action.payload ?? action.error.message;
    });
    // Отмена/получение возвращают обновлённый заказ — синхронизируем список покупок.
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      replaceOrder(state, action.payload);
    });
    builder.addCase(cancelOrderItem.fulfilled, (state, action) => {
      replaceOrder(state, action.payload);
    });
    builder.addCase(markOrderReceived.fulfilled, (state, action) => {
      replaceOrder(state, action.payload);
    });
    builder.addCase(logout, (state) => {
      state.items = [];
      state.sales = [];
      state.error = null;
    });
  },
});

export default ordersSlice.reducer;
