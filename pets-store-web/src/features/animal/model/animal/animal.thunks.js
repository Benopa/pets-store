import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const fetchAnimals = createAsyncThunk('animal/fetchAnimals', async (params) => {
  const response = await axios.get('/api/animals', { params });
  return response.data;
});

export const fetchCategories = createAsyncThunk('animal/fetchCategories', async () => {
  const response = await axios.get('/api/categories');
  return response.data;
});

export { fetchAnimals };
