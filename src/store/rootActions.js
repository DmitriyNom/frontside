// src/store/rootActions.js
import { resetAuth } from '../features/authSlice';
import { resetProfile } from '../features/profileSlice';

export const logoutUser = () => (dispatch) => {
   console.log('🔄 Сброс состояния приложения');

   // Очищаем ВСЕ слайсы
   dispatch(resetAuth());              // authSlice
   dispatch(resetProfile());            // profileSlice

   // 👇 Опционально: очищаем localStorage если используется persist
   // localStorage.removeItem('persist:profile');
};