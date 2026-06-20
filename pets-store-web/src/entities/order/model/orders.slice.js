import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/entities/auth';
import { fetchOrders } from './orders.thunk';

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
    });
    builder.addCase(fetchOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(logout, (state) => {
      state.items = [];
      state.error = null;
    });
  },
});

export default ordersSlice.reducer;
