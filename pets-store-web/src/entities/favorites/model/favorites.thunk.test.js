import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { runThunk } from '@/test/run-thunk';
import { toggleFavorite } from './favorites.thunk';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe('favorites thunks', () => {
  it('toggleFavorite — PUT /api/auth/me/favorites текущим списком, возвращает favorites', async () => {
    axios.put.mockResolvedValue({ data: { favorites: ['a1', 'a2'] } });
    const state = { favorites: { ids: ['a1', 'a2'] }, auth: { accessToken: 'jwt' } };
    const res = await runThunk(toggleFavorite('a2'), state);
    expect(axios.put).toHaveBeenCalledWith(
      '/api/auth/me/favorites',
      { favorites: ['a1', 'a2'] },
      { headers: { Authorization: 'Bearer jwt' } },
    );
    expect(res.payload).toEqual(['a1', 'a2']);
  });

  it('toggleFavorite — ошибка уходит в rejectWithValue', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Нет доступа' } } });
    const state = { favorites: { ids: [] }, auth: { accessToken: 'jwt' } };
    const res = await runThunk(toggleFavorite('a1'), state);
    expect(res.meta.requestStatus).toBe('rejected');
    expect(res.payload).toBe('Нет доступа');
  });
});
