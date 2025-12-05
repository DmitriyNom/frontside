import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { USER_ROLES } from '../constants/userRoles'; // ✅ ИМПОРТИРУЕМ КОНСТАНТЫ

// ✅ РЕАЛЬНАЯ версия API с детальной отладкой
export const updateOnboarding = createAsyncThunk(
   'onboarding/updateOnboarding',
   async (onboardingData, { rejectWithValue }) => {
      try {
         console.log('🟡 Отправляем onboarding данные:', onboardingData);

         // ✅ ВРЕМЕННО ИСПОЛЬЗУЕМ АБСОЛЮТНЫЙ URL ДЛЯ ТЕСТИРОВАНИЯ
         const API_URL = 'http://localhost:5000/api/user/onboarding'; // ваш порт бэкенда
         // ИЛИ: const API_URL = `${window.location.origin}/api/users/onboarding`;

         console.log('🔍 Debug - полный URL:', API_URL);
         console.log('🔍 Debug - cookies:', document.cookie);

         const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(onboardingData),
         });

         console.log('🔍 Debug - статус ответа:', response.status);
         console.log('🔍 Debug - заголовки ответа:', Object.fromEntries(response.headers.entries()));

         // ✅ ПРОВЕРЯЕМ Content-Type перед парсингом
         const contentType = response.headers.get('content-type');
         console.log('🔍 Debug - Content-Type:', contentType);

         if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('🔴 Сервер вернул не JSON. Текст ответа:', text.substring(0, 500));
            throw new Error(`Сервер вернул HTML вместо JSON. Проверьте что endpoint ${API_URL} существует и бэкенд запущен.`);
         }

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
         }

         const result = await response.json();
         console.log('🟢 Onboarding данные сохранены:', result);
         return result;
      } catch (error) {
         console.error('🔴 Ошибка в updateOnboarding:', error);

         // ✅ БОЛЕЕ ИНФОРМАТИВНАЯ ОШИБКА
         if (error.message.includes('Failed to fetch')) {
            return rejectWithValue('Не удалось подключиться к серверу. Убедитесь что бэкенд запущен.');
         }

         return rejectWithValue(error.message);
      }
   }
);

const onboardingSlice = createSlice({
   name: 'onboarding',
   initialState: {
      // Статус показа onboarding
      showOnboarding: false,
      // Было ли пропущено (устаревшее, теперь используем role: 'skipped')
      skipped: localStorage.getItem('onboardingSkipped') === 'true' || false,
      // Загрузка
      isLoading: false,
      // Ошибки
      error: null,
      // Временные данные (пока не сохранены на сервере)
      tempData: {
         role: null
      }
   },
   reducers: {
      // Показать/скрыть onboarding
      setShowOnboarding: (state, action) => {
         state.showOnboarding = action.payload;
         console.log('🟡 setShowOnboarding:', action.payload);
      },

      // Установить пропуск (устаревшее, оставляем для совместимости)
      setSkipped: (state, action) => {
         state.skipped = action.payload;
         localStorage.setItem('onboardingSkipped', action.payload.toString());
         console.log('🟡 setSkipped:', action.payload, '(saved to localStorage)');
      },

      // Обновить временные данные
      setTempData: (state, action) => {
         state.tempData = { ...state.tempData, ...action.payload };
         console.log('🟡 setTempData:', action.payload);
      },

      // ✅ УЛУЧШЕННЫЙ СБРОС - полная очистка состояния
      resetOnboarding: (state) => {
         state.showOnboarding = false;
         state.skipped = false;
         state.isLoading = false;
         state.error = null;
         state.tempData = { role: null };
         // ✅ ОЧИЩАЕМ LOCALSTORAGE
         localStorage.removeItem('onboardingSkipped');
         console.log('🟡 resetOnboarding - ПОЛНЫЙ СБРОС');
      },

      // ✅ ДОБАВЛЯЕМ: Принудительный показ onboarding (для отладки)
      forceShowOnboarding: (state) => {
         state.showOnboarding = true;
         state.skipped = false;
         localStorage.removeItem('onboardingSkipped');
         console.log('🟡 forceShowOnboarding - принудительный показ');
      },

      // Очистить ошибки
      clearError: (state) => {
         state.error = null;
      }
   },
   extraReducers: (builder) => {
      builder
         // updateOnboarding pending
         .addCase(updateOnboarding.pending, (state) => {
            state.isLoading = true;
            state.error = null;
            console.log('🟡 updateOnboarding pending');
         })
         // updateOnboarding fulfilled
         .addCase(updateOnboarding.fulfilled, (state, action) => {
            state.isLoading = false;
            state.showOnboarding = false; // Закрываем onboarding после успеха
            state.tempData = { role: null }; // Очищаем временные данные

            // ✅ УСТАНАВЛИВАЕМ ПРОПУСК В LOCALSTORAGE ЕСЛИ ROLE = 'skipped'
            if (action.payload.role === USER_ROLES.SKIPPED) {
               state.skipped = true;
               localStorage.setItem('onboardingSkipped', 'true');
               console.log('🟢 Onboarding пропущен, установлен role="skipped"');
            } else {
               state.skipped = false;
               localStorage.setItem('onboardingSkipped', 'false');
            }

            console.log('🟢 updateOnboarding fulfilled - onboarding завершен');
         })
         // updateOnboarding rejected
         .addCase(updateOnboarding.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
            console.log('🔴 updateOnboarding rejected:', action.payload);
         });
   }
});

export const {
   setShowOnboarding,
   setSkipped,
   setTempData,
   resetOnboarding,
   forceShowOnboarding,
   clearError
} = onboardingSlice.actions;

export default onboardingSlice.reducer;