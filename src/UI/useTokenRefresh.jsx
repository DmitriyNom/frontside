// // // import axios from 'axios';
// // // import { useDispatch } from 'react-redux';
// // // import { logout } from '../features/authSlice'

// // // const useTokenRefresh = () => {
// // //    const dispatch = useDispatch();

// // //    const refreshAccessToken = async (refreshToken) => {
// // //       try {
// // //          const response = await axios.post('/api/user/refresh', { refreshToken });
// // //          return response.data.accessToken; // возвращаем новый access токен
// // //       } catch (error) {
// // //          // Если не удалось обновить токен, разлогиниваем пользователя
// // //          dispatch(logout());
// // //          throw new Error('Не удалось обновить токен');
// // //       }
// // //    };

// // //    return { refreshAccessToken };
// // // };

// // // export default useTokenRefresh
// // import { useEffect, useCallback, useRef } from 'react';
// // import { useDispatch, useSelector } from 'react-redux';
// // import { toast } from 'react-toastify';
// // import {
// //    logoutWithoutApi, // ✅ ИСПРАВЛЕНО: Используем logout без API
// //    refreshTokens,
// //    selectLastTokenRefresh,
// //    selectRefreshAttempts,
// //    selectIsAuthenticated,
// //    selectIsCheckingAuth
// // } from '../features/authSlice';

// // const useTokenRefresh = () => {
// //    const dispatch = useDispatch();
// //    const lastTokenRefresh = useSelector(selectLastTokenRefresh);
// //    const refreshAttempts = useSelector(selectRefreshAttempts);
// //    const isAuthenticated = useSelector(selectIsAuthenticated);
// //    const isCheckingAuth = useSelector(selectIsCheckingAuth);

// //    const refreshIntervalRef = useRef(null);
// //    const isRefreshingRef = useRef(false);
// //    const refreshTimeoutRef = useRef(null);
// //    const authExpiredHandledRef = useRef(false); // ✅ Добавляем флаг для предотвращения повторной обработки

// //    // Функция для обновления токенов
// //    const refreshToken = useCallback(async () => {
// //       // Предотвращаем множественные одновременные обновления
// //       if (isRefreshingRef.current) {
// //          console.log('Обновление токена уже в процессе, пропускаем...');
// //          return;
// //       }

// //       isRefreshingRef.current = true;

// //       try {
// //          console.log('Запуск обновления токена...');
// //          await dispatch(refreshTokens()).unwrap();
// //          console.log('Токен успешно обновлен');
// //          authExpiredHandledRef.current = false; // ✅ Сбрасываем флаг при успешном обновлении
// //       } catch (error) {
// //          console.error('Не удалось обновить токен:', error);

// //          // Если несколько неудачных попыток подряд, делаем logout
// //          if (refreshAttempts >= 2) {
// //             // ✅ Проверяем, не обрабатывали ли мы уже событие
// //             if (!authExpiredHandledRef.current) {
// //                authExpiredHandledRef.current = true;

// //                console.log('Выполняем logout из-за неудачных попыток обновления');

// //                // ✅ ИСПРАВЛЕНО: Используем logout без API запроса
// //                dispatch(logoutWithoutApi());

// //                toast.error('Сессия истекла. Пожалуйста, войдите снова.', {
// //                   position: "top-right",
// //                   autoClose: 5000,
// //                });

// //                // Перенаправляем на страницу логина
// //                setTimeout(() => {
// //                   window.location.href = '/login';
// //                }, 1000);
// //             }
// //          }
// //       } finally {
// //          isRefreshingRef.current = false;
// //       }
// //    }, [dispatch, refreshAttempts]);

// //    // Вычисляем, когда нужно обновить токен в следующий раз
// //    const scheduleNextRefresh = useCallback(() => {
// //       // Очищаем предыдущие таймеры
// //       if (refreshTimeoutRef.current) {
// //          clearTimeout(refreshTimeoutRef.current);
// //       }

