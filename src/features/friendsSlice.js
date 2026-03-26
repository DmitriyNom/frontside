// frontend/src/features/friendsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { friendsAPI } from '../api/api';

// ============ ASYNC THUNKS ============

// Отправить запрос в друзья
export const sendFriendRequest = createAsyncThunk(
   'friends/sendRequest',
   async ({ receiverId, message }, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.sendRequest(receiverId, message);
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка отправки запроса');
      }
   }
);

// Ответить на запрос
export const respondToFriendRequest = createAsyncThunk(
   'friends/respondToRequest',
   async ({ requestId, action }, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.respondToRequest(requestId, action);
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка ответа на запрос');
      }
   }
);

// Отменить запрос
export const cancelFriendRequest = createAsyncThunk(
   'friends/cancelRequest',
   async (requestId, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.cancelRequest(requestId);
         return { requestId, ...response.data };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка отмены запроса');
      }
   }
);

// Получить запросы
export const fetchFriendRequests = createAsyncThunk(
   'friends/fetchRequests',
   async ({ direction = 'all', status = 'pending' } = {}, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getRequests(direction, status);
         // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: правильно извлекаем данные
         // Бэкенд возвращает { success: true, data: [...] }
         const requests = response.data?.data || [];
         return { direction, data: requests };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки запросов');
      }
   }
);

// Получить количество запросов
export const fetchFriendRequestsCount = createAsyncThunk(
   'friends/fetchRequestsCount',
   async (_, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getRequestsCount();
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки количества запросов');
      }
   }
);

// Получить список друзей
export const fetchFriends = createAsyncThunk(
   'friends/fetchFriends',
   async (params = {}, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getFriends(params);
         // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: правильно извлекаем данные
         // Бэкенд может возвращать { data: [...], count: ... } или просто [...]
         const friends = response.data?.data || response.data || [];
         const count = response.data?.count || friends.length;
         return { data: friends, count };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки друзей');
      }
   }
);

// Удалить из друзей
export const removeFriend = createAsyncThunk(
   'friends/removeFriend',
   async (friendId, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.removeFriend(friendId);
         return { friendId, ...response.data };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка удаления из друзей');
      }
   }
);

// Проверить статус с пользователем
export const fetchFriendStatus = createAsyncThunk(
   'friends/fetchStatus',
   async (targetUserId, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getFriendStatus(targetUserId);
         // 🔧 ИСПРАВЛЕНИЕ: правильно извлекаем статус
         const statusData = response.data?.data || response.data;
         return { targetUserId, status: statusData };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка получения статуса');
      }
   }
);

// Получить статистику
export const fetchFriendStats = createAsyncThunk(
   'friends/fetchStats',
   async (_, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getFriendStats();
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки статистики');
      }
   }
);

// Поиск по друзьям
export const searchFriends = createAsyncThunk(
   'friends/search',
   async ({ query, ...params }, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.searchFriends(query, params);
         const results = response.data?.data || response.data || [];
         return { query, data: results };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка поиска');
      }
   }
);

// Получить общих друзей
export const fetchMutualFriends = createAsyncThunk(
   'friends/fetchMutual',
   async (targetUserId, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getMutualFriends(targetUserId);
         const friends = response.data?.data || response.data || [];
         return { targetUserId, friends };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки общих друзей');
      }
   }
);

// Получить рекомендации
export const fetchFriendRecommendations = createAsyncThunk(
   'friends/fetchRecommendations',
   async (limit = 10, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getRecommendations(limit);
         const recommendations = response.data?.data || response.data || [];
         return recommendations;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки рекомендаций');
      }
   }
);

// Заблокировать пользователя
export const blockUser = createAsyncThunk(
   'friends/blockUser',
   async (userId, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.blockUser(userId);
         return { userId, ...response.data };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка блокировки');
      }
   }
);

