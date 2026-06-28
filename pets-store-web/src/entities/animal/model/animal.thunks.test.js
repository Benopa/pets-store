import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axios } from '@/shared/api';
import { runThunk } from '@/test/run-thunk';
import {
  fetchAnimals,
  fetchCategories,
  createAnimal,
  updateAnimal,
  uploadAnimalImage,
  deleteAnimalImage,
  setAnimalCover,
  approveAnimal,
  rejectAnimal,
  resubmitAnimal,
  deleteAnimal,
} from './animal.thunks';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

const state = { auth: { accessToken: 'jwt', apiKey: 'key' } };
const bearer = { headers: { Authorization: 'Bearer jwt' } };

beforeEach(() => vi.clearAllMocks());

describe('animal thunks', () => {
  it('fetchAnimals — GET /api/animals с params', async () => {
    axios.get.mockResolvedValue({ data: { items: [], total: 0 } });
    const res = await runThunk(fetchAnimals({ name: 'Tom', limit: 100 }), state);
    expect(axios.get).toHaveBeenCalledWith('/api/animals', { params: { name: 'Tom', limit: 100 } });
    expect(res.meta.requestStatus).toBe('fulfilled');
  });

  it('fetchCategories — GET /api/categories', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 'c1' }] });
    const res = await runThunk(fetchCategories(), state);
    expect(axios.get).toHaveBeenCalledWith('/api/categories');
    expect(res.payload).toEqual([{ id: 'c1' }]);
  });

  it('createAnimal — POST /api/animals (без файлов) с Bearer', async () => {
    axios.post.mockResolvedValue({ data: { id: 'a1', name: 'Tom' } });
    const data = { name: 'Tom', categoryId: 'c1', price: 100 };
    const res = await runThunk(createAnimal({ data, files: [] }), state);
    expect(axios.post).toHaveBeenCalledWith('/api/animals', data, bearer);
    expect(res.payload).toEqual({ id: 'a1', name: 'Tom' });
  });

  it('updateAnimal — PATCH /api/animals/:id с Bearer', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'a1' } });
    const data = { name: 'Tommy' };
    const res = await runThunk(updateAnimal({ id: 'a1', data, files: [] }), state);
    expect(axios.patch).toHaveBeenCalledWith('/api/animals/a1', data, bearer);
    expect(res.meta.requestStatus).toBe('fulfilled');
  });

  it('uploadAnimalImage — POST /api/animals/:id/images (multipart)', async () => {
    axios.post.mockResolvedValue({ data: { id: 'a1', images: [] } });
    const file = new Blob(['x'], { type: 'image/png' });
    await runThunk(uploadAnimalImage({ animalId: 'a1', file }), state);
    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toBe('/api/animals/a1/images');
    expect(body).toBeInstanceOf(FormData);
    expect(config).toEqual(bearer);
  });

  it('deleteAnimalImage — DELETE /api/animals/:id/images/:imageId', async () => {
    axios.delete.mockResolvedValue({ data: { id: 'a1' } });
    await runThunk(deleteAnimalImage({ animalId: 'a1', imageId: 'img1' }), state);
    expect(axios.delete).toHaveBeenCalledWith('/api/animals/a1/images/img1', bearer);
  });

  it('setAnimalCover — PATCH .../images/:imageId/cover', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'a1' } });
    await runThunk(setAnimalCover({ animalId: 'a1', imageId: 'img1' }), state);
    expect(axios.patch).toHaveBeenCalledWith('/api/animals/a1/images/img1/cover', {}, bearer);
  });

  it('approveAnimal — PATCH /api/animals/:id/approve', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'a1', moderationStatus: 'approved' } });
    await runThunk(approveAnimal('a1'), state);
    expect(axios.patch).toHaveBeenCalledWith('/api/animals/a1/approve', {}, bearer);
  });

  it('rejectAnimal — PATCH /api/animals/:id/reject с причиной', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'a1', moderationStatus: 'rejected' } });
    await runThunk(rejectAnimal({ id: 'a1', reason: 'плохое фото' }), state);
    expect(axios.patch).toHaveBeenCalledWith(
      '/api/animals/a1/reject',
      { reason: 'плохое фото' },
      bearer,
    );
  });

  it('resubmitAnimal — PATCH /api/animals/:id/resubmit', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'a1' } });
    await runThunk(resubmitAnimal('a1'), state);
    expect(axios.patch).toHaveBeenCalledWith('/api/animals/a1/resubmit', {}, bearer);
  });

  it('deleteAnimal — DELETE /api/animals/:id (JWT), возвращает id', async () => {
    axios.delete.mockResolvedValue({ data: { status: 'ok' } });
    const res = await runThunk(deleteAnimal('a1'), state);
    expect(axios.delete).toHaveBeenCalledWith('/api/animals/a1', {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(res.payload).toBe('a1');
  });

  it('createAnimal — ошибка уходит в rejectWithValue', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: ['нет цены', 'нет имени'] } } });
    const res = await runThunk(createAnimal({ data: {}, files: [] }), state);
    expect(res.meta.requestStatus).toBe('rejected');
    expect(res.payload).toBe('нет цены, нет имени');
  });
});
