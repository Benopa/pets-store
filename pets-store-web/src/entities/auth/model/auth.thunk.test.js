import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { runThunk } from '@/test/run-thunk';
import {
  loginAuth,
  registerAuth,
  fetchMe,
  updateProfile,
  uploadAvatar,
  changePassword,
} from './auth.thunk';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

const state = { auth: { accessToken: 'jwt' } };
const bearer = { headers: { Authorization: 'Bearer jwt' } };

beforeEach(() => vi.clearAllMocks());

describe('auth thunks', () => {
  it('loginAuth — POST /api/auth/login и кладёт токен в localStorage', async () => {
    axios.post.mockResolvedValue({ data: { accessToken: 'tok', apiKey: 'k' } });
    const res = await runThunk(loginAuth({ email: 'a@b.c', password: 'secret' }), { auth: {} });
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'a@b.c',
      password: 'secret',
    });
    expect(res.meta.requestStatus).toBe('fulfilled');
    expect(localStorage.getItem('token')).toBe('tok');
  });

  it('registerAuth — POST /api/auth/register со всеми полями', async () => {
    axios.post.mockResolvedValue({ data: { accessToken: 'tok2' } });
    const payload = {
      email: 'a@b.c',
      password: 'secret',
      firstName: 'Иван',
      lastName: 'И',
      birthDate: '1990-01-01',
      role: 'seller',
    };
    await runThunk(registerAuth(payload), { auth: {} });
    expect(axios.post).toHaveBeenCalledWith('/api/auth/register', payload);
    expect(localStorage.getItem('token')).toBe('tok2');
  });

  it('registerAuth — занятый email уходит в rejectWithValue', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Email already in use' } } });
    const res = await runThunk(registerAuth({ email: 'a@b.c', password: 'x' }), { auth: {} });
    expect(res.meta.requestStatus).toBe('rejected');
    expect(res.payload).toBe('Email already in use');
  });

  it('fetchMe — GET /api/auth/me с Bearer', async () => {
    axios.get.mockResolvedValue({ data: { id: 'u1', role: 'admin' } });
    const res = await runThunk(fetchMe(), state);
    expect(axios.get).toHaveBeenCalledWith('/api/auth/me', bearer);
    expect(res.payload).toEqual({ id: 'u1', role: 'admin' });
  });

  it('updateProfile — PATCH /api/auth/me с Bearer', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'u1', role: 'seller' } });
    await runThunk(updateProfile({ role: 'seller' }), state);
    expect(axios.patch).toHaveBeenCalledWith('/api/auth/me', { role: 'seller' }, bearer);
  });

  it('uploadAvatar — POST /api/auth/me/avatar (multipart) с Bearer', async () => {
    axios.post.mockResolvedValue({ data: { avatar: '/uploads/x.png' } });
    const fd = new FormData();
    await runThunk(uploadAvatar(fd), state);
    expect(axios.post).toHaveBeenCalledWith('/api/auth/me/avatar', fd, bearer);
  });

  it('changePassword — POST /api/auth/change-password', async () => {
    axios.post.mockResolvedValue({ data: { ok: true } });
    await runThunk(changePassword({ currentPassword: 'a', newPassword: 'b' }), state);
    expect(axios.post).toHaveBeenCalledWith(
      '/api/auth/change-password',
      { currentPassword: 'a', newPassword: 'b' },
      bearer,
    );
  });
});
