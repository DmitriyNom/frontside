// frontend/src/features/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';
import axios from 'axios';

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
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const loginUser = createAsyncThunk(
   'auth/loginUser',
   async ({ email, password }, { rejectWithValue }) => {
      try {
         const response = await api.post('/api/user/login', { email, password }, {
            withCredentials: true,
         });
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const checkAuth = createAsyncThunk(
   'auth/checkAuth',
   async (_, { rejectWithValue, getState }) => {
      // ✅ Если уже есть пользователь - не делаем запрос
      const state = getState();
      if (state.auth.isAuthenticated && state.auth.user) {
         console.log('✅ checkAuth: уже авторизован, пропускаем');
         return state.auth.user;
      }

      try {
         console.log('🔍 checkAuth: проверка авторизации...');
         const response = await api.get('/api/user/profile', {
            withCredentials: true,
            _isSilentAuth: true,
         });
         console.log('✅ checkAuth: пользователь авторизован');
         return response.data;
      } catch (err) {
         // ✅ НОВОЕ: пробуем обновить токен при 401 ошибке
         if (err.response?.status === 401) {
            console.log('🔄 checkAuth: accessToken истёк, пробуем обновить...');
            try {
               // Пытаемся обновить токен
               await axios.post('http://localhost:5000/api/user/refresh', {}, {
                  withCredentials: true
               });

               // Повторяем запрос профиля (уже без _isSilentAuth)
               const response = await api.get('/api/user/profile', {
                  withCredentials: true,
               });
               console.log('✅ checkAuth: токен обновлён, пользователь авторизован');
               return response.data;
            } catch (refreshErr) {
               console.log('❌ checkAuth: refresh не удался, пользователь не авторизован');
               return rejectWithValue(null);
            }
         }
         console.log('❌ checkAuth: пользователь не авторизован');
         return rejectWithValue(null);
      }
   }
);

export const refreshTokens = createAsyncThunk(
   'auth/refreshTokens',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.post('/api/user/refresh', {}, {
            withCredentials: true,
         });
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const logoutUser = createAsyncThunk(
   'auth/logoutUser',
   async (_, { rejectWithValue }) => {
      try {
         await api.post('/api/user/logout', {}, { withCredentials: true });
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const fetchUserProfile = createAsyncThunk(
   'auth/fetchUserProfile',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/user/profile', {
            withCredentials: true,
         });
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const updateUserProfile = createAsyncThunk(
   'auth/updateUserProfile',
   async (profileData, { rejectWithValue }) => {
      try {
         const response = await api.put('/api/user/profile', profileData, {
            withCredentials: true,
         });
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

const processUserData = (userData) => {
   if (!userData) return null;

   return {
      id: userData.id,
      userName: userData.userName || '',
      email: userData.email || '',
      birthDate: userData.birthDate || null,
      userAvatar: userData.userAvatar || null,
      role: userData.role,
      sport_specialization: userData.sport_specialization || '',
      training_level: userData.training_level || null,
      allow_connections: userData.allow_connections !== false,
   };
};

const authSlice = createSlice({
   name: 'auth',
   initialState: {
      user: null,
      isProfileFetched: false,
      loading: false,
      error: null,
      isCheckingAuth: true,
      lastTokenRefresh: null,
      refreshAttempts: 0,
      isAuthenticated: false,
   },
   reducers: {
      clearError(state) {
         state.error = null;
      },
      resetAuth(state) {
         state.user = null;
         state.isProfileFetched = false;
         state.isAuthenticated = false;
         state.error = null;
         state.loading = false;
         state.lastTokenRefresh = null;
         state.refreshAttempts = 0;
         state.isCheckingAuth = false;
      },
      setUserRole(state, action) {
         if (state.user) {
            state.user.role = action.payload;
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
         state.isAuthenticated = false;
         state.lastTokenRefresh = null;
         state.refreshAttempts = 0;
         state.isCheckingAuth = false;
      },
      updateTokenRefreshTime(state) {
         state.lastTokenRefresh = Date.now();
         state.refreshAttempts = 0;
      },
      incrementRefreshAttempts(state) {
         state.refreshAttempts += 1;
      },
      logoutWithoutApi(state) {
         state.loading = false;
         state.user = null;
         state.isProfileFetched = false;
         state.isAuthenticated = false;
         state.lastTokenRefresh = null;
         state.refreshAttempts = 0;
         state.error = null;
         state.isCheckingAuth = false;
      },
   },
   extraReducers: (builder) => {
      builder
         .addCase(checkAuth.pending, (state) => {
            state.isCheckingAuth = true;
            state.error = null;
         })
         .addCase(checkAuth.fulfilled, (state, action) => {
            state.isCheckingAuth = false;
            state.user = processUserData(action.payload);
            state.isProfileFetched = true;
            state.isAuthenticated = true;
            state.lastTokenRefresh = Date.now();
            state.error = null;
         })
         .addCase(checkAuth.rejected, (state) => {
            state.isCheckingAuth = false;
            state.user = null;
            state.isProfileFetched = true;
            state.isAuthenticated = false;
            state.error = null;
         })
         .addCase(refreshTokens.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(refreshTokens.fulfilled, (state) => {
            state.loading = false;
            state.lastTokenRefresh = Date.now();
            state.refreshAttempts = 0;
            state.error = null;
         })
         .addCase(refreshTokens.rejected, (state, action) => {
            state.loading = false;
            state.refreshAttempts += 1;

            if (state.refreshAttempts >= 3) {
               state.user = null;
               state.isProfileFetched = false;
               state.isAuthenticated = false;
               state.error = 'Сессия истекла. Пожалуйста, войдите снова.';
            } else {
               state.error = action.payload || 'Ошибка обновления сессии';
            }
         })
         .addCase(registerUser.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(registerUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.isProfileFetched = true;
            state.isAuthenticated = true;
            state.lastTokenRefresh = Date.now();
            state.error = null;
         })
         .addCase(registerUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка регистрации';
         })
         .addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.isProfileFetched = true;
            state.isAuthenticated = true;
            state.lastTokenRefresh = Date.now();
            state.error = null;
         })
         .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка входа';
         })
         .addCase(logoutUser.pending, (state) => {
            state.loading = true;
         })
         .addCase(logoutUser.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
            state.isProfileFetched = false;
            state.isAuthenticated = false;
            state.lastTokenRefresh = null;
            state.refreshAttempts = 0;
            state.error = null;
         })
         .addCase(logoutUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка выхода';
            state.user = null;
            state.isProfileFetched = false;
            state.isAuthenticated = false;
            state.lastTokenRefresh = null;
            state.refreshAttempts = 0;
         })
         .addCase(fetchUserProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.isProfileFetched = true;
            state.isAuthenticated = true;
            state.lastTokenRefresh = Date.now();
            state.error = null;
         })
         .addCase(fetchUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.isProfileFetched = true;
            state.error = action.payload || 'Ошибка загрузки профиля';
         })
         .addCase(updateUserProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(updateUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = processUserData(action.payload);
            state.error = null;
         })
         .addCase(updateUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка обновления профиля';
         });
   },
});

// Селекторы
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
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
export const selectIsCheckingAuth = (state) => state.auth.isCheckingAuth;
export const selectLastTokenRefresh = (state) => state.auth.lastTokenRefresh;
export const selectRefreshAttempts = (state) => state.auth.refreshAttempts;
export const selectShouldRefreshToken = (state) => {
   if (!state.auth.lastTokenRefresh) return false;
   const now = Date.now();
   const timeSinceLastRefresh = now - state.auth.lastTokenRefresh;
   const refreshInterval = 14 * 60 * 1000;
   return timeSinceLastRefresh > refreshInterval;
};

export const {
   clearError,
   resetAuth,
   updateProfile,
   clearUser,
   setUserRole,
   updateTokenRefreshTime,
   incrementRefreshAttempts,
   logoutWithoutApi
} = authSlice.actions;

export default authSlice.reducer;