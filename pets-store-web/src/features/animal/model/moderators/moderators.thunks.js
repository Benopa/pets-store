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

// Список модераторов (админ): GET /users → оставляем только role === 'moderator'.
export const fetchModerators = createAsyncThunk(
  'moderators/fetchModerators',
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get('/api/users', { headers: bearer(getState) });
      return res.data.filter((u) => u.role === 'moderator');
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Создание модератора (админ): POST /users с ролью moderator.
export const createModerator = createAsyncThunk(
  'moderators/createModerator',
  async ({ email, password, firstName, lastName }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.post(
        '/api/users',
        { email, password, firstName, lastName, role: 'moderator' },
        { headers: bearer(getState) },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);

// Удаление модератора (админ): DELETE /users/:id.
export const deleteModerator = createAsyncThunk(
  'moderators/deleteModerator',
  async (id, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`/api/users/${id}`, { headers: bearer(getState) });
      return id;
    } catch (err) {
      return rejectWithValue(errMessage(err));
    }
  },
);
