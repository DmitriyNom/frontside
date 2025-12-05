import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginForm from '../src/UI/Forms/LoginForm';
import RegisterForm from '../src/UI/Forms/RegisterForm';
import OnboardingPage from '../src/UI/Pages/Onboarding/OnboardingPage';
import Profile from '../src/UI/Pages/Profile/Profile';
import ProtectedRoute from '../src/UI/ProtectedRoute';
import HomeRedirect from '../src/UI/HomeRedirect';
import { fetchUserProfile, selectIsAuthenticated } from '../src/features/authSlice';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { resetOnboarding, forceShowOnboarding } from '../src/features/onboardingSlice'; // ✅ ДОБАВЛЯЕМ

const App = () => {
   const dispatch = useDispatch();
   const isAuthenticated = useSelector(selectIsAuthenticated);
   const { user } = useSelector(state => state.auth);
   const onboarding = useSelector(state => state.onboarding);

   // Инициализируем логику onboarding
   useOnboarding();

   useEffect(() => {
      if (!isAuthenticated) {
         dispatch(fetchUserProfile());
      }
   }, [dispatch, isAuthenticated]);

   // ✅ ДОБАВЛЯЕМ: Отладочная информация
   console.log('🔍 App - статус:', {
      user: user?.email,
      userRole: user?.role,
      isAuthenticated,
      onboarding: {
         showOnboarding: onboarding.showOnboarding,
         skipped: onboarding.skipped,
         isLoading: onboarding.isLoading
      }
   });

   return (
      <Router>
         {/* ✅ ДОБАВЛЯЕМ: Панель управления для отладки */}
         <div style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 9999,
            background: 'rgba(0,0,0,0.8)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            fontSize: '12px'
         }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
               🛠️ Панель отладки Onboarding
            </div>

            <button
               onClick={() => dispatch(resetOnboarding())}
               style={{
                  background: 'orange',
                  color: 'black',
                  padding: '8px',
                  margin: '2px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
               }}
            >
               🔄 Сбросить Onboarding
            </button>

            <button
               onClick={() => dispatch(forceShowOnboarding())}
               style={{
                  background: 'green',
                  color: 'white',
                  padding: '8px',
                  margin: '2px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
               }}
            >
               🎯 Показать Onboarding
            </button>

            <button
               onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
               }}
               style={{
                  background: 'red',
                  color: 'white',
                  padding: '8px',
                  margin: '2px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
               }}
            >
               🔥 Очистить кэш
            </button>

            {/* ✅ ДОБАВЛЯЕМ: Информация о состоянии */}
            <div style={{ marginTop: '10px', fontSize: '10px' }}>
               <div>👤 Пользователь: {user?.email || 'не авторизован'}</div>
               <div>🎭 Роль: {user?.role || 'не выбрана'}</div>
               <div>📱 Onboarding: {onboarding.showOnboarding ? 'показан' : 'скрыт'}</div>
               <div>⏩ Пропущен: {onboarding.skipped ? 'да' : 'нет'}</div>
            </div>
         </div>

         <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />

            {/* Onboarding route */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Protected routes */}
            <Route path="/profile" element={
               <ProtectedRoute element={<Profile />} />
            } />

            {/* Умный редирект */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Fallback route */}
            <Route path="*" element={<div>Страница не найдена</div>} />
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