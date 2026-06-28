import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { runThunk } from '@/test/run-thunk';
import { fetchShops, createShop, updateShop, deleteShop } from './shops.thunks';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

const state = { auth: { accessToken: 'jwt', apiKey: 'key' } };

beforeEach(() => vi.clearAllMocks());

describe('shops thunks', () => {
  it('fetchShops — GET /api/shops (публичный, без заголовков)', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 's1', name: 'SKZoo' }] });
    const res = await runThunk(fetchShops(), state);
    expect(axios.get).toHaveBeenCalledWith('/api/shops');
    expect(res.meta.requestStatus).toBe('fulfilled');
    expect(res.payload).toEqual([{ id: 's1', name: 'SKZoo' }]);
  });

  it('createShop — POST /api/shops с Bearer', async () => {
    axios.post.mockResolvedValue({ data: { id: 's2', name: 'Лапки' } });
    const res = await runThunk(createShop({ name: 'Лапки', address: 'Москва' }), state);
    expect(axios.post).toHaveBeenCalledWith(
      '/api/shops',
      { name: 'Лапки', address: 'Москва' },
      { headers: { Authorization: 'Bearer jwt' } },
    );
    expect(res.payload).toEqual({ id: 's2', name: 'Лапки' });
  });

  it('updateShop — PATCH /api/shops/:id с Bearer', async () => {
    axios.patch.mockResolvedValue({ data: { id: 's2', name: 'Новое' } });
    const res = await runThunk(updateShop({ id: 's2', name: 'Новое', address: 'СПб' }), state);
    expect(axios.patch).toHaveBeenCalledWith(
      '/api/shops/s2',
      { name: 'Новое', address: 'СПб' },
      { headers: { Authorization: 'Bearer jwt' } },
    );
    expect(res.meta.requestStatus).toBe('fulfilled');
  });

  it('deleteShop — DELETE /api/shops/:id и возвращает id', async () => {
    axios.delete.mockResolvedValue({ data: { status: 'ok' } });
    const res = await runThunk(deleteShop('s3'), state);
    expect(axios.delete).toHaveBeenCalledWith('/api/shops/s3', {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(res.payload).toBe('s3');
  });

  it('createShop — ошибка бэкенда уходит в rejectWithValue', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Имя занято' } } });
    const res = await runThunk(createShop({ name: 'X' }), state);
    expect(res.meta.requestStatus).toBe('rejected');
    expect(res.payload).toBe('Имя занято');
  });
});
