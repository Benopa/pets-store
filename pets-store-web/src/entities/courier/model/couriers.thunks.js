import { createAsyncThunk } from '@reduxjs/toolkit';
import { axios, bearer, errMessage } from '@/shared/api';

// Список доставщиков (админ): GET /users → оставляем только role === 'courier'.
export const fetchCouriers = createAsyncThunk(
  'couriers/fetchCouriers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get('/api/users', { headers: bearer(getState) });
      return res.data.filter((u) => u.role === 'courier');
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Создание доставщика (админ): POST /users с ролью courier.
export const createCourier = createAsyncThunk(
  'couriers/createCourier',
  async ({ email, password, firstName, lastName }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.post(
        '/api/users',
        { email, password, firstName, lastName, role: 'courier' },
        { headers: bearer(getState) },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Удаление доставщика (админ): DELETE /users/:id.
export const deleteCourier = createAsyncThunk(
  'couriers/deleteCourier',
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`/api/users/${id}`, { headers: bearer(getState) });
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);
