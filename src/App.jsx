// // import React, { useEffect } from 'react';
// // import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// // import { useDispatch, useSelector } from 'react-redux';
// // import { ToastContainer } from 'react-toastify';
// // import 'react-toastify/dist/ReactToastify.css';

// // import LoginForm from '../src/UI/Forms/LoginForm';
// // import RegisterForm from '../src/UI/Forms/RegisterForm';
// // import OnboardingPage from '../src/UI/Pages/Onboarding/OnboardingPage';
// // import Profile from '../src/UI/Pages/Profile/Profile';
// // import MediaLibraryPage from '../src/UI/Pages/MediaLibraryPage'; // Импортируем новую страницу
// // import ProtectedRoute from '../src/UI/ProtectedRoute';
// // import HomeRedirect from '../src/UI/HomeRedirect';
// // import { fetchUserProfile, selectIsAuthenticated } from '../src/features/authSlice';
// // import { useOnboarding } from '../src/hooks/useOnboarding';

// // const App = () => {
// //    const dispatch = useDispatch();
// //    const isAuthenticated = useSelector(selectIsAuthenticated);

// //    // Инициализируем логику onboarding
// //    useOnboarding();

// //    useEffect(() => {
// //       if (!isAuthenticated) {
// //          dispatch(fetchUserProfile());
// //       }
// //    }, [dispatch, isAuthenticated]);

// //    return (
// //       <Router>
// //          <Routes>
// //             {/* Public routes */}
// //             <Route path="/login" element={<LoginForm />} />
// //             <Route path="/register" element={<RegisterForm />} />

// //             {/* Onboarding route */}
// //             <Route path="/onboarding" element={<OnboardingPage />} />

// //             {/* Protected routes */}
// //             <Route path="/profile" element={
// //                <ProtectedRoute element={<Profile />} />
// //             } />

// //             {/* НОВЫЙ МАРШРУТ: Медиа-библиотека */}
// //             <Route path="/media" element={
// //                <ProtectedRoute element={<MediaLibraryPage />} />
// //             } />

// //             {/* Умный редирект */}
// //             <Route path="/" element={<HomeRedirect />} />

// //             {/* Fallback route */}
// //             <Route path="*" element={<div>Страница не найдена</div>} />
// //          </Routes>

// //          <ToastContainer
// //             position="top-right"
// //             autoClose={5000}
// //             hideProgressBar={false}
// //             newestOnTop={false}
// //             closeOnClick
// //             rtl={false}
// //             pauseOnFocusLoss
// //             draggable
// //             pauseOnHover
// //          />
// //       </Router>
// //    );
// // };

// // export default App;

// import React, { useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// import LoginForm from '../src/UI/Forms/LoginForm';
// import RegisterForm from '../src/UI/Forms/RegisterForm';
// import OnboardingPage from '../src/UI/Pages/Onboarding/OnboardingPage';
// import Profile from '../src/UI/Pages/Profile/Profile';
// import MediaLibraryPage from '../src/UI/Pages/MediaLibraryPage';
// // import NotesPage from '../src/UI/Pages/NotesPage';
// // import Settings from '../src/UI/Pages/Settings';
// import ProtectedRoute from '../src/UI/ProtectedRoute';
// import HomeRedirect from '../src/UI/HomeRedirect';

// // ✅ ИМПОРТИРУЕМ ВСЕ НЕОБХОДИМЫЕ СЕЛЕКТОРЫ
// import {
//    checkAuth,
//    selectIsAuthenticated,
//    selectIsCheckingAuth,
//    selectUser,
//    selectLastTokenRefresh
// } from '../src/features/authSlice';
// import { useOnboarding } from '../src/hooks/useOnboarding';
// import useTokenRefresh from '../src/UI/useTokenRefresh';

// const App = () => {
//    const dispatch = useDispatch();
//    const isAuthenticated = useSelector(selectIsAuthenticated);
//    const isCheckingAuth = useSelector(selectIsCheckingAuth);
//    const user = useSelector(selectUser);
//    const lastTokenRefresh = useSelector(selectLastTokenRefresh);

//    console.log('🔍 App.jsx - состояние:', {
//       isCheckingAuth,
//       isAuthenticated,
//       user: user ? { email: user.email, role: user.role } : null,
//       lastTokenRefresh: lastTokenRefresh ? new Date(lastTokenRefresh).toLocaleTimeString() : null
//    });

//    // Инициализируем логику onboarding
//    useOnboarding();

//    // ✅ ИСПРАВЛЕНО: Инициализируем обновление токенов, но откладываем запуск
//    const { forceRefresh } = useTokenRefresh();

