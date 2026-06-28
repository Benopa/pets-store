import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axios } from '@/shared/api';
import { runThunk } from '@/test/run-thunk';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.thunk';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

const state = { auth: { accessToken: 'jwt' } };
const bearer = { headers: { Authorization: 'Bearer jwt' } };

beforeEach(() => vi.clearAllMocks());

describe('notifications thunks', () => {
  it('fetchNotifications — GET /api/notifications с Bearer', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 'n1' }] });
    const res = await runThunk(fetchNotifications(), state);
    expect(axios.get).toHaveBeenCalledWith('/api/notifications', bearer);
    expect(res.payload).toEqual([{ id: 'n1' }]);
  });

  it('markNotificationRead — PATCH /api/notifications/:id/read, возвращает id', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    const res = await runThunk(markNotificationRead('n1'), state);
    expect(axios.patch).toHaveBeenCalledWith('/api/notifications/n1/read', {}, bearer);
    expect(res.payload).toBe('n1');
  });

  it('markAllNotificationsRead — PATCH /api/notifications/read-all, возвращает true', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    const res = await runThunk(markAllNotificationsRead(), state);
    expect(axios.patch).toHaveBeenCalledWith('/api/notifications/read-all', {}, bearer);
    expect(res.payload).toBe(true);
  });
});
