import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginForm from '../src/UI/Forms/LoginForm';
import RegisterForm from '../src/UI/Forms/RegisterForm';
import OnboardingPage from '../src/UI/Pages/Onboarding/OnboardingPage';
import Profile from '../src/UI/Pages/Profile/Profile';
import MediaLibraryPage from '../src/UI/Pages/MediaLibraryPage'; // Импортируем новую страницу
import ProtectedRoute from '../src/UI/ProtectedRoute';
import HomeRedirect from '../src/UI/HomeRedirect';
import { fetchUserProfile, selectIsAuthenticated } from '../src/features/authSlice';
import { useOnboarding } from '../src/hooks/useOnboarding';

const App = () => {
   const dispatch = useDispatch();
   const isAuthenticated = useSelector(selectIsAuthenticated);

   // Инициализируем логику onboarding
   useOnboarding();

   useEffect(() => {
      if (!isAuthenticated) {
         dispatch(fetchUserProfile());
      }
   }, [dispatch, isAuthenticated]);

   return (
      <Router>
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

            {/* НОВЫЙ МАРШРУТ: Медиа-библиотека */}
            <Route path="/media" element={
               <ProtectedRoute element={<MediaLibraryPage />} />
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