//    // Проверяем авторизацию при загрузке приложения
//    useEffect(() => {
//       console.log('App: Запуск checkAuth...');
//       dispatch(checkAuth());
//    }, [dispatch]);

//    // ✅ ДОБАВЛЯЕМ: Запускаем принудительное обновление после успешной проверки auth
//    useEffect(() => {
//       if (!isCheckingAuth && isAuthenticated && user && !lastTokenRefresh) {
//          console.log('App: Пользователь авторизован, но нет lastTokenRefresh. Запускаем обновление токена...');
//          setTimeout(() => {
//             forceRefresh();
//          }, 1000);
//       }
//    }, [isCheckingAuth, isAuthenticated, user, lastTokenRefresh, forceRefresh]);

//    // Обработчик события истечения аутентификации
//    useEffect(() => {
//       const handleAuthExpired = () => {
//          console.log('App: Получено событие auth-expired');
//       };

//       window.addEventListener('auth-expired', handleAuthExpired);

//       return () => {
//          window.removeEventListener('auth-expired', handleAuthExpired);
//       };
//    }, []);

//    // Показываем индикатор загрузки при проверке авторизации
//    if (isCheckingAuth) {
//       console.log('App: Показываем индикатор загрузки');
//       return (
//          <div style={{
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             height: '100vh',
//             fontSize: '18px',
//             color: '#666'
//          }}>
//             Проверка авторизации...
//          </div>
//       );
//    }

//    console.log('App: Рендерим основной интерфейс');

//    return (
//       <Router>
//          <Routes>
//             {/* Public routes */}
//             <Route path="/login" element={
//                isAuthenticated ? <HomeRedirect /> : <LoginForm />
//             } />
//             <Route path="/register" element={
//                isAuthenticated ? <HomeRedirect /> : <RegisterForm />
//             } />

//             {/* Onboarding route */}
//             <Route path="/onboarding" element={
//                <ProtectedRoute>
//                   <OnboardingPage />
//                </ProtectedRoute>
//             } />

//             {/* Protected routes */}
//             <Route path="/profile" element={
//                <ProtectedRoute>
//                   <Profile />
//                </ProtectedRoute>
//             } />

//             {/* Медиа-библиотека */}
//             <Route path="/media" element={
//                <ProtectedRoute>
//                   <MediaLibraryPage />
//                </ProtectedRoute>
//             } />

//             {/* Умный редирект */}
//             <Route path="/" element={<HomeRedirect />} />

//             {/* Fallback route */}
//             <Route path="*" element={
//                <div style={{
//                   display: 'flex',
//                   justifyContent: 'center',
//                   alignItems: 'center',
//                   height: '100vh',
//                   fontSize: '24px',
//                   color: '#999'
//                }}>
//                   Страница не найдена
//                </div>
//             } />
//          </Routes>

//          <ToastContainer
//             position="top-right"
//             autoClose={5000}
//             hideProgressBar={false}
//             newestOnTop={false}
//             closeOnClick
//             rtl={false}
//             pauseOnFocusLoss
//             draggable
//             pauseOnHover
//          />
//       </Router>
//    );
// };

// export default App;


import React, { useEffect } from 'react';
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
import UserProfile from './UI/Pages/User/UserProfile';

import {
   checkAuth,
   selectIsAuthenticated,
   selectIsCheckingAuth,
   selectUser,
   selectLastTokenRefresh
} from '../src/features/authSlice';
import { useOnboarding } from '../src/hooks/useOnboarding';
import useTokenRefresh from '../src/UI/useTokenRefresh';

const App = () => {
   const dispatch = useDispatch();
   const isAuthenticated = useSelector(selectIsAuthenticated);
   const isCheckingAuth = useSelector(selectIsCheckingAuth);
   const user = useSelector(selectUser);
   const lastTokenRefresh = useSelector(selectLastTokenRefresh);

   useOnboarding();
   const { forceRefresh } = useTokenRefresh();

   useEffect(() => {
      dispatch(checkAuth());
   }, [dispatch]);

   useEffect(() => {
      if (!isCheckingAuth && isAuthenticated && user && !lastTokenRefresh) {
         setTimeout(() => {
            forceRefresh();
         }, 1000);
      }
   }, [isCheckingAuth, isAuthenticated, user, lastTokenRefresh, forceRefresh]);

   useEffect(() => {
      const handleAuthExpired = () => { };
      window.addEventListener('auth-expired', handleAuthExpired);
      return () => {
         window.removeEventListener('auth-expired', handleAuthExpired);
      };
   }, []);

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
            <Route path="/user/:userId" element={
               <ProtectedRoute>
                  <UserProfile />
               </ProtectedRoute>
            } />
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