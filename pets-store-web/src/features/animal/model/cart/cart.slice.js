import { createSlice } from '@reduxjs/toolkit';
import { fetchMe, logout } from '../auth';

// Корзина: [{ animalId, quantity }]. Приходит с бэкенда (fetchMe) и сохраняется на бэкенде.
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
  },
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    },
    addItem: (state, action) => {
      const id = action.payload;
      const line = state.items.find((i) => i.animalId === id);
      if (line) line.quantity += 1;
      else state.items.push({ animalId: id, quantity: 1 });
    },
    setQty: (state, action) => {
      const { animalId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.animalId !== animalId);
        return;
      }
      const line = state.items.find((i) => i.animalId === animalId);
      if (line) line.quantity = quantity;
      else state.items.push({ animalId, quantity });
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((i) => i.animalId !== action.payload);
    },
    clearItems: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.items = action.payload.cart ?? [];
    });
    builder.addCase(logout, (state) => {
      state.items = [];
    });
  },
});

export const { setItems, addItem, setQty, removeItem, clearItems } = cartSlice.actions;
export default cartSlice.reducer;
