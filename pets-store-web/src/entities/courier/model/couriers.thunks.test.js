import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axios } from '@/shared/api';
import { runThunk } from '@/test/run-thunk';
import { fetchCouriers, createCourier, deleteCourier } from './couriers.thunks';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

const state = { auth: { accessToken: 'jwt' } };
const bearer = { headers: { Authorization: 'Bearer jwt' } };

beforeEach(() => vi.clearAllMocks());

describe('couriers thunks', () => {
  it('fetchCouriers — GET /api/users и оставляет только role==="courier"', async () => {
    axios.get.mockResolvedValue({
      data: [
        { id: 'u1', role: 'courier' },
        { id: 'u2', role: 'moderator' },
      ],
    });
    const res = await runThunk(fetchCouriers(), state);
    expect(axios.get).toHaveBeenCalledWith('/api/users', bearer);
    expect(res.payload).toEqual([{ id: 'u1', role: 'courier' }]);
  });

  it('createCourier — POST /api/users с role=courier', async () => {
    axios.post.mockResolvedValue({ data: { id: 'u9', role: 'courier' } });
    await runThunk(
      createCourier({ email: 'c@b.c', password: 'secret', firstName: 'Курь', lastName: 'Ер' }),
      state,
    );
    expect(axios.post).toHaveBeenCalledWith(
      '/api/users',
      { email: 'c@b.c', password: 'secret', firstName: 'Курь', lastName: 'Ер', role: 'courier' },
      bearer,
    );
  });

  it('deleteCourier — DELETE /api/users/:id, возвращает id', async () => {
    axios.delete.mockResolvedValue({ data: { status: 'ok' } });
    const res = await runThunk(deleteCourier('u9'), state);
    expect(axios.delete).toHaveBeenCalledWith('/api/users/u9', bearer);
    expect(res.payload).toBe('u9');
  });
});
