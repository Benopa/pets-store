import { createSlice } from '@reduxjs/toolkit';
import { fetchCouriers, createCourier, deleteCourier } from './couriers.thunks';

const initialState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

const couriersSlice = createSlice({
  name: 'couriers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCouriers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCouriers.fulfilled, (state, action) => {
      state.items = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchCouriers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(createCourier.pending, (state) => {
      state.creating = true;
      state.error = null;
    });
    builder.addCase(createCourier.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
      state.creating = false;
    });
    builder.addCase(createCourier.rejected, (state, action) => {
      state.creating = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(deleteCourier.fulfilled, (state, action) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    });
  },
});

export default couriersSlice.reducer;
