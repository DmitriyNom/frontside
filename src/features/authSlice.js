import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Создаем действие для регистрации пользователя
export const registerUser = createAsyncThunk(
   'auth/registerUser',
   async ({ email, password, role, userName, sport_specialization, training_level }, { rejectWithValue }) => {
      try {
         const response = await api.post('/api/user/registration', {
            email,
            password,
            role: role || null,
            userName,
            sport_specialization,
            training_level,
         }, { withCredentials: true });
         return response.data;
      } catch (err) {
         console.error('Ошибка регистрации:', err.response?.data?.message || err.message);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Создаем действие для входа пользователя
export const loginUser = createAsyncThunk(
   'auth/loginUser',
   async ({ email, password }, { rejectWithValue }) => {
      try {
         const response = await api.post('/api/user/login', { email, password }, {
            withCredentials: true,
         });
         return response.data;
      } catch (err) {
         console.error('Ошибка входа:', err.response?.data?.message || err.message);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Создаем действие для выхода пользователя
export const logoutUser = createAsyncThunk(
   'auth/logoutUser',
   async (_, { rejectWithValue }) => {
      try {
         await api.post('/api/user/logout', {}, { withCredentials: true });
      } catch (err) {
         console.error('Ошибка выхода:', err.response?.data?.message || err.message);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Создаем действие для загрузки профиля пользователя
export const fetchUserProfile = createAsyncThunk(
   'auth/fetchUserProfile',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/user/profile', {
            withCredentials: true,
         });
         return response.data;
      } catch (err) {
         console.error('Ошибка загрузки профиля:', err.response?.data?.message || err.message);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Создаем действие для обновления профиля
export const updateUserProfile = createAsyncThunk(
   'auth/updateUserProfile',
   async (profileData, { rejectWithValue }) => {
      try {
         const response = await api.put('/api/user/profile', profileData, {
            withCredentials: true,
         });
         return response.data;
      } catch (err) {
         console.error('Ошибка обновления профиля:', err.response?.data?.message || err.message);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ - НЕ УСТАНАВЛИВАЕМ role ПО УМОЛЧАНИЮ
const processUserData = (userData) => {
   if (!userData) return null;

   console.log('🔍 processUserData - исходные данные:', userData);

   const processedData = {
      // Старые поля
      id: userData.id,
      userName: userData.userName || '',
      email: userData.email || '',
      birthDate: userData.birthDate || null,
      userAvatar: userData.userAvatar || null,

      // ✅ КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: сохраняем role как есть
      role: userData.role,

      sport_specialization: userData.sport_specialization || '',
      training_level: userData.training_level || null,
      allow_connections: userData.allow_connections !== false,
   };

   console.log('🔍 processUserData - обработанные данные:', processedData);
   return processedData;
};

// Создаем slice для аутентификации
const authSlice = createSlice({
   name: 'auth',
   initialState: {
      user: null,
      isProfileFetched: false,
      loading: false,
      error: null,
   },
   reducers: {
      clearError(state) {
         state.error = null;
      },
      resetAuth(state) {
         state.user = null;
         state.isProfileFetched = false;
         state.error = null;
         state.loading = false;
      },
      // Новый редьюсер для установки роли (для использования после onboarding)
      setUserRole(state, action) {
         if (state.user) {
            state.user.role = action.payload;
            console.log('🟢 Роль пользователя установлена:', action.payload);
         }
      },
      updateProfile(state, action) {
         if (state.user) {
            state.user = {
               ...state.user,
               ...action.payload
            };
         }
      },
      clearUser(state) {
         state.user = null;
         state.isProfileFetched = false;
      }
   },
   extraReducers: (builder) => {
      builder
         // регистрация
         .addCase(registerUser.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(registerUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.error = null;
            console.log('🟢 Пользователь зарегистрирован (role):', state.user?.role);
         })
         .addCase(registerUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка регистрации';
         })

         // логин
         .addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.error = null;
            console.log('🟢 Пользователь вошел (role):', state.user?.role);
         })
         .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка входа';
         })

         // выход
         .addCase(logoutUser.pending, (state) => {
            state.loading = true;
         })
         .addCase(logoutUser.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
            state.isProfileFetched = false;
            state.error = null;
         })
         .addCase(logoutUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка выхода';
         })

         // загрузка профиля
         .addCase(fetchUserProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.isProfileFetched = true;
            console.log('🟢 Профиль загружен (role):', state.user?.role);
            state.error = null;
         })
         .addCase(fetchUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.isProfileFetched = true;
            state.error = action.payload || 'Ошибка загрузки профиля';
         })

         // обновление профиля
         .addCase(updateUserProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(updateUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.error = null;
            console.log('🟢 Профиль обновлен (role):', state.user?.role);
         })
         .addCase(updateUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка обновления профиля';
         });
   },
});

// Селекторы
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectIsProfileFetched = (state) => state.auth.isProfileFetched;
export const selectLoading = (state) => state.auth.loading;
export const selectError = (state) => state.auth.error;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectUserTrainingLevel = (state) => state.auth.user?.training_level;
export const selectUserSportSpecialization = (state) => state.auth.user?.sport_specialization;
export const selectUserAllowConnections = (state) => state.auth.user?.allow_connections !== false;
export const selectIsTrainer = (state) => state.auth.user?.role === 'trainer';
export const selectIsTrainee = (state) => state.auth.user?.role === 'trainee';
export const selectHasRole = (state) => !!state.auth.user?.role;

// Экспортируем действия и редюсер
export const { clearError, resetAuth, updateProfile, clearUser, setUserRole } = authSlice.actions;
export default authSlice.reducer;