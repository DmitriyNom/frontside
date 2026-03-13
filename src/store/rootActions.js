// src/store/rootActions.js
import { resetAuth } from '../features/authSlice';
import { clearAllConnectionsData } from '../features/connectionsSlice';
import { resetProfile } from '../features/profileSlice'; // 👈 ИМПОРТИРУЕМ

export const logoutUser = () => (dispatch) => {
   console.log('🔄 Сброс состояния приложения');

   // Очищаем ВСЕ слайсы
   dispatch(resetAuth());              // authSlice
   dispatch(clearAllConnectionsData()); // connectionsSlice
   dispatch(resetProfile());            // profileSlice 👈 ДОБАВЛЯЕМ

   // 👇 Опционально: очищаем localStorage если используется persist
   // localStorage.removeItem('persist:profile');
};