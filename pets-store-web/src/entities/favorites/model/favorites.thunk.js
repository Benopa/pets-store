import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Переключаем избранное и сохраняем весь список на бэкенд (PUT /auth/me/favorites).
// Оптимистичный toggle делает slice в pending — здесь просто персистим уже обновлённый список.
export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (_animalId, { getState, rejectWithValue }) => {
    try {
      const favorites = getState().favorites.ids;
      const token = getState().auth?.accessToken || localStorage.getItem('token');
      const response = await axios.put(
        '/api/auth/me/favorites',
        { favorites },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      return response.data.favorites;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);
