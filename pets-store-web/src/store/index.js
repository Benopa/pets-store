import { configureStore } from '@reduxjs/toolkit';
import { animalReducer, authReducer } from '../features';

export const store = configureStore({
  reducer: {
    animal: animalReducer,
    auth: authReducer,
  },
});