// //       // Не планируем обновление, если пользователь не авторизован
// //       if (!isAuthenticated) {
// //          console.log('Пользователь не авторизован, пропускаем планирование обновления токена');
// //          return;
// //       }

// //       if (!lastTokenRefresh) {
// //          console.log('Нет информации о времени обновления токена, запускаем принудительное обновление');
// //          // Если lastTokenRefresh не установлен, но пользователь авторизован,
// //          // запускаем обновление немедленно
// //          setTimeout(() => {
// //             refreshToken();
// //          }, 1000); // Небольшая задержка для гарантии инициализации
// //          return;
// //       }

// //       const now = Date.now();
// //       const timeSinceLastRefresh = now - lastTokenRefresh;
// //       const refreshInterval = 14 * 60 * 1000; // 14 минут (access token живет 15 минут)

// //       // Вычисляем время до следующего обновления
// //       let timeUntilNextRefresh = Math.max(refreshInterval - timeSinceLastRefresh, 0);

// //       // Минимальная задержка 30 секунд, максимальная - 14 минут
// //       timeUntilNextRefresh = Math.max(timeUntilNextRefresh, 30000);
// //       timeUntilNextRefresh = Math.min(timeUntilNextRefresh, refreshInterval);

// //       console.log(`Следующее обновление токена через: ${Math.round(timeUntilNextRefresh / 1000 / 60)} минут`);

// //       refreshTimeoutRef.current = setTimeout(() => {
// //          console.log('Время обновлять токен по расписанию');
// //          refreshToken();
// //          scheduleNextRefresh(); // Планируем следующее обновление
// //       }, timeUntilNextRefresh);
// //    }, [lastTokenRefresh, refreshToken, isAuthenticated]);

// //    // Основной эффект для планирования обновлений
// //    useEffect(() => {
// //       // Ждем завершения проверки авторизации
// //       if (isCheckingAuth) {
// //          console.log('Проверка авторизации еще не завершена...');
// //          return;
// //       }

// //       // Если пользователь не авторизован, очищаем таймеры
// //       if (!isAuthenticated) {
// //          console.log('Пользователь не авторизован, очищаем таймеры обновления');
// //          if (refreshTimeoutRef.current) {
// //             clearTimeout(refreshTimeoutRef.current);
// //          }
// //          if (refreshIntervalRef.current) {
// //             clearInterval(refreshIntervalRef.current);
// //          }
// //          return;
// //       }

// //       console.log('Пользователь авторизован, запускаем планирование обновления токенов');

// //       // Запускаем планирование обновления
// //       scheduleNextRefresh();

// //       // Также настраиваем периодическую проверку каждые 5 минут на случай проблем с таймером
// //       const interval = 5 * 60 * 1000; // 5 минут
// //       refreshIntervalRef.current = setInterval(() => {
// //          const now = Date.now();
// //          const timeSinceLastRefresh = now - lastTokenRefresh;

// //          if (timeSinceLastRefresh > 15 * 60 * 1000) { // 15 минут
// //             console.log('Токен не обновлялся более 15 минут, принудительно обновляем...');
// //             refreshToken();
// //          }
// //       }, interval);

// //       return () => {
// //          if (refreshTimeoutRef.current) {
// //             clearTimeout(refreshTimeoutRef.current);
// //          }
// //          if (refreshIntervalRef.current) {
// //             clearInterval(refreshIntervalRef.current);
// //          }
// //       };
// //    }, [lastTokenRefresh, refreshToken, scheduleNextRefresh, isAuthenticated, isCheckingAuth]);

// //    // Обработчик события истечения аутентификации (от api.js)
// //    useEffect(() => {
// //       const handleAuthExpired = (event) => {
// //          console.log('Получено событие auth-expired:', event.detail);

