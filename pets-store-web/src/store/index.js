import { configureStore } from '@reduxjs/toolkit';
import {
  animalReducer,
  authReducer,
  favoritesReducer,
  ordersReducer,
  cartReducer,
} from '../features';

export const store = configureStore({
  reducer: {
    animal: animalReducer,
    auth: authReducer,
    favorites: favoritesReducer,
    orders: ordersReducer,
    cart: cartReducer,
  },
});
