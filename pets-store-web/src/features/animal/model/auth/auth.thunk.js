import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const loginAuth = createAsyncThunk('auth/loginAuth', async ({ email, password }) => {
  const response = await axios.post('/api/auth/login', { email, password });
  const data = response.data;
  if (data.accessToken) {
    localStorage.setItem('token', data.accessToken);
  }
  return data;
});

export const registerAuth = createAsyncThunk(
  'auth/registerAuth',
  async ({ email, password, firstName, lastName, birthDate, role }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
        birthDate,
        role,
      });
      const data = response.data;
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
      }
      return data;
    } catch (err) {
      // Бэкенд отдаёт сообщение в response.data.message (например, "Email already in use").
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { getState }) => {
  const token = getState().auth?.accessToken || localStorage.getItem('token');
  const response = await axios.get('/api/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (values, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken || localStorage.getItem('token');
      const response = await axios.patch('/api/auth/me', values, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken || localStorage.getItem('token');
      // multipart/form-data — границу выставит axios, вручную Content-Type не задаём.
      const response = await axios.post('/api/auth/me/avatar', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken || localStorage.getItem('token');
      const response = await axios.post(
        '/api/auth/change-password',
        { currentPassword, newPassword },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message;
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message || err.message);
    }
  },
);