// //          // ✅ Проверяем, не обрабатывали ли мы уже событие
// //          if (authExpiredHandledRef.current) {
// //             console.log('Событие auth-expired уже обработано, пропускаем');
// //             return;
// //          }

// //          authExpiredHandledRef.current = true;

// //          console.log('Выполняем logout по событию auth-expired');

// //          // ✅ ИСПРАВЛЕНО: Используем logout без API запроса
// //          dispatch(logoutWithoutApi());

// //          toast.error('Сессия истекла. Пожалуйста, войдите снова.', {
// //             position: "top-right",
// //             autoClose: 5000,
// //          });

// //          // Не перенаправляем сразу, даем пользователю увидеть сообщение
// //          setTimeout(() => {
// //             window.location.href = '/login';
// //          }, 2000);
// //       };

// //       window.addEventListener('auth-expired', handleAuthExpired);

// //       return () => {
// //          window.removeEventListener('auth-expired', handleAuthExpired);
// //       };
// //    }, [dispatch]);

// //    // Функция для принудительного обновления токена (можно вызвать извне)
// //    const forceRefresh = useCallback(async () => {
// //       await refreshToken();
// //    }, [refreshToken]);

// //    // Публичный API хука
// //    return {
// //       forceRefresh,
// //       isRefreshing: isRefreshingRef.current
// //    };
// // };

// // export default useTokenRefresh;

// import { useEffect, useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { toast } from 'react-toastify';
// import {
//    logoutWithoutApi,
//    refreshTokens,
//    selectLastTokenRefresh,
//    selectRefreshAttempts,
//    selectIsAuthenticated,
//    selectIsCheckingAuth
// } from '../features/authSlice';

// const useTokenRefresh = () => {
//    const dispatch = useDispatch();
//    const lastTokenRefresh = useSelector(selectLastTokenRefresh);
//    const refreshAttempts = useSelector(selectRefreshAttempts);
//    const isAuthenticated = useSelector(selectIsAuthenticated);
//    const isCheckingAuth = useSelector(selectIsCheckingAuth);

//    const refreshTimeoutRef = useRef(null);
//    const isRefreshingRef = useRef(false);
//    const authExpiredHandledRef = useRef(false);
//    const isInitializedRef = useRef(false);

//    const refreshToken = useCallback(async () => {
//       // ✅ НЕ обновляем токен, если пользователь не авторизован
//       if (!isAuthenticated) {
//          console.log('❌ useTokenRefresh: refreshToken пропущен - пользователь не авторизован');
//          return;
//       }

//       if (isRefreshingRef.current) {
//          console.log('⏳ useTokenRefresh: refreshToken уже в процессе');
//          return;
//       }

//       isRefreshingRef.current = true;
//       console.log('🔄 useTokenRefresh: обновление токена...');

//       try {
//          await dispatch(refreshTokens()).unwrap();
//          console.log('✅ useTokenRefresh: токен обновлен');
//          authExpiredHandledRef.current = false;
//       } catch (error) {
//          console.error('❌ useTokenRefresh: ошибка обновления', error);

//          if (refreshAttempts >= 2 && isAuthenticated && !authExpiredHandledRef.current) {
//             authExpiredHandledRef.current = true;
//             console.log('🚪 useTokenRefresh: сессия истекла, выход');

//             dispatch(logoutWithoutApi());

//             toast.error('Сессия истекла. Пожалуйста, войдите снова.', {
//                position: "top-right",
//                autoClose: 5000,
//             });

//             setTimeout(() => {
//                window.location.href = '/login';
//             }, 1500);
//          }
//       } finally {
//          isRefreshingRef.current = false;
//       }
//    }, [dispatch, refreshAttempts, isAuthenticated]);

//    const scheduleNextRefresh = useCallback(() => {
//       // Очищаем старый таймер
//       if (refreshTimeoutRef.current) {
//          clearTimeout(refreshTimeoutRef.current);
//          refreshTimeoutRef.current = null;
//       }

