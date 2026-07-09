import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { runThunk } from '@/test/run-thunk';
import {
  fetchConversations,
  fetchMessages,
  createConversation,
  deleteConversation,
  markConversationRead,
} from './chat.thunks';

vi.mock('axios');

const state = { auth: { accessToken: 'jwt' } };
const bearer = { headers: { Authorization: 'Bearer jwt' } };

describe('chat thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchConversations запрашивает список диалогов', async () => {
    const payload = [{ conversation: { id: 'c1' }, lastMessage: null, unreadCount: 2 }];
    axios.get.mockResolvedValue({ data: payload });
    const res = await runThunk(fetchConversations(), state);
    expect(axios.get).toHaveBeenCalledWith('/api/chat/conversations', bearer);
    expect(res.payload).toEqual(payload);
  });

  it('fetchMessages возвращает историю с id диалога', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 'm1' }] });
    const res = await runThunk(fetchMessages('c1'), state);
    expect(axios.get).toHaveBeenCalledWith('/api/chat/conversations/c1/messages', bearer);
    expect(res.payload).toEqual({ conversationId: 'c1', messages: [{ id: 'm1' }] });
  });

  it('createConversation шлёт dto и возвращает диалог', async () => {
    axios.post.mockResolvedValue({ data: { id: 'c2', kind: 'buyer-support' } });
    const res = await runThunk(createConversation({ kind: 'buyer-support' }), state);
    expect(axios.post).toHaveBeenCalledWith(
      '/api/chat/conversations',
      { kind: 'buyer-support' },
      bearer,
    );
    expect(res.payload).toEqual({ id: 'c2', kind: 'buyer-support' });
  });

  it('deleteConversation скрывает диалог и возвращает id', async () => {
    axios.delete.mockResolvedValue({ data: { status: 'ok' } });
    const res = await runThunk(deleteConversation('c1'), state);
    expect(axios.delete).toHaveBeenCalledWith('/api/chat/conversations/c1', bearer);
    expect(res.payload).toBe('c1');
  });

  it('markConversationRead помечает прочитанным', async () => {
    axios.post.mockResolvedValue({ data: { status: 'ok' } });
    const res = await runThunk(markConversationRead('c1'), state);
    expect(axios.post).toHaveBeenCalledWith('/api/chat/conversations/c1/read', {}, bearer);
    expect(res.payload).toBe('c1');
  });

  it('ошибка бэкенда пробрасывается через rejectWithValue', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Not allowed' } } });
    const res = await runThunk(fetchConversations(), state);
    expect(res.payload).toBe('Not allowed');
  });
});
