import { createAsyncThunk } from '@reduxjs/toolkit';
import { axios, bearer, errMessage } from '@/shared/api';

const fetchAnimals = createAsyncThunk('animal/fetchAnimals', async (params) => {
  const response = await axios.get('/api/animals', { params });
  return response.data;
});

export const fetchCategories = createAsyncThunk('animal/fetchCategories', async () => {
  const response = await axios.get('/api/categories');
  return response.data;
});

// Загружаем файлы изображений по одному (бэкенд принимает по одному в поле `file`).
// Возвращаем последнюю версию животного (эндпоинт отдаёт полную карточку).
const uploadImages = async (animalId, files, headers) => {
  let animal = null;
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axios.post(`/api/animals/${animalId}/images`, fd, { headers });
    animal = res.data;
  }
  return animal;
};

// Создание товара (JWT): POST /animals → затем заливаем фото → отдаём итоговую карточку.
export const createAnimal = createAsyncThunk(
  'animal/createAnimal',
  async ({ data, files = [] }, { getState, rejectWithValue }) => {
    try {
      const headers = bearer(getState);
      const res = await axios.post('/api/animals', data, { headers });
      const withImages = files.length ? await uploadImages(res.data.id, files, headers) : null;
      return withImages ?? res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Редактирование товара (JWT): PATCH /animals/:id → доливаем новые фото при наличии.
export const updateAnimal = createAsyncThunk(
  'animal/updateAnimal',
  async ({ id, data, files = [] }, { getState, rejectWithValue }) => {
    try {
      const headers = bearer(getState);
      const res = await axios.patch(`/api/animals/${id}`, data, { headers });
      const withImages = files.length ? await uploadImages(id, files, headers) : null;
      return withImages ?? res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Загрузка одного фото к существующему товару (JWT) → обновлённая карточка.
export const uploadAnimalImage = createAsyncThunk(
  'animal/uploadAnimalImage',
  async ({ animalId, file }, { getState, rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`/api/animals/${animalId}/images`, fd, {
        headers: bearer(getState),
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Удаление фото товара (JWT) → обновлённая карточка.
export const deleteAnimalImage = createAsyncThunk(
  'animal/deleteAnimalImage',
  async ({ animalId, imageId }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.delete(`/api/animals/${animalId}/images/${imageId}`, {
        headers: bearer(getState),
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Назначение обложки (JWT): выбранное фото переходит на позицию 0 → обновлённая карточка.
export const setAnimalCover = createAsyncThunk(
  'animal/setAnimalCover',
  async ({ animalId, imageId }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `/api/animals/${animalId}/images/${imageId}/cover`,
        {},
        { headers: bearer(getState) },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// --- Модерация (JWT, роль moderator/admin) — каждый эндпоинт отдаёт обновлённую карточку ---

// Одобрить товар → публикуется в каталоге.
export const approveAnimal = createAsyncThunk(
  'animal/approveAnimal',
  async (id, { getState, rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `/api/animals/${id}/approve`,
        {},
        { headers: bearer(getState) },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Отклонить товар с причиной → продавец увидит её и сможет исправить.
export const rejectAnimal = createAsyncThunk(
  'animal/rejectAnimal',
  async ({ id, reason }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `/api/animals/${id}/reject`,
        { reason },
        { headers: bearer(getState) },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Повторно отправить отклонённый товар на проверку (владелец-продавец или админ).
export const resubmitAnimal = createAsyncThunk(
  'animal/resubmitAnimal',
  async (id, { getState, rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `/api/animals/${id}/resubmit`,
        {},
        { headers: bearer(getState) },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Удаление товара (JWT).
export const deleteAnimal = createAsyncThunk(
  'animal/deleteAnimal',
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`/api/animals/${id}`, { headers: bearer(getState) });
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

export { fetchAnimals };