// Разблокировать пользователя
export const unblockUser = createAsyncThunk(
   'friends/unblockUser',
   async (userId, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.unblockUser(userId);
         return { userId, ...response.data };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка разблокировки');
      }
   }
);

// Получить заблокированных
export const fetchBlockedUsers = createAsyncThunk(
   'friends/fetchBlocked',
   async (_, { rejectWithValue }) => {
      try {
         const response = await friendsAPI.getBlockedUsers();
         const blocked = response.data?.data || response.data || [];
         return blocked;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заблокированных');
      }
   }
);

// ============ SLICE ============

const initialState = {
   // Списки
   friends: [],
   incomingRequests: [],
   outgoingRequests: [],
   blockedUsers: [],
   mutualFriends: {},
   recommendations: [],

   // Статусы отношений (кэш)
   friendStatuses: {},

   // Статистика
   stats: null,
   requestsCount: {
      incoming: 0,
      outgoing: 0,
      total: 0
   },

   // Состояния загрузки
   loading: {
      friends: false,
      requests: false,
      stats: false,
      search: false,
      action: false
   },

   // Ошибки
   errors: {
      fetchFriends: null,
      fetchRequests: null,
      fetchStats: null,
      search: null,
      sendRequest: null,
      respondRequest: null,
      cancelRequest: null
   },

   // Пагинация
   pagination: {
      friends: { limit: 50, offset: 0, hasMore: true, total: 0 },
      recommendations: { limit: 10, offset: 0, hasMore: true }
   }
};

