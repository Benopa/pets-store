import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axios } from '@/shared/api';
import { runThunk } from '@/test/run-thunk';
import { fetchModerators, createModerator, deleteModerator } from './moderators.thunks';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

const state = { auth: { accessToken: 'jwt' } };
const bearer = { headers: { Authorization: 'Bearer jwt' } };

beforeEach(() => vi.clearAllMocks());

describe('moderators thunks', () => {
  it('fetchModerators — GET /api/users и оставляет только role==="moderator"', async () => {
    axios.get.mockResolvedValue({
      data: [
        { id: 'u1', role: 'moderator' },
        { id: 'u2', role: 'admin' },
        { id: 'u3', role: 'buyer' },
      ],
    });
    const res = await runThunk(fetchModerators(), state);
    expect(axios.get).toHaveBeenCalledWith('/api/users', bearer);
    expect(res.payload).toEqual([{ id: 'u1', role: 'moderator' }]);
  });

  it('createModerator — POST /api/users с role=moderator', async () => {
    axios.post.mockResolvedValue({ data: { id: 'u9', role: 'moderator' } });
    await runThunk(
      createModerator({ email: 'm@b.c', password: 'secret', firstName: 'Мод', lastName: 'Ер' }),
      state,
    );
    expect(axios.post).toHaveBeenCalledWith(
      '/api/users',
      { email: 'm@b.c', password: 'secret', firstName: 'Мод', lastName: 'Ер', role: 'moderator' },
      bearer,
    );
  });

  it('deleteModerator — DELETE /api/users/:id, возвращает id', async () => {
    axios.delete.mockResolvedValue({ data: { status: 'ok' } });
    const res = await runThunk(deleteModerator('u9'), state);
    expect(axios.delete).toHaveBeenCalledWith('/api/users/u9', bearer);
    expect(res.payload).toBe('u9');
  });
});
