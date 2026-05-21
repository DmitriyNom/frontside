import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
   const navigate = useNavigate();
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

            // ✅ ИСПРАВЛЕНО: используем navigate вместо window.location.href
            setTimeout(() => {
               navigate('/login', { replace: true });
            }, 1500);
         }
      } finally {
         isRefreshingRef.current = false;
      }
   }, [dispatch, refreshAttempts, isAuthenticated, navigate]);

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

         // ✅ ИСПРАВЛЕНО: используем navigate вместо window.location.href
         setTimeout(() => {
            navigate('/login', { replace: true });
         }, 1500);
      };

      window.addEventListener('auth-expired', handleAuthExpired);
      return () => window.removeEventListener('auth-expired', handleAuthExpired);
   }, [dispatch, navigate]);

   const forceRefresh = useCallback(async () => {
      if (!isAuthenticated) return;
      await refreshToken();
   }, [refreshToken, isAuthenticated]);

   return { forceRefresh };
};

export default useTokenRefresh;