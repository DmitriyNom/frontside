// src/features/profileSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 🔧 БАЗОВЫЙ URL API (уже настроен в onboardingSlice)
const API_BASE_URL = 'http://localhost:5000/api';

// 📞 1. ЗАГРУЗКА ПРОФИЛЯ (реальный endpoint)
export const loadProfile = createAsyncThunk(
   'profile/loadProfile',
   async (_, { rejectWithValue }) => {
      try {
         console.log('🟡 Загрузка профиля пользователя...');

         const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
            },
            credentials: 'include',
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка загрузки профиля');
         }

         const profileData = await response.json();
         console.log('🟢 Профиль загружен:', profileData);
         return profileData;

      } catch (error) {
         console.error('🔴 Ошибка загрузки профиля:', error);
         return rejectWithValue(error.message || 'Не удалось загрузить профиль');
      }
   }
);

// 📞 2. ОБНОВЛЕНИЕ ПРОФИЛЯ (через существующий /onboarding endpoint)
export const updateProfile = createAsyncThunk(
   'profile/updateProfile',
   async (profileData, { rejectWithValue }) => {
      try {
         console.log('🟡 Обновление профиля через /onboarding:', profileData);

         // 🚀 ИСПОЛЬЗУЕМ СУЩЕСТВУЮЩИЙ ENDPOINT /onboarding
         const response = await fetch(`${API_BASE_URL}/user/onboarding`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(profileData),
         });

         // Проверяем Content-Type перед парсингом
         const contentType = response.headers.get('content-type');

         if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('🔴 Сервер вернул не JSON:', text.substring(0, 500));
            throw new Error('Сервер вернул некорректный ответ');
         }

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
         }

         const result = await response.json();
         console.log('🟢 Профиль обновлен:', result);
         return result;

      } catch (error) {
         console.error('🔴 Ошибка обновления профиля:', error);
         return rejectWithValue(error.message || 'Не удалось обновить профиль');
      }
   }
);


// 📞 4. ПОЛУЧЕНИЕ СПИСКА УРОВНЕЙ (временная реализация)
// Так как отдельного endpoint нет, используем статические данные
export const fetchTrainingLevels = createAsyncThunk(
   'profile/fetchTrainingLevels',
   async (_, { rejectWithValue }) => {
      try {
         console.log('🟡 Загрузка списка уровней подготовки...');

         // ⚠️ ВРЕМЕННО: статические данные
         // 🚀 КОГДА ПОЯВИТСЯ ENDPOINT, МОЖНО БУДЕТ ЗАМЕНИТЬ НА:
         // const response = await fetch(`${API_BASE_URL}/training-levels`, {...});

         await new Promise(resolve => setTimeout(resolve, 200));

         return [
            {
               id: 'beginner',
               name: 'Новичок',
               icon: '🥊',
               description: 'Только начинаю тренироваться',
               minExperience: 0,
               maxExperience: 1
            },
            {
               id: 'amateur',
               name: 'Любитель',
               icon: '💪',
               description: 'Регулярно тренируюсь 1-3 года',
               minExperience: 1,
               maxExperience: 3
            },
            {
               id: 'advanced',
               name: 'Продвинутый',
               icon: '🔥',
               description: 'Опытный спортсмен 3+ лет',
               minExperience: 3,
               maxExperience: 5
            },
            {
               id: 'professional',
               name: 'Профессионал',
               icon: '🏆',
               description: 'Профессиональный уровень',
               minExperience: 5,
               maxExperience: null
            }
         ];

      } catch (error) {
         console.error('🔴 Ошибка загрузки уровней:', error);
         return rejectWithValue(error.message || 'Не удалось загрузить уровни подготовки');
      }
   }
);

// 🏗️ SLICE остается таким же как раньше
const profileSlice = createSlice({
   name: 'profile',
   initialState: {
      userProfile: null,
      trainingLevels: [],
      isLoading: false,
      isSaving: false,
      isLoadingLevels: false,
      error: null,
      saveError: null,
      isLoaded: false,
   },
   reducers: {
      clearErrors: (state) => {
         state.error = null;
         state.saveError = null;
         state.levelError = null;
      },
      resetProfile: (state) => {
         state.userProfile = null;
         state.trainingLevels = [];
         state.isLoaded = false;
         state.error = null;
         state.saveError = null;
         state.levelError = null;
      },
      updateLocalProfile: (state, action) => {
         if (state.userProfile) {
            state.userProfile = {
               ...state.userProfile,
               ...action.payload
            };
         }
      },
   },
   extraReducers: (builder) => {
      // Остается таким же как в предыдущей версии
      builder
         .addCase(loadProfile.pending, (state) => {
            state.isLoading = true;
            state.error = null;
         })
         .addCase(loadProfile.fulfilled, (state, action) => {
            state.isLoading = false;
            state.userProfile = action.payload;
            state.isLoaded = true;
         })
         .addCase(loadProfile.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
            state.isLoaded = false;
         })

         .addCase(updateProfile.pending, (state) => {
            state.isSaving = true;
            state.saveError = null;
         })
         .addCase(updateProfile.fulfilled, (state, action) => {
            state.isSaving = false;
            state.userProfile = {
               ...state.userProfile,
               ...action.payload
            };
         })
         .addCase(updateProfile.rejected, (state, action) => {
            state.isSaving = false;
            state.saveError = action.payload;
         })
         .addCase(fetchTrainingLevels.pending, (state) => {
            state.isLoadingLevels = true;
         })
         .addCase(fetchTrainingLevels.fulfilled, (state, action) => {
            state.isLoadingLevels = false;
            state.trainingLevels = action.payload;
         })
         .addCase(fetchTrainingLevels.rejected, (state, action) => {
            state.isLoadingLevels = false;
            console.warn('Не удалось загрузить уровни:', action.payload);
         });
   }
});

// Экспорты остаются такими же
export const { clearErrors, resetProfile, updateLocalProfile } = profileSlice.actions;
export const selectProfile = (state) => state.profile.userProfile;
export const selectTrainingLevels = (state) => state.profile.trainingLevels;
export const selectIsLoading = (state) => state.profile.isLoading;
export const selectIsSaving = (state) => state.profile.isSaving;
export const selectIsLoadingLevels = (state) => state.profile.isLoadingLevels;
export const selectProfileError = (state) => state.profile.error;
export const selectSaveError = (state) => state.profile.saveError;
export const selectIsProfileLoaded = (state) => state.profile.isLoaded;

export default profileSlice.reducer;