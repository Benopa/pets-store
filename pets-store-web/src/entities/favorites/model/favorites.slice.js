import { createSlice } from '@reduxjs/toolkit';
import { fetchMe, logout } from '@/entities/auth';
import { toggleFavorite } from './favorites.thunk';

const flip = (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

// Избранное приходит с бэкенда (в профиле fetchMe) и сохраняется на бэкенде при toggle.
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    ids: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.ids = action.payload.favorites ?? [];
    });
    // Оптимистично переключаем сразу
    builder.addCase(toggleFavorite.pending, (state, action) => {
      state.ids = flip(state.ids, action.meta.arg);
    });
    builder.addCase(toggleFavorite.fulfilled, (state, action) => {
      state.ids = action.payload ?? state.ids;
    });
    // Откатываем, если сервер не принял
    builder.addCase(toggleFavorite.rejected, (state, action) => {
      state.ids = flip(state.ids, action.meta.arg);
    });
    builder.addCase(logout, (state) => {
      state.ids = [];
    });
  },
});

export default favoritesSlice.reducer;
