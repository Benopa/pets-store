import { createSlice } from '@reduxjs/toolkit';
import {
  fetchAnimals,
  fetchCategories,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  uploadAnimalImage,
  deleteAnimalImage,
  setAnimalCover,
  approveAnimal,
  rejectAnimal,
  resubmitAnimal,
} from './animal.thunks';

// Заменяет карточку в общем списке на свежую версию (с бэкенда).
const replaceAnimal = (state, animal) => {
  if (!animal) return;
  const i = state.animals.findIndex((a) => a.id === animal.id);
  if (i !== -1) state.animals[i] = animal;
};
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
    // CRUD товаров (админ/продавец) — синхронизируем общий список.
    builder.addCase(createAnimal.fulfilled, (state, action) => {
      state.animals.unshift(action.payload);
      state.total += 1;
    });
    builder.addCase(updateAnimal.fulfilled, (state, action) => {
      replaceAnimal(state, action.payload);
    });
    builder.addCase(deleteAnimal.fulfilled, (state, action) => {
      state.animals = state.animals.filter((a) => a.id !== action.payload);
      state.total = Math.max(0, state.total - 1);
    });
    // Операции с фото возвращают обновлённую карточку — обновляем список.
    builder.addCase(uploadAnimalImage.fulfilled, (state, action) => {
      replaceAnimal(state, action.payload);
    });
    builder.addCase(deleteAnimalImage.fulfilled, (state, action) => {
      replaceAnimal(state, action.payload);
    });
    builder.addCase(setAnimalCover.fulfilled, (state, action) => {
      replaceAnimal(state, action.payload);
    });
    // Модерация — карточка возвращается с новым moderationStatus, обновляем список.
    builder.addCase(approveAnimal.fulfilled, (state, action) => {
      replaceAnimal(state, action.payload);
    });
    builder.addCase(rejectAnimal.fulfilled, (state, action) => {
      replaceAnimal(state, action.payload);
    });
    builder.addCase(resubmitAnimal.fulfilled, (state, action) => {
      replaceAnimal(state, action.payload);
    });
  },
});

export const { setAnimals, setCategoryId, setSearch, setSort, setCurrentAnimal } =
  animalSlice.actions;
export default animalSlice.reducer;
