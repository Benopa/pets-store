import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const authToken = (getState) => getState().auth?.accessToken || localStorage.getItem('token');
const bearer = (getState) => {
  const token = authToken(getState);
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const errMessage = (err) => {
  const message = err.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || err.message;
};

// Справочник магазинов: список открыт, изменения — под админом (JWT).
export const fetchShops = createAsyncThunk('shops/fetchShops', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get('/api/shops');
    return res.data;
  } catch (err) {
    return rejectWithValue(errMessage(err));
  }
});

export const createShop = createAsyncThunk(
  'shops/createShop',
  async ({ name, address }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.post('/api/shops', { name, address }, { headers: bearer(getState) });
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

export const updateShop = createAsyncThunk(
  'shops/updateShop',
  async ({ id, name, address }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `/api/shops/${id}`,
        { name, address },
        { headers: bearer(getState) },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

export const deleteShop = createAsyncThunk(
  'shops/deleteShop',
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`/api/shops/${id}`, { headers: bearer(getState) });
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);
