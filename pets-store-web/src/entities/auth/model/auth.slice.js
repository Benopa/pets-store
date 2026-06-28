import { createSlice } from '@reduxjs/toolkit';
import {
  loginAuth,
  registerAuth,
  fetchMe,
  updateProfile,
  uploadAvatar,
  changePassword,
} from './auth.thunk';

const initialState = {
  accessToken: localStorage.getItem('token'),
  role: null,
  userId: null,
  email: null,
  firstName: null,
  lastName: null,
  birthDate: null,
  address: null,
  paymentMethod: null,
  avatar: null,
  createdAt: null,
  loading: false,
  saving: false,
  uploadingAvatar: false,
  changingPassword: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.role = null;
      state.userId = null;
      state.email = null;
      state.firstName = null;
      state.lastName = null;
      state.birthDate = null;
      state.address = null;
      state.paymentMethod = null;
      state.avatar = null;
      state.createdAt = null;
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
      state.role = action.payload.role;
      state.loading = false;
    });
    builder.addCase(loginAuth.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(registerAuth.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerAuth.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.role = action.payload.role;
      state.loading = false;
    });
    builder.addCase(registerAuth.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(fetchMe.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      const p = action.payload;
      state.userId = p.id;
      state.email = p.email;
      state.firstName = p.firstName;
      state.lastName = p.lastName;
      state.birthDate = p.birthDate;
      state.address = p.address;
      state.paymentMethod = p.paymentMethod;
      state.avatar = p.avatar;
      state.role = p.role;
      state.createdAt = p.createdAt;
      state.loading = false;
    });
    builder.addCase(fetchMe.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(updateProfile.pending, (state) => {
      state.saving = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      const p = action.payload;
      state.firstName = p.firstName;
      state.lastName = p.lastName;
      state.birthDate = p.birthDate;
      state.address = p.address;
      state.paymentMethod = p.paymentMethod;
      state.email = p.email;
      state.role = p.role;
      state.saving = false;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.saving = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(uploadAvatar.pending, (state) => {
      state.uploadingAvatar = true;
      state.error = null;
    });
    builder.addCase(uploadAvatar.fulfilled, (state, action) => {
      state.avatar = action.payload.avatar;
      state.uploadingAvatar = false;
    });
    builder.addCase(uploadAvatar.rejected, (state, action) => {
      state.uploadingAvatar = false;
      state.error = action.payload ?? action.error.message;
    });
    builder.addCase(changePassword.pending, (state) => {
      state.changingPassword = true;
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.changingPassword = false;
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.changingPassword = false;
      state.error = action.payload ?? action.error.message;
    });
  },
});

export const { setAccessToken, setRole, setUserId, logout } = authSlice.actions;
export default authSlice.reducer;
