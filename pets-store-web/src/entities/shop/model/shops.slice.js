import { createSlice } from '@reduxjs/toolkit';
import { fetchShops, createShop, updateShop, deleteShop } from './shops.thunks';

const initialState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
};

const replaceShop = (state, shop) => {
  if (!shop) return;
  const i = state.items.findIndex((s) => s.id === shop.id);
  if (i !== -1) state.items[i] = shop;
};

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchShops.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchShops.fulfilled, (state, action) => {
      state.items = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchShops.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(createShop.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(createShop.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
      state.saving = false;
    });
    builder.addCase(createShop.rejected, (state, action) => {
      state.saving = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(updateShop.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(updateShop.fulfilled, (state, action) => {
      replaceShop(state, action.payload);
      state.saving = false;
    });
    builder.addCase(updateShop.rejected, (state, action) => {
      state.saving = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(deleteShop.fulfilled, (state, action) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    });
  },
});

export default shopsSlice.reducer;
