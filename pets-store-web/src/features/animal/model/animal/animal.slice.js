import { createSlice } from '@reduxjs/toolkit';
import { fetchAnimals, fetchCategories } from './animal.thunks';
import { logout } from '../auth';
const initialState = {
  animals: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  categories: [],
  categoryId: null,
  search: '',
  sort: 'name',
  sortBy: 'createdAt',
  order: 'DESC',
  currentAnimal: null,
  cartCount: 0,
};

const animalSlice = createSlice({
  name: 'animal',
  initialState,
  reducers: {
    setAnimals: (state, action) => {
      state.animals = action.payload;
    },
    setCategoryId: (state, action) => {
      state.categoryId = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setCurrentAnimal: (state, action) => {
      state.currentAnimal = action.payload;
    },
    addToCart: (state) => {
      state.cartCount += 1;
    },
    // openModal, closeModal=null
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAnimals.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAnimals.fulfilled, (state, action) => {
      state.animals = action.payload.items;
      state.total = action.payload.total;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
      state.loading = false;
    });
    builder.addCase(fetchAnimals.rejected, (state, action) => {
      state.error = action.error.message;
    });
    builder.addCase(fetchCategories.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });
    builder.addCase(fetchCategories.rejected, (state, action) => {
      state.error = action.error.message;
    });
    builder.addCase(logout, (state) => {
      state.cartCount = 0;
    });
  },
});

export const { setAnimals, setCategoryId, setSearch, setSort, setCurrentAnimal, addToCart } =
  animalSlice.actions;
export default animalSlice.reducer;
