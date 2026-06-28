import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/entities/auth';
import {
  fetchOrders,
  fetchSales,
  fetchCommission,
  fetchCommissionDetails,
  fetchDeliveries,
  cancelOrder,
  cancelOrderItem,
  markOrderReceived,
  confirmOrderPayment,
  markReady,
  markShipped,
  markDelivered,
  cancelSale,
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
    deliveries: [],
    deliveriesLoading: false,
    commission: 0,
    commissionDetails: [],
    commissionDetailsLoading: false,
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
    // Заказы доставщика (роль courier): { id, status, address, buyer, items, ... }.
    builder.addCase(fetchDeliveries.pending, (state) => {
      state.deliveriesLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDeliveries.fulfilled, (state, action) => {
      state.deliveries = Array.isArray(action.payload) ? action.payload : [];
      state.deliveriesLoading = false;
    });
    builder.addCase(fetchDeliveries.rejected, (state, action) => {
      state.deliveriesLoading = false;
      state.error = action.payload ?? action.error.message;
    });
    // Отметка «передан покупателю» возвращает сырой заказ — обновляем статус в списке доставок.
    builder.addCase(markDelivered.fulfilled, (state, action) => {
      const order = action.payload;
      if (!order) return;
      const delivery = state.deliveries.find((d) => d.id === order.id);
      if (delivery) delivery.status = order.status;
    });
    // Комиссия магазина (для админа): { commission }.
    builder.addCase(fetchCommission.fulfilled, (state, action) => {
      state.commission = Number(action.payload?.commission ?? 0);
    });
    // Детализация зачислений (для админа): { total, items }.
    builder.addCase(fetchCommissionDetails.pending, (state) => {
      state.commissionDetailsLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCommissionDetails.fulfilled, (state, action) => {
      state.commissionDetails = Array.isArray(action.payload?.items) ? action.payload.items : [];
      state.commission = Number(action.payload?.total ?? state.commission);
      state.commissionDetailsLoading = false;
    });
    builder.addCase(fetchCommissionDetails.rejected, (state, action) => {
      state.commissionDetailsLoading = false;
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
    // Подтверждение онлайн-оплаты возвращает заказ со статусом paid — обновляем список.
    builder.addCase(confirmOrderPayment.fulfilled, (state, action) => {
      replaceOrder(state, action.payload);
    });
    // «Готов к отправке» возвращает сырой заказ — обновляем статус продажи на месте,
    // сохраняя обогащённые поля (товары/покупатель) исходной записи продажи.
    builder.addCase(markReady.fulfilled, (state, action) => {
      const order = action.payload;
      if (!order) return;
      const sale = state.sales.find((s) => s.id === order.id);
      if (sale) sale.status = order.status;
    });
    // Передача в доставку возвращает сырой заказ — обновляем статус продажи на месте,
    // сохраняя обогащённые поля (товары/покупатель) исходной записи продажи.
    builder.addCase(markShipped.fulfilled, (state, action) => {
      const order = action.payload;
      if (!order) return;
      const sale = state.sales.find((s) => s.id === order.id);
      if (sale) sale.status = order.status;
    });
    // Отмена продавцом возвращает сырой заказ — обновляем статус и причину в продаже,
    // сохраняя обогащённые поля (товары/покупатель) исходной записи продажи.
    builder.addCase(cancelSale.fulfilled, (state, action) => {
      const order = action.payload;
      if (!order) return;
      const sale = state.sales.find((s) => s.id === order.id);
      if (sale) {
        sale.status = order.status;
        sale.cancelReason = order.cancelReason ?? null;
      }
    });
    builder.addCase(logout, (state) => {
      state.items = [];
      state.sales = [];
      state.deliveries = [];
      state.commission = 0;
      state.commissionDetails = [];
      state.error = null;
    });
  },
});

export default ordersSlice.reducer;