const friendsSlice = createSlice({
   name: 'friends',
   initialState,
   reducers: {
      clearFriendStatus: (state, action) => {
         const userId = action.payload;
         delete state.friendStatuses[userId];
      },
      clearAllFriendStatuses: (state) => {
         state.friendStatuses = {};
      },
      resetFriendsState: () => initialState,
      setFriendsPagination: (state, action) => {
         state.pagination.friends = {
            ...state.pagination.friends,
            ...action.payload
         };
      },
      clearErrors: (state) => {
         state.errors = {
            fetchFriends: null,
            fetchRequests: null,
            fetchStats: null,
            search: null,
            sendRequest: null,
            respondRequest: null,
            cancelRequest: null
         };
      }
   },
   extraReducers: (builder) => {
      builder
         // ===== ОТПРАВКА ЗАПРОСА =====
         .addCase(sendFriendRequest.pending, (state) => {
            state.loading.action = true;
            state.errors.sendRequest = null;
         })
         .addCase(sendFriendRequest.fulfilled, (state, action) => {
            state.loading.action = false;
            const requestData = action.payload?.data || action.payload;
            if (requestData && requestData.id) {
               state.outgoingRequests = [requestData, ...(state.outgoingRequests || [])];
            }
         })
         .addCase(sendFriendRequest.rejected, (state, action) => {
            state.loading.action = false;
            state.errors.sendRequest = action.payload;
         })

         // ===== ОТВЕТ НА ЗАПРОС =====
         .addCase(respondToFriendRequest.pending, (state) => {
            state.loading.action = true;
         })
         .addCase(respondToFriendRequest.fulfilled, (state, action) => {
            state.loading.action = false;
            const { requestId } = action.meta.arg;
            // 🔧 ИСПРАВЛЕНИЕ: проверяем что incomingRequests существует
            if (state.incomingRequests) {
               state.incomingRequests = state.incomingRequests.filter(
                  req => req.id !== requestId
               );
            }
         })
         .addCase(respondToFriendRequest.rejected, (state, action) => {
            state.loading.action = false;
            state.errors.respondRequest = action.payload;
         })

         // ===== ОТМЕНА ЗАПРОСА =====
         .addCase(cancelFriendRequest.pending, (state) => {
            state.loading.action = true;
         })
         .addCase(cancelFriendRequest.fulfilled, (state, action) => {
            state.loading.action = false;
            const { requestId } = action.payload;
            // 🔧 ИСПРАВЛЕНИЕ: проверяем что outgoingRequests существует
            if (state.outgoingRequests) {
               state.outgoingRequests = state.outgoingRequests.filter(
                  req => req.id !== requestId
               );
            }
         })
         .addCase(cancelFriendRequest.rejected, (state, action) => {
            state.loading.action = false;
            state.errors.cancelRequest = action.payload;
         })

         // ===== ЗАГРУЗКА ЗАПРОСОВ =====
         .addCase(fetchFriendRequests.pending, (state) => {
            state.loading.requests = true;
            state.errors.fetchRequests = null;
         })
         .addCase(fetchFriendRequests.fulfilled, (state, action) => {
            state.loading.requests = false;
            const { direction, data } = action.payload;
            // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: убеждаемся что data - массив
            const requests = Array.isArray(data) ? data : [];

            if (direction === 'incoming') {
               state.incomingRequests = requests;
            } else if (direction === 'outgoing') {
               state.outgoingRequests = requests;
            } else if (direction === 'all') {
               // Разделяем на входящие и исходящие
               // 🔧 ИСПРАВЛЕНИЕ: проверяем наличие поля direction
               state.incomingRequests = requests.filter(req => req.direction === 'incoming');
               state.outgoingRequests = requests.filter(req => req.direction === 'outgoing');
            }
         })
         .addCase(fetchFriendRequests.rejected, (state, action) => {
            state.loading.requests = false;
            state.errors.fetchRequests = action.payload;
            // 🔧 ИСПРАВЛЕНИЕ: при ошибке устанавливаем пустые массивы
            state.incomingRequests = [];
            state.outgoingRequests = [];
         })

         // ===== КОЛИЧЕСТВО ЗАПРОСОВ =====
         .addCase(fetchFriendRequestsCount.fulfilled, (state, action) => {
            const countData = action.payload?.data || action.payload;
            state.requestsCount = {
               incoming: countData?.incoming || 0,
               outgoing: countData?.outgoing || 0,
               total: countData?.total || 0
            };
         })

         // ===== ЗАГРУЗКА ДРУЗЕЙ =====
         .addCase(fetchFriends.pending, (state) => {
            state.loading.friends = true;
            state.errors.fetchFriends = null;
         })
         .addCase(fetchFriends.fulfilled, (state, action) => {
            state.loading.friends = false;
            const { data, count } = action.payload;
            // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: убеждаемся что data - массив
            state.friends = Array.isArray(data) ? data : [];

            // Обновляем пагинацию
            const { limit = 50, offset = 0 } = action.meta.arg || {};
            const total = count || state.friends.length;
            state.pagination.friends = {
               ...state.pagination.friends,
               limit,
               offset,
               hasMore: (offset + limit) < total,
               total
            };
         })
         .addCase(fetchFriends.rejected, (state, action) => {
            state.loading.friends = false;
            state.errors.fetchFriends = action.payload;
            // 🔧 ИСПРАВЛЕНИЕ: при ошибке устанавливаем пустой массив
            state.friends = [];
         })

         // ===== УДАЛЕНИЕ ИЗ ДРУЗЕЙ =====
         .addCase(removeFriend.fulfilled, (state, action) => {
            const { friendId } = action.payload;
            if (state.friends) {
               state.friends = state.friends.filter(f => f.id !== friendId);
            }
            if (state.friendStatuses) {
               delete state.friendStatuses[friendId];
            }
         })

         // ===== СТАТУС ДРУЖБЫ =====
         .addCase(fetchFriendStatus.fulfilled, (state, action) => {
            const { targetUserId, status } = action.payload;
            if (status) {
               state.friendStatuses[targetUserId] = status;
            }
         })

         // ===== СТАТИСТИКА =====
         .addCase(fetchFriendStats.pending, (state) => {
            state.loading.stats = true;
         })
         .addCase(fetchFriendStats.fulfilled, (state, action) => {
            state.loading.stats = false;
            state.stats = action.payload?.data || action.payload;
         })
         .addCase(fetchFriendStats.rejected, (state, action) => {
            state.loading.stats = false;
            state.errors.fetchStats = action.payload;
         })

         // ===== ПОИСК =====
         .addCase(searchFriends.pending, (state) => {
            state.loading.search = true;
            state.errors.search = null;
         })
         .addCase(searchFriends.fulfilled, (state, action) => {
            state.loading.search = false;
            // Результаты поиска не сохраняем в store
         })
         .addCase(searchFriends.rejected, (state, action) => {
            state.loading.search = false;
            state.errors.search = action.payload;
         })

         // ===== ОБЩИЕ ДРУЗЬЯ =====
         .addCase(fetchMutualFriends.fulfilled, (state, action) => {
            const { targetUserId, friends } = action.payload;
            state.mutualFriends[targetUserId] = Array.isArray(friends) ? friends : [];
         })

         // ===== РЕКОМЕНДАЦИИ =====
         .addCase(fetchFriendRecommendations.fulfilled, (state, action) => {
            state.recommendations = Array.isArray(action.payload) ? action.payload : [];
         })

         // ===== БЛОКИРОВКИ =====
         .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
            state.blockedUsers = Array.isArray(action.payload) ? action.payload : [];
         })
         .addCase(blockUser.fulfilled, (state, action) => {
            const { userId } = action.payload;
            if (state.friendStatuses && state.friendStatuses[userId]) {
               state.friendStatuses[userId] = { ...state.friendStatuses[userId], status: 'blocked' };
            }
            // Удаляем из друзей если был
            if (state.friends) {
               state.friends = state.friends.filter(f => f.id !== userId);
            }
            // Удаляем из запросов
            if (state.incomingRequests) {
               state.incomingRequests = state.incomingRequests.filter(req => req.user?.id !== userId);
            }
            if (state.outgoingRequests) {
               state.outgoingRequests = state.outgoingRequests.filter(req => req.user?.id !== userId);
            }
         })
         .addCase(unblockUser.fulfilled, (state, action) => {
            const { userId } = action.payload;
            if (state.friendStatuses && state.friendStatuses[userId]) {
               delete state.friendStatuses[userId];
            }
            if (state.blockedUsers) {
               state.blockedUsers = state.blockedUsers.filter(u => u.id !== userId);
            }
         });
   }
});

