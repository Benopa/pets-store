import { createSlice } from '@reduxjs/toolkit';
import { fetchModerators, createModerator, deleteModerator } from './moderators.thunks';

const initialState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

const moderatorsSlice = createSlice({
  name: 'moderators',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchModerators.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchModerators.fulfilled, (state, action) => {
      state.items = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchModerators.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(createModerator.pending, (state) => {
      state.creating = true;
      state.error = null;
    });
    builder.addCase(createModerator.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
      state.creating = false;
    });
    builder.addCase(createModerator.rejected, (state, action) => {
      state.creating = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(deleteModerator.fulfilled, (state, action) => {
      state.items = state.items.filter((m) => m.id !== action.payload);
    });
  },
});

export default moderatorsSlice.reducer;
