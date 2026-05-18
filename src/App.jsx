// frontend/src/App.jsx
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginForm from '../src/UI/Forms/LoginForm';
import RegisterForm from '../src/UI/Forms/RegisterForm';
import OnboardingPage from '../src/UI/Pages/Onboarding/OnboardingPage';
import Profile from '../src/UI/Pages/Profile/Profile';
import MediaLibraryPage from '../src/UI/Pages/MediaLibraryPage';
import ProtectedRoute from '../src/UI/ProtectedRoute';
import HomeRedirect from '../src/UI/HomeRedirect';
// ❌ УДАЛЕНО: import TasksPage from '../src/UI/Pages/TasksPage';

import {
   checkAuth,
   selectIsAuthenticated,
   selectIsCheckingAuth,
   selectUser,
   selectLastTokenRefresh,
   logoutWithoutApi
} from '../src/features/authSlice';
import { useOnboarding } from '../src/hooks/useOnboarding';
import useTokenRefresh from '../src/UI/useTokenRefresh';

const App = () => {
   const dispatch = useDispatch();
   const isAuthenticated = useSelector(selectIsAuthenticated);
   const isCheckingAuth = useSelector(selectIsCheckingAuth);
   const user = useSelector(selectUser);
   const lastTokenRefresh = useSelector(selectLastTokenRefresh);

   // Флаг для предотвращения повторных вызовов checkAuth
   const hasCheckedAuth = useRef(false);

   useOnboarding();
   const { forceRefresh } = useTokenRefresh();

   // checkAuth запускается ТОЛЬКО ОДИН РАЗ
   useEffect(() => {
      if (!hasCheckedAuth.current) {
         hasCheckedAuth.current = true;
         console.log('🚀 App: Первый запуск checkAuth');
         dispatch(checkAuth());
      }
   }, [dispatch]);

   // Обновление токена только когда пользователь залогинен и нет lastTokenRefresh
   useEffect(() => {
      if (!isCheckingAuth && isAuthenticated && user && !lastTokenRefresh) {
         console.log('🔄 App: Запуск forceRefresh после входа');
         const timer = setTimeout(() => {
            forceRefresh();
         }, 3000);
         return () => clearTimeout(timer);
      }
   }, [isCheckingAuth, isAuthenticated, user, lastTokenRefresh, forceRefresh]);

   // Обработчик события истечения сессии
   useEffect(() => {
      const handleAuthExpired = (event) => {
         console.log('🔴 App: Получено событие auth-expired', event.detail);

         // Очищаем Redux состояние
         dispatch(logoutWithoutApi());

         // Редирект на логин, если страница не уже на логине
         if (window.location.pathname !== '/login') {
            window.location.href = '/login';
         }
      };

      window.addEventListener('auth-expired', handleAuthExpired);

      return () => {
         window.removeEventListener('auth-expired', handleAuthExpired);
      };
   }, [dispatch]);

   // Показываем загрузку во время проверки авторизации
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

   return (
      <Router>
         <Routes>
            <Route path="/login" element={
               isAuthenticated ? <HomeRedirect /> : <LoginForm />
            } />
            <Route path="/register" element={
               isAuthenticated ? <HomeRedirect /> : <RegisterForm />
            } />
            <Route path="/onboarding" element={
               <ProtectedRoute>
                  <OnboardingPage />
               </ProtectedRoute>
            } />
            <Route path="/profile" element={
               <ProtectedRoute>
                  <Profile />
               </ProtectedRoute>
            } />
            <Route path="/media" element={
               <ProtectedRoute>
                  <MediaLibraryPage />
               </ProtectedRoute>
            } />

            {/* ❌ УДАЛЁН маршрут /tasks */}

            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={
               <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                  fontSize: '24px',
                  color: '#999'
               }}>
                  Страница не найдена
               </div>
            } />
         </Routes>

         <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
         />
      </Router>
   );
};

export default App;