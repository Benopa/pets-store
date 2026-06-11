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

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { getState }) => {
  const token = getState().auth?.accessToken || localStorage.getItem('token');
  const response = await axios.get('/api/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
});
