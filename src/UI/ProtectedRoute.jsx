import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile, selectUser, selectLoading, selectIsProfileFetched } from '../features/authSlice';
import { needsOnboarding } from '../constants/userRoles'; // ✅ ИМПОРТИРУЕМ

const ProtectedRoute = ({ element }) => {
   const dispatch = useDispatch();
   const user = useSelector(selectUser);
   const loading = useSelector(selectLoading);
   const isProfileFetched = useSelector(selectIsProfileFetched);

   const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

   useEffect(() => {
      if (!isProfileFetched && !loading) {
         dispatch(fetchUserProfile());
      }
   }, [dispatch, isProfileFetched, loading]);

   useEffect(() => {
      if (!loading && isProfileFetched && !hasCheckedAuth) {
         setHasCheckedAuth(true);
      }
   }, [loading, isProfileFetched, user, hasCheckedAuth]);

   // ✅ ОБНОВЛЯЕМ: Используем новую утилиту
   const userNeedsOnboarding = user && needsOnboarding(user.role);
   const isOnboardingPage = window.location.pathname.includes('/onboarding');

   console.log('🔍 ProtectedRoute - статус:', {
      user: user?.email,
      userRole: user?.role,
      loading,
      hasCheckedAuth,
      userNeedsOnboarding,
      currentPath: window.location.pathname,
      isOnboardingPage
   });

   if (loading) {
      return <div>Загрузка...</div>;
   }

   if (!user && hasCheckedAuth) {
      console.log('🟡 ProtectedRoute → /login (нет пользователя)');
      return <Navigate to="/login" replace />;
   }

   if (user && hasCheckedAuth) {
      // ✅ СЦЕНАРИЙ 1: Пользователь нуждается в onboarding и НЕ на странице onboarding
      if (userNeedsOnboarding && !isOnboardingPage) {
         console.log('🟡 ProtectedRoute → /onboarding (нужен onboarding)');
         return <Navigate to="/onboarding" replace />;
      }

      // ✅ СЦЕНАРИЙ 2: Onboarding уже завершен (выбрана роль или пропущен) и пользователь на странице onboarding
      if (!userNeedsOnboarding && isOnboardingPage) {
         console.log('🟡 ProtectedRoute → /profile (редирект с onboarding, т.к. onboarding завершен)');
         return <Navigate to="/profile" replace />;
      }

      console.log('🟡 ProtectedRoute → элемент (доступ разрешен)');
      return element;
   }

   return <div>Проверяем авторизацию...</div>;
};

export default ProtectedRoute;