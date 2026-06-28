import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { runThunk } from '@/test/run-thunk';
import {
  fetchOrders,
  fetchCommission,
  fetchCommissionDetails,
  fetchDeliveries,
  fetchSales,
  cancelOrder,
  cancelOrderItem,
  markOrderReceived,
  confirmOrderPayment,
  markReady,
  markShipped,
  markDelivered,
  cancelSale,
} from './orders.thunk';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

const state = { auth: { accessToken: 'jwt' } };
const authHeaders = { headers: { Authorization: 'Bearer jwt' } };

beforeEach(() => vi.clearAllMocks());

describe('orders thunks — GET под JWT', () => {
  const getCases = [
    ['fetchOrders', fetchOrders, '/api/orders'],
    ['fetchCommission', fetchCommission, '/api/orders/commission'],
    ['fetchCommissionDetails', fetchCommissionDetails, '/api/orders/commission/details'],
    ['fetchDeliveries', fetchDeliveries, '/api/orders/deliveries'],
    ['fetchSales', fetchSales, '/api/orders/sales'],
  ];
  it.each(getCases)('%s — GET %s', async (_name, thunk, url) => {
    axios.get.mockResolvedValue({ data: [] });
    const res = await runThunk(thunk(), state);
    expect(axios.get).toHaveBeenCalledWith(url, authHeaders);
    expect(res.meta.requestStatus).toBe('fulfilled');
  });
});

describe('orders thunks — PATCH-действия под JWT', () => {
  const patchCases = [
    ['cancelOrder', () => cancelOrder('o1'), '/api/orders/o1/cancel'],
    [
      'cancelOrderItem',
      () => cancelOrderItem({ orderId: 'o1', itemId: 'i1' }),
      '/api/orders/o1/items/i1/cancel',
    ],
    ['markOrderReceived', () => markOrderReceived('o1'), '/api/orders/o1/received'],
    ['confirmOrderPayment', () => confirmOrderPayment('o1'), '/api/orders/o1/pay'],
    ['markReady', () => markReady('o1'), '/api/orders/o1/ready'],
    ['markShipped', () => markShipped('o1'), '/api/orders/o1/ship'],
    ['markDelivered', () => markDelivered('o1'), '/api/orders/o1/delivered'],
  ];
  it.each(patchCases)('%s — PATCH %s с пустым телом', async (_name, make, url) => {
    axios.patch.mockResolvedValue({ data: { id: 'o1' } });
    const res = await runThunk(make(), state);
    expect(axios.patch).toHaveBeenCalledWith(url, {}, authHeaders);
    expect(res.meta.requestStatus).toBe('fulfilled');
  });

  it('cancelSale — PATCH /api/orders/:id/cancel-sale с причиной', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'o1', status: 'cancelled' } });
    await runThunk(cancelSale({ orderId: 'o1', reason: 'нет товара' }), state);
    expect(axios.patch).toHaveBeenCalledWith(
      '/api/orders/o1/cancel-sale',
      { reason: 'нет товара' },
      authHeaders,
    );
  });

  it('cancelOrder — ошибка уходит в rejectWithValue', async () => {
    axios.patch.mockRejectedValue({ response: { data: { message: 'Уже отменён' } } });
    const res = await runThunk(cancelOrder('o1'), state);
    expect(res.meta.requestStatus).toBe('rejected');
    expect(res.payload).toBe('Уже отменён');
  });
});
