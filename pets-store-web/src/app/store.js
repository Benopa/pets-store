import { configureStore } from '@reduxjs/toolkit';
import { animalReducer } from '@/entities/animal';
import { authReducer } from '@/entities/auth';
import { favoritesReducer } from '@/entities/favorites';
import { ordersReducer } from '@/entities/order';
import { cartReducer } from '@/entities/cart';
import { moderatorsReducer } from '@/entities/moderator';
import { shopsReducer } from '@/entities/shop';

export const store = configureStore({
  reducer: {
    animal: animalReducer,
    auth: authReducer,
    favorites: favoritesReducer,
    orders: ordersReducer,
    cart: cartReducer,
    moderators: moderatorsReducer,
    shops: shopsReducer,
  },
});