//       // ✅ НЕ планируем если не авторизованы
//       if (!isAuthenticated) {
//          console.log('❌ useTokenRefresh: scheduleNextRefresh пропущен - пользователь не авторизован');
//          return;
//       }

//       // ✅ НЕ планируем если нет lastTokenRefresh (еще не было успешного входа)
//       if (!lastTokenRefresh) {
//          console.log('⏸️ useTokenRefresh: ожидание firstRefresh (нет lastTokenRefresh)');
//          return;
//       }

//       const now = Date.now();
//       const timeSinceLastRefresh = now - lastTokenRefresh;
//       const refreshInterval = 14 * 60 * 1000; // 14 минут
//       let delay = refreshInterval - timeSinceLastRefresh;

//       // Если уже пора, обновляем сразу
//       if (delay <= 0) {
//          console.log('⚡ useTokenRefresh: немедленное обновление');
//          refreshToken();
//          return;
//       }

//       // Минимум 30 секунд
//       delay = Math.max(delay, 30000);

//       console.log(`📅 useTokenRefresh: следующий refresh через ${Math.round(delay / 60000)} минут`);

//       refreshTimeoutRef.current = setTimeout(() => {
//          console.log('⏰ useTokenRefresh: время пришло');
//          refreshToken();
//          scheduleNextRefresh(); // Планируем следующий
//       }, delay);
//    }, [lastTokenRefresh, refreshToken, isAuthenticated]);

//    // ✅ Управление refresh-циклом
//    useEffect(() => {
//       // Ждем окончания проверки авторизации
//       if (isCheckingAuth) {
//          console.log('🔍 useTokenRefresh: ждем checkAuth...');
//          return;
//       }

//       // Если не авторизованы - очищаем таймеры и сбрасываем флаг инициализации
//       if (!isAuthenticated) {
//          if (refreshTimeoutRef.current) {
//             clearTimeout(refreshTimeoutRef.current);
//             refreshTimeoutRef.current = null;
//          }
//          if (isInitializedRef.current) {
//             console.log('🚪 useTokenRefresh: пользователь не авторизован, останавливаем цикл');
//             isInitializedRef.current = false;
//          }
//          return;
//       }

//       // ✅ Если авторизованы и есть lastTokenRefresh - запускаем цикл
//       if (isAuthenticated && lastTokenRefresh && !isInitializedRef.current) {
//          console.log('🎯 useTokenRefresh: инициализация refresh-цикла для авторизованного пользователя');
//          isInitializedRef.current = true;

//          // Небольшая задержка после входа
//          const timer = setTimeout(() => {
//             scheduleNextRefresh();
//          }, 5000);

//          return () => clearTimeout(timer);
//       }
//    }, [isAuthenticated, lastTokenRefresh, isCheckingAuth, scheduleNextRefresh]);

//    // Обработчик события истечения сессии
//    useEffect(() => {
//       const handleAuthExpired = () => {
//          if (authExpiredHandledRef.current) return;
//          authExpiredHandledRef.current = true;

//          console.log('⚠️ useTokenRefresh: получено событие auth-expired');
//          dispatch(logoutWithoutApi());

//          toast.error('Сессия истекла. Пожалуйста, войдите снова.', {
//             position: "top-right",
//             autoClose: 5000,
//          });

//          setTimeout(() => {
//             window.location.href = '/login';
//          }, 1500);
//       };

//       window.addEventListener('auth-expired', handleAuthExpired);
//       return () => window.removeEventListener('auth-expired', handleAuthExpired);
//    }, [dispatch]);

//    const forceRefresh = useCallback(async () => {
//       if (!isAuthenticated) {
//          console.log('❌ forceRefresh: пользователь не авторизован');
//          return;
//       }
//       await refreshToken();
//    }, [refreshToken, isAuthenticated]);

//    return { forceRefresh };
// };

