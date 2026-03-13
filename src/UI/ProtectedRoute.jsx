// src/UI/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
   selectIsAuthenticated,
   selectIsCheckingAuth,
   selectUser
} from '../features/authSlice';
import { needsOnboarding } from '../constants/userRoles';

const ProtectedRoute = ({ children }) => {
   const isAuthenticated = useSelector(selectIsAuthenticated);
   const isCheckingAuth = useSelector(selectIsCheckingAuth);
   const user = useSelector(selectUser);

   const currentPath = window.location.pathname;
   const isOnboardingPage = currentPath.includes('/onboarding');

   // 🔑 Добавляем ключ для принудительного обновления дочерних компонентов
   const childKey = user?.id || 'no-user';

   if (isCheckingAuth) {
      return (
         <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px',
            color: '#666'
         }}>
            Проверка авторизации...
         </div>
      );
   }

   if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
   }

   const shouldOnboard = needsOnboarding(user.role);

   if (shouldOnboard && !isOnboardingPage) {
      return <Navigate to="/onboarding" replace />;
   }

   if (!shouldOnboard && isOnboardingPage) {
      return <Navigate to="/profile" replace />;
   }

   // 🔑 Ключ заставит React пересоздать children при смене пользователя
   return React.cloneElement(children, { key: childKey });
};

export default ProtectedRoute;