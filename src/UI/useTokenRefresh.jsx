import axios from 'axios';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice'

const useTokenRefresh = () => {
   const dispatch = useDispatch();

   const refreshAccessToken = async (refreshToken) => {
      try {
         const response = await axios.post('/api/user/refresh', { refreshToken });
         return response.data.accessToken; // возвращаем новый access токен
      } catch (error) {
         // Если не удалось обновить токен, разлогиниваем пользователя
         dispatch(logout());
         throw new Error('Не удалось обновить токен');
      }
   };

   return { refreshAccessToken };
};

export default useTokenRefresh