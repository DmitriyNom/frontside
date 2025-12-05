import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { needsOnboarding } from '../constants/userRoles'; // ✅ ИМПОРТИРУЕМ

const HomeRedirect = () => {
   const { user, isAuthenticated } = useSelector(state => state.auth);

   console.log('🔍 HomeRedirect - статус:', {
      isAuthenticated,
      user: user?.email,
      userRole: user?.role,
      needsOnboarding: user && needsOnboarding(user.role)
   });

   // Неавторизован → логин
   if (!isAuthenticated || !user) {
      console.log('🟡 HomeRedirect → /login (не авторизован)');
      return <Navigate to="/login" replace />;
   }

   // ✅ ИСПРАВЛЕННО: Используем needsOnboarding утилиту
   if (needsOnboarding(user.role)) {
      console.log('🟡 HomeRedirect → /onboarding (нужен onboarding)');
      return <Navigate to="/onboarding" replace />;
   }

   // Все остальные случаи → профиль
   console.log('🟡 HomeRedirect → /profile (onboarding завершен)');
   return <Navigate to="/profile" replace />;
};

export default HomeRedirect;