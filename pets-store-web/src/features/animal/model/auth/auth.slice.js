import { createSlice } from '@reduxjs/toolkit';
import { loginAuth, fetchMe } from './auth.thunk';

const initialState = {
  accessToken: localStorage.getItem('token'),
  apiKey: null,
  role: null,
  userId: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setApiKey: (state, action) => {
      state.apiKey = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.apiKey = null;
      state.role = null;
      state.userId = null;
      state.error = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginAuth.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginAuth.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.apiKey = action.payload.apiKey;
      state.role = action.payload.role;
      state.loading = false;
    });
    builder.addCase(loginAuth.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(fetchMe.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.userId = action.payload.userId;
      state.role = action.payload.role;
      state.loading = false;
    });
    builder.addCase(fetchMe.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { setAccessToken, setApiKey, setRole, setUserId, logout } = authSlice.actions;
export default authSlice.reducer;
