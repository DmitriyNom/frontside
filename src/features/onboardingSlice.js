import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { USER_ROLES } from '../constants/userRoles';

// ✅ Функция для безопасной загрузки из localStorage
const loadTempData = () => {
   try {
      const saved = localStorage.getItem('onboardingTempData');
      if (saved) {
         const parsed = JSON.parse(saved);
         // ✅ Загружаем ТОЛЬКО роль и training_level, НЕ userName!
         return {
            role: parsed.role || null,
            training_level: parsed.training_level || null,
            // sport_specialization: parsed.sport_specialization || '', // если нужно
         };
      }
   } catch (e) {
      console.error('🔴 Ошибка загрузки tempData:', e);
   }
   return {
      role: null,
      training_level: null,
   };
};

// ✅ РЕАЛЬНАЯ версия API с детальной отладкой
export const updateOnboarding = createAsyncThunk(
   'onboarding/updateOnboarding',
   async (onboardingData, { getState, rejectWithValue }) => {
      try {
         const state = getState();
         const currentUser = state.auth.user;

         // ✅ ВАЖНО: Берем userName ТОЛЬКО из текущего пользователя!
         const submitData = {
            role: onboardingData.role,
            userName: currentUser?.userName, // ✅ userName из auth, НЕ из tempData!
            allow_connections: onboardingData.allow_connections ?? true
         };

         // ✅ Добавляем training_level только для спортсмена и если он передан
         if (onboardingData.role === USER_ROLES.TRAINEE && onboardingData.training_level) {
            submitData.training_level = onboardingData.training_level;
         }

         // ✅ Добавляем sport_specialization если есть
         if (onboardingData.sport_specialization) {
            submitData.sport_specialization = onboardingData.sport_specialization;
         }

         console.log('🟡 Отправляем onboarding данные:', submitData);

         const API_URL = 'http://localhost:5000/api/user/onboarding';

         console.log('🔍 Debug - полный URL:', API_URL);
         console.log('🔍 Debug - cookies:', document.cookie);

         const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(submitData), // ✅ Отправляем submitData, а не onboardingData!
         });

         console.log('🔍 Debug - статус ответа:', response.status);
         console.log('🔍 Debug - заголовки ответа:', Object.fromEntries(response.headers.entries()));

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
      showOnboarding: false,
      skipped: localStorage.getItem('onboardingSkipped') === 'true' || false,
      isLoading: false,
      error: null,
      // ✅ ИСПРАВЛЕНО: Загружаем из localStorage БЕЗ userName
      tempData: loadTempData()
   },
   reducers: {
      setShowOnboarding: (state, action) => {
         state.showOnboarding = action.payload;
         console.log('🟡 setShowOnboarding:', action.payload);
      },

      setSkipped: (state, action) => {
         state.skipped = action.payload;
         localStorage.setItem('onboardingSkipped', action.payload.toString());
         console.log('🟡 setSkipped:', action.payload);
      },

      // ✅ ИСПРАВЛЕНО: setTempData - сохраняем только нужные поля
      setTempData: (state, action) => {
         // Разрешаем сохранять только role и training_level
         const allowedFields = {};
         if (action.payload.role !== undefined) {
            allowedFields.role = action.payload.role;
         }
         if (action.payload.training_level !== undefined) {
            allowedFields.training_level = action.payload.training_level;
         }
         if (action.payload.sport_specialization !== undefined) {
            allowedFields.sport_specialization = action.payload.sport_specialization;
         }

         state.tempData = { ...state.tempData, ...allowedFields };

         // ✅ Сохраняем в localStorage (но без userName!)
         const saveData = {
            role: state.tempData.role,
            training_level: state.tempData.training_level,
            sport_specialization: state.tempData.sport_specialization,
         };
         localStorage.setItem('onboardingTempData', JSON.stringify(saveData));

         console.log('🟡 setTempData:', allowedFields);
      },

      // ✅ ИСПРАВЛЕНО: ПОЛНЫЙ СБРОС с очисткой localStorage
      resetOnboarding: (state) => {
         state.showOnboarding = false;
         state.skipped = false;
         state.isLoading = false;
         state.error = null;
         state.tempData = {
            role: null,
            training_level: null,
            sport_specialization: ''
         };

         // ✅ ОЧИЩАЕМ ВЕСЬ localStorage
         localStorage.removeItem('onboardingSkipped');
         localStorage.removeItem('onboardingTempData');

         console.log('🟡 resetOnboarding - ПОЛНЫЙ СБРОС');
      },

      forceShowOnboarding: (state) => {
         state.showOnboarding = true;
         state.skipped = false;
         localStorage.removeItem('onboardingSkipped');
         console.log('🟡 forceShowOnboarding - принудительный показ');
      },

      clearError: (state) => {
         state.error = null;
      }
   },
   extraReducers: (builder) => {
      builder
         .addCase(updateOnboarding.pending, (state) => {
            state.isLoading = true;
            state.error = null;
            console.log('🟡 updateOnboarding pending');
         })
         .addCase(updateOnboarding.fulfilled, (state, action) => {
            state.isLoading = false;
            state.showOnboarding = false;

            // ✅ Очищаем tempData
            state.tempData = {
               role: null,
               training_level: null,
               sport_specialization: ''
            };

            // ✅ Очищаем localStorage
            localStorage.removeItem('onboardingTempData');

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