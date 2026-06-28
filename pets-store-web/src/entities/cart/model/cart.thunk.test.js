import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { runThunk } from '@/test/run-thunk';
import { saveCart, checkout } from './cart.thunk';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe('cart thunks', () => {
  it('saveCart — PUT /api/auth/me/cart текущей корзиной (Bearer)', async () => {
    const cart = [{ animalId: 'a1', quantity: 2 }];
    axios.put.mockResolvedValue({ data: { cart } });
    const state = { cart: { items: cart }, auth: { accessToken: 'jwt' } };
    const res = await runThunk(saveCart(), state);
    expect(axios.put).toHaveBeenCalledWith(
      '/api/auth/me/cart',
      { cart },
      { headers: { Authorization: 'Bearer jwt' } },
    );
    expect(res.payload).toEqual(cart);
  });

  it('checkout — POST /api/orders выбранными позициями (JWT)', async () => {
    axios.post.mockResolvedValue({ data: { id: 'o1' } });
    axios.put.mockResolvedValue({ data: { cart: [] } });
    axios.get.mockResolvedValue({ data: [] });
    const state = {
      auth: { accessToken: 'jwt' },
      cart: {
        items: [
          { animalId: 'a1', quantity: 2 },
          { animalId: 'a2', quantity: 1 },
        ],
      },
    };
    const res = await runThunk(
      checkout({
        selectedIds: ['a1'],
        total: 200,
        comment: 'позвонить',
        address: 'Москва',
        paymentMethod: 'card',
      }),
      state,
    );
    expect(axios.post).toHaveBeenCalledWith(
      '/api/orders',
      {
        items: [{ type: 'pet', itemId: 'a1', quantity: 2, note: 'позвонить' }],
        total: 200,
        address: 'Москва',
        paymentMethod: 'card',
      },
      { headers: { Authorization: 'Bearer jwt' } },
    );
    expect(res.payload).toEqual({ id: 'o1' });
  });

  it('checkout — ошибка уходит в rejectWithValue', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Нет в наличии' } } });
    const state = {
      auth: { accessToken: 'jwt' },
      cart: { items: [{ animalId: 'a1', quantity: 1 }] },
    };
    const res = await runThunk(checkout({ selectedIds: ['a1'], total: 100 }), state);
    expect(res.meta.requestStatus).toBe('rejected');
    expect(res.payload).toBe('Нет в наличии');
  });
});