// ============ СЕЛЕКТОРЫ ============
// 🔧 ИСПРАВЛЕНИЕ: все селекторы возвращают значения по умолчанию

export const selectFriends = (state) => state.friends?.friends || [];
export const selectIncomingRequests = (state) => state.friends?.incomingRequests || [];
export const selectOutgoingRequests = (state) => state.friends?.outgoingRequests || [];
export const selectBlockedUsers = (state) => state.friends?.blockedUsers || [];
export const selectMutualFriends = (state) => state.friends?.mutualFriends || {};
export const selectRecommendations = (state) => state.friends?.recommendations || [];
export const selectFriendStatuses = (state) => state.friends?.friendStatuses || {};
export const selectStats = (state) => state.friends?.stats || null;
export const selectRequestsCount = (state) => state.friends?.requestsCount || { incoming: 0, outgoing: 0, total: 0 };
export const selectFriendsLoading = (state) => state.friends?.loading || { friends: false, requests: false, stats: false, search: false, action: false };
export const selectFriendsErrors = (state) => state.friends?.errors || {};
export const selectFriendsPagination = (state) => state.friends?.pagination || { friends: { limit: 50, offset: 0, hasMore: true, total: 0 } };

export const {
   clearFriendStatus,
   clearAllFriendStatuses,
   resetFriendsState,
   setFriendsPagination,
   clearErrors
} = friendsSlice.actions;

export default friendsSlice.reducer;