// export default useTokenRefresh;

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
   logoutWithoutApi,
   refreshTokens,
   selectLastTokenRefresh,
   selectRefreshAttempts,
   selectIsAuthenticated,
   selectIsCheckingAuth
} from '../features/authSlice';

const useTokenRefresh = () => {
   const dispatch = useDispatch();
   const lastTokenRefresh = useSelector(selectLastTokenRefresh);
   const refreshAttempts = useSelector(selectRefreshAttempts);
   const isAuthenticated = useSelector(selectIsAuthenticated);
   const isCheckingAuth = useSelector(selectIsCheckingAuth);

   const refreshTimeoutRef = useRef(null);
   const isRefreshingRef = useRef(false);
   const authExpiredHandledRef = useRef(false);

   const refreshToken = useCallback(async () => {
      // ✅ НЕ обновляем токен, если пользователь не авторизован
      if (!isAuthenticated) {
         return;
      }

      if (isRefreshingRef.current) {
         return;
      }

      isRefreshingRef.current = true;

      try {
         await dispatch(refreshTokens()).unwrap();
         authExpiredHandledRef.current = false;
      } catch (error) {
         if (refreshAttempts >= 2 && isAuthenticated && !authExpiredHandledRef.current) {
            authExpiredHandledRef.current = true;
            dispatch(logoutWithoutApi());

            toast.error('Сессия истекла. Пожалуйста, войдите снова.', {
               position: "top-right",
               autoClose: 5000,
            });

            setTimeout(() => {
               window.location.href = '/login';
            }, 1500);
         }
      } finally {
         isRefreshingRef.current = false;
      }
   }, [dispatch, refreshAttempts, isAuthenticated]);

   const scheduleNextRefresh = useCallback(() => {
      if (refreshTimeoutRef.current) {
         clearTimeout(refreshTimeoutRef.current);
         refreshTimeoutRef.current = null;
      }

      // ✅ НЕ планируем если не авторизованы или нет lastTokenRefresh
      if (!isAuthenticated || !lastTokenRefresh) {
         return;
      }

      const now = Date.now();
      const timeSinceLastRefresh = now - lastTokenRefresh;
      const refreshInterval = 14 * 60 * 1000;
      let delay = refreshInterval - timeSinceLastRefresh;

      if (delay <= 0) {
         refreshToken();
         return;
      }

      delay = Math.max(delay, 30000);

      refreshTimeoutRef.current = setTimeout(() => {
         refreshToken();
         scheduleNextRefresh();
      }, delay);
   }, [lastTokenRefresh, refreshToken, isAuthenticated]);

   // ✅ Главный эффект - запускается ТОЛЬКО когда все условия выполнены
   useEffect(() => {
      if (isCheckingAuth) {
         return;
      }

      if (!isAuthenticated || !lastTokenRefresh) {
         return;
      }

      console.log('🎯 useTokenRefresh: запуск refresh-цикла');
      scheduleNextRefresh();

      return () => {
         if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
         }
      };
   }, [isAuthenticated, lastTokenRefresh, isCheckingAuth, scheduleNextRefresh]);

   // Обработчик события истечения сессии
   useEffect(() => {
      const handleAuthExpired = () => {
         if (authExpiredHandledRef.current) return;
         authExpiredHandledRef.current = true;

         dispatch(logoutWithoutApi());

         toast.error('Сессия истекла. Пожалуйста, войдите снова.', {
            position: "top-right",
            autoClose: 5000,
         });

         setTimeout(() => {
            window.location.href = '/login';
         }, 1500);
      };

      window.addEventListener('auth-expired', handleAuthExpired);
      return () => window.removeEventListener('auth-expired', handleAuthExpired);
   }, [dispatch]);

   const forceRefresh = useCallback(async () => {
      if (!isAuthenticated) return;
      await refreshToken();
   }, [refreshToken, isAuthenticated]);

   return { forceRefresh };
};

export default useTokenRefresh;