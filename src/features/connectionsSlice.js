import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../api/api';

// ===== ASYNC THUNKS =====

// Получить моих подопечных (для тренера)
export const fetchMyTrainees = createAsyncThunk(
   'connections/fetchMyTrainees',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/trainees');
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить моих тренеров (для подопечного)
export const fetchMyTrainers = createAsyncThunk(
   'connections/fetchMyTrainers',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/trainers');
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// УНИВЕРСАЛЬНЫЙ: Отправить запрос на подключение (любое направление)
export const sendConnectionRequest = createAsyncThunk(
   'connections/sendRequest',
   async ({ receiver_id, message = '' }, { rejectWithValue }) => {
      try {
         const response = await api.post('/api/connections/request', {
            receiver_id,
            message
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// УНИВЕРСАЛЬНЫЙ: Ответить на запрос
export const respondToRequest = createAsyncThunk(
   'connections/respondToRequest',
   async ({ requestId, action }, { rejectWithValue }) => {
      try {
         const response = await api.post(`/api/connections/request/${requestId}/respond`, {
            action
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить входящие запросы
export const fetchIncomingRequests = createAsyncThunk(
   'connections/fetchIncomingRequests',
   async ({ status = 'pending' } = {}, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/requests/incoming', {
            params: { status }
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить исходящие запросы
export const fetchOutgoingRequests = createAsyncThunk(
   'connections/fetchOutgoingRequests',
   async ({ status = 'pending' } = {}, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/requests/outgoing', {
            params: { status }
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить все запросы пользователя
export const fetchAllRequests = createAsyncThunk(
   'connections/fetchAllRequests',
   async ({ status = 'pending' } = {}, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/requests/all', {
            params: { status }
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Отменить исходящий запрос
export const cancelRequest = createAsyncThunk(
   'connections/cancelRequest',
   async (requestId, { rejectWithValue }) => {
      try {
         const response = await api.delete(`/api/connections/request/${requestId}/cancel`);
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Удалить связь
export const removeConnection = createAsyncThunk(
   'connections/removeConnection',
   async (targetUserId, { rejectWithValue }) => {
      try {
         const response = await api.delete(`/api/connections/${targetUserId}`);
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить статус связи с пользователем
export const fetchConnectionStatus = createAsyncThunk(
   'connections/fetchConnectionStatus',
   async (targetUserId, { rejectWithValue }) => {
      try {
         const response = await api.get(`/api/connections/status/${targetUserId}`);
         return { targetUserId, status: response.data };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить количество непрочитанных запросов
export const fetchPendingRequestsCount = createAsyncThunk(
   'connections/fetchPendingRequestsCount',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/requests/count');
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Поиск тренеров
export const searchTrainers = createAsyncThunk(
   'connections/searchTrainers',
   async ({ query = '', specialization = '', limit = 10, offset = 0 }, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/search/trainers', {
            params: { query, specialization, limit, offset, _t: Date.now() }
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Поиск подопечных
export const searchTrainees = createAsyncThunk(
   'connections/searchTrainees',
   async ({ query = '', limit = 10, offset = 0 }, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/search/trainees', {
            params: { query, limit, offset, _t: Date.now() }
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить рекомендации тренеров
export const fetchTrainerRecommendations = createAsyncThunk(
   'connections/fetchTrainerRecommendations',
   async ({ limit = 5 } = {}, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/recommendations/trainers', {
            params: { limit, _t: Date.now() }
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// Получить статистику связей
export const fetchConnectionStats = createAsyncThunk(
   'connections/fetchConnectionStats',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/connections/stats');
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// ===== SLICE =====

const initialState = {
   // Данные
   trainees: [],
   trainers: [],
   incomingRequests: [],
   outgoingRequests: [],
   allRequests: { incoming: [], outgoing: [], total: 0 },
   searchResults: {
      trainers: { rows: [], count: 0 },
      trainees: { rows: [], count: 0 }
   },
   trainerRecommendations: [],
   stats: null,
   connectionStatuses: {},

   // Отслеживание отправки
   sendingRequestIds: [],

   // Состояния загрузки
   isLoading: {
      trainees: false,
      trainers: false,
      incomingRequests: false,
      outgoingRequests: false,
      allRequests: false,
      searchTrainers: false,
      searchTrainees: false,
      recommendations: false,
      stats: false,
      sendingRequest: false,
      responding: false,
      canceling: false,
      removing: false,
      connectionStatus: false
   },

   // Ошибки
   errors: {
      trainees: null,
      trainers: null,
      incomingRequests: null,
      outgoingRequests: null,
      allRequests: null,
      searchTrainers: null,
      searchTrainees: null,
      recommendations: null,
      stats: null,
      sendingRequest: null,
      responding: null,
      canceling: null,
      removing: null,
      connectionStatus: null
   }
};

const connectionsSlice = createSlice({
   name: 'connections',
   initialState,
   reducers: {
      clearError: (state, action) => {
         const { field } = action.payload;
         if (field && state.errors[field]) {
            state.errors[field] = null;
         } else {
            Object.keys(state.errors).forEach(key => {
               state.errors[key] = null;
            });
         }
      },
      clearSearchResults: (state) => {
         state.searchResults.trainers = { rows: [], count: 0 };
         state.searchResults.trainees = { rows: [], count: 0 };
      },
      clearRecommendations: (state) => {
         state.trainerRecommendations = [];
      },
      clearSendingRequestIds: (state) => {
         state.sendingRequestIds = [];
      },
      clearConnectionStatus: (state, action) => {
         const { targetUserId } = action.payload;
         if (targetUserId) {
            delete state.connectionStatuses[targetUserId];
         } else {
            state.connectionStatuses = {};
         }
      },
      clearAllConnectionsData: (state) => {
         // Данные
         state.trainees = [];
         state.trainers = [];
         state.incomingRequests = [];
         state.outgoingRequests = [];
         state.allRequests = { incoming: [], outgoing: [], total: 0 };
         state.searchResults = {
            trainers: { rows: [], count: 0 },
            trainees: { rows: [], count: 0 }
         };
         state.trainerRecommendations = [];
         state.stats = null;
         state.connectionStatuses = {};

         // Отслеживание отправки
         state.sendingRequestIds = [];

         // Ошибки (можно оставить или сбросить)
         state.errors = {
            trainees: null,
            trainers: null,
            incomingRequests: null,
            outgoingRequests: null,
            allRequests: null,
            searchTrainers: null,
            searchTrainees: null,
            recommendations: null,
            stats: null,
            sendingRequest: null,
            responding: null,
            canceling: null,
            removing: null,
            connectionStatus: null
         };
      }

   },
   extraReducers: (builder) => {
      // Подопечные
      builder.addCase(fetchMyTrainees.pending, (state) => {
         state.isLoading.trainees = true;
         state.errors.trainees = null;
      });
      builder.addCase(fetchMyTrainees.fulfilled, (state, action) => {
         state.isLoading.trainees = false;
         state.trainees = action.payload.data || action.payload;
      });
      builder.addCase(fetchMyTrainees.rejected, (state, action) => {
         state.isLoading.trainees = false;
         state.errors.trainees = action.payload || 'Ошибка загрузки подопечных';
      });

      // Тренеры
      builder.addCase(fetchMyTrainers.pending, (state) => {
         state.isLoading.trainers = true;
         state.errors.trainers = null;
      });
      builder.addCase(fetchMyTrainers.fulfilled, (state, action) => {
         state.isLoading.trainers = false;
         state.trainers = action.payload.data || action.payload;
      });
      builder.addCase(fetchMyTrainers.rejected, (state, action) => {
         state.isLoading.trainers = false;
         state.errors.trainers = action.payload || 'Ошибка загрузки тренеров';
      });

      // Универсальная отправка запроса
      builder.addCase(sendConnectionRequest.pending, (state, action) => {
         state.isLoading.sendingRequest = true;
         state.errors.sendingRequest = null;

         const receiverId = action.meta.arg.receiver_id;
         if (!state.sendingRequestIds.includes(receiverId)) {
            state.sendingRequestIds.push(receiverId);
         }
      });
      builder.addCase(sendConnectionRequest.fulfilled, (state, action) => {
         state.isLoading.sendingRequest = false;

         const receiverId = action.meta.arg.receiver_id;
         state.sendingRequestIds = state.sendingRequestIds.filter(id => id !== receiverId);

         if (action.payload.data) {
            state.outgoingRequests = [...state.outgoingRequests, action.payload.data];
         }

         // Обновляем статус в результатах поиска
         if (state.searchResults.trainers.rows) {
            state.searchResults.trainers.rows = state.searchResults.trainers.rows.map(trainer => {
               if (trainer.id === receiverId) {
                  return { ...trainer, connectionStatus: 'pending' };
               }
               return trainer;
            });
         }
         if (state.searchResults.trainees.rows) {
            state.searchResults.trainees.rows = state.searchResults.trainees.rows.map(trainee => {
               if (trainee.id === receiverId) {
                  return { ...trainee, connectionStatus: 'pending' };
               }
               return trainee;
            });
         }
      });
      builder.addCase(sendConnectionRequest.rejected, (state, action) => {
         state.isLoading.sendingRequest = false;
         state.errors.sendingRequest = action.payload || 'Ошибка отправки запроса';

         const receiverId = action.meta.arg.receiver_id;
         state.sendingRequestIds = state.sendingRequestIds.filter(id => id !== receiverId);
      });

      // Ответ на запрос
      builder.addCase(respondToRequest.pending, (state) => {
         state.isLoading.responding = true;
         state.errors.responding = null;
      });
      // builder.addCase(respondToRequest.fulfilled, (state, action) => {
      //    state.isLoading.responding = false;

      //    const requestId = action.meta.arg.requestId;
      //    state.incomingRequests = state.incomingRequests.filter(req => req.id !== requestId);

      //    if (action.payload.connectionCreated) {
      //       state.trainees = [...state.trainees, action.payload.connection?.trainee];
      //       state.trainers = [...state.trainers, action.payload.connection?.trainer];
      //    }
      // });
      builder.addCase(respondToRequest.fulfilled, (state, action) => {
         state.isLoading.responding = false;

         const requestId = action.meta.arg.requestId;
         const { action: responseAction } = action.meta.arg;

         // Находим запрос, чтобы узнать ID пользователя
         const request = state.incomingRequests.find(req => req.id === requestId);

         state.incomingRequests = state.incomingRequests.filter(req => req.id !== requestId);

         if (action.payload.connectionCreated) {
            // Запрос принят - добавляем в списки
            state.trainees = [...state.trainees, action.payload.connection?.trainee];
            state.trainers = [...state.trainers, action.payload.connection?.trainer];

            // 🟢 Если запрос принят, статус становится 'accepted'
            if (request) {
               const userId = request.sender_id;
               state.connectionStatuses[userId] = 'accepted';
            }
         } else if (responseAction === 'reject') {
            // 🟢 Запрос отклонен - очищаем статус
            if (request) {
               const userId = request.sender_id;
               delete state.connectionStatuses[userId];

               // 🟢 Очищаем статус в результатах поиска
               if (state.searchResults.trainers.rows) {
                  state.searchResults.trainers.rows = state.searchResults.trainers.rows.map(trainer => {
                     if (trainer.id === userId) {
                        const { connectionStatus, ...trainerWithoutStatus } = trainer;
                        return trainerWithoutStatus;
                     }
                     return trainer;
                  });
               }

               if (state.searchResults.trainees.rows) {
                  state.searchResults.trainees.rows = state.searchResults.trainees.rows.map(trainee => {
                     if (trainee.id === userId) {
                        const { connectionStatus, ...traineeWithoutStatus } = trainee;
                        return traineeWithoutStatus;
                     }
                     return trainee;
                  });
               }
            }
         }
      });
      builder.addCase(respondToRequest.rejected, (state, action) => {
         state.isLoading.responding = false;
         state.errors.responding = action.payload || 'Ошибка обработки запроса';
      });

      // Входящие запросы
      builder.addCase(fetchIncomingRequests.pending, (state) => {
         state.isLoading.incomingRequests = true;
         state.errors.incomingRequests = null;
      });
      builder.addCase(fetchIncomingRequests.fulfilled, (state, action) => {
         state.isLoading.incomingRequests = false;
         state.incomingRequests = action.payload.data || action.payload;
      });
      builder.addCase(fetchIncomingRequests.rejected, (state, action) => {
         state.isLoading.incomingRequests = false;
         state.errors.incomingRequests = action.payload || 'Ошибка загрузки запросов';
      });

      // Исходящие запросы
      builder.addCase(fetchOutgoingRequests.pending, (state) => {
         state.isLoading.outgoingRequests = true;
         state.errors.outgoingRequests = null;
      });
      builder.addCase(fetchOutgoingRequests.fulfilled, (state, action) => {
         state.isLoading.outgoingRequests = false;
         state.outgoingRequests = action.payload.data || action.payload;
      });
      builder.addCase(fetchOutgoingRequests.rejected, (state, action) => {
         state.isLoading.outgoingRequests = false;
         state.errors.outgoingRequests = action.payload || 'Ошибка загрузки запросов';
      });

      // Все запросы
      builder.addCase(fetchAllRequests.pending, (state) => {
         state.isLoading.allRequests = true;
         state.errors.allRequests = null;
      });
      builder.addCase(fetchAllRequests.fulfilled, (state, action) => {
         state.isLoading.allRequests = false;
         state.allRequests = action.payload.data || action.payload;
      });
      builder.addCase(fetchAllRequests.rejected, (state, action) => {
         state.isLoading.allRequests = false;
         state.errors.allRequests = action.payload || 'Ошибка загрузки запросов';
      });

      // Отмена запроса
      builder.addCase(cancelRequest.pending, (state) => {
         state.isLoading.canceling = true;
         state.errors.canceling = null;
      });
      // builder.addCase(cancelRequest.fulfilled, (state, action) => {
      //    state.isLoading.canceling = false;
      //    state.outgoingRequests = state.outgoingRequests.filter(
      //       req => req.id !== action.meta.arg
      //    );
      // });
      builder.addCase(cancelRequest.fulfilled, (state, action) => {
         state.isLoading.canceling = false;

         // Находим запрос перед удалением
         const requestId = action.meta.arg;
         const request = state.outgoingRequests.find(req => req.id === requestId);

         state.outgoingRequests = state.outgoingRequests.filter(
            req => req.id !== requestId
         );

         // 🟢 Очищаем статус при отмене запроса
         if (request) {
            const receiverId = request.receiver_id;
            delete state.connectionStatuses[receiverId];

            // Очищаем в результатах поиска
            if (state.searchResults.trainers.rows) {
               state.searchResults.trainers.rows = state.searchResults.trainers.rows.map(trainer => {
                  if (trainer.id === receiverId) {
                     const { connectionStatus, ...trainerWithoutStatus } = trainer;
                     return trainerWithoutStatus;
                  }
                  return trainer;
               });
            }

            if (state.searchResults.trainees.rows) {
               state.searchResults.trainees.rows = state.searchResults.trainees.rows.map(trainee => {
                  if (trainee.id === receiverId) {
                     const { connectionStatus, ...traineeWithoutStatus } = trainee;
                     return traineeWithoutStatus;
                  }
                  return trainee;
               });
            }
         }
      });
      builder.addCase(cancelRequest.rejected, (state, action) => {
         state.isLoading.canceling = false;
         state.errors.canceling = action.payload || 'Ошибка отмены запроса';
      });

      // Удаление связи
      builder.addCase(removeConnection.pending, (state) => {
         state.isLoading.removing = true;
         state.errors.removing = null;
      });
      // builder.addCase(removeConnection.fulfilled, (state, action) => {
      //    state.isLoading.removing = false;
      //    const targetUserId = action.meta.arg;
      //    state.trainees = state.trainees.filter(t => t?.id !== targetUserId);
      //    state.trainers = state.trainers.filter(t => t?.id !== targetUserId);
      // });

      builder.addCase(removeConnection.fulfilled, (state, action) => {
         state.isLoading.removing = false;
         const targetUserId = action.meta.arg;

         // Удаляем из списков
         state.trainees = state.trainees.filter(t => t?.id !== targetUserId);
         state.trainers = state.trainers.filter(t => t?.id !== targetUserId);

         // 🟢 ОЧИЩАЕМ СТАТУС СВЯЗИ
         delete state.connectionStatuses[targetUserId];

         // 🟢 ОЧИЩАЕМ СТАТУС В РЕЗУЛЬТАТАХ ПОИСКА
         if (state.searchResults.trainers.rows) {
            state.searchResults.trainers.rows = state.searchResults.trainers.rows.map(trainer => {
               if (trainer.id === targetUserId) {
                  const { connectionStatus, ...trainerWithoutStatus } = trainer;
                  return trainerWithoutStatus;
               }
               return trainer;
            });
         }

         if (state.searchResults.trainees.rows) {
            state.searchResults.trainees.rows = state.searchResults.trainees.rows.map(trainee => {
               if (trainee.id === targetUserId) {
                  const { connectionStatus, ...traineeWithoutStatus } = trainee;
                  return traineeWithoutStatus;
               }
               return trainee;
            });
         }
      });
      builder.addCase(removeConnection.rejected, (state, action) => {
         state.isLoading.removing = false;
         state.errors.removing = action.payload || 'Ошибка удаления связи';
      });

      // Статус связи
      builder.addCase(fetchConnectionStatus.pending, (state) => {
         state.isLoading.connectionStatus = true;
         state.errors.connectionStatus = null;
      });
      builder.addCase(fetchConnectionStatus.fulfilled, (state, action) => {
         state.isLoading.connectionStatus = false;
         const { targetUserId, status } = action.payload;
         state.connectionStatuses[targetUserId] = status;
      });
      builder.addCase(fetchConnectionStatus.rejected, (state, action) => {
         state.isLoading.connectionStatus = false;
         state.errors.connectionStatus = action.payload || 'Ошибка получения статуса';
      });

      // Количество запросов
      builder.addCase(fetchPendingRequestsCount.pending, (state) => {
         state.isLoading.stats = true;
      });
      builder.addCase(fetchPendingRequestsCount.fulfilled, (state, action) => {
         state.isLoading.stats = false;
         if (!state.stats) state.stats = {};
         state.stats.incoming_count = action.payload.data?.incoming_count || 0;
      });
      builder.addCase(fetchPendingRequestsCount.rejected, (state) => {
         state.isLoading.stats = false;
      });

      // Поиск тренеров
      builder.addCase(searchTrainers.pending, (state) => {
         state.isLoading.searchTrainers = true;
         state.errors.searchTrainers = null;
      });
      builder.addCase(searchTrainers.fulfilled, (state, action) => {
         state.isLoading.searchTrainers = false;

         console.log('🔍 ПОИСК ОТВЕТ ОТ БЭКЕНДА:', {
            полный_ответ: action.payload,
            статусы_в_ответе: action.payload?.rows?.map(t => ({
               id: t.id,
               userName: t.userName,
               connectionStatus: t.connectionStatus
            }))
         });

         state.searchResults.trainers = action.payload;
      });
      builder.addCase(searchTrainers.rejected, (state, action) => {
         state.isLoading.searchTrainers = false;
         state.errors.searchTrainers = action.payload || 'Ошибка поиска тренеров';
      });

      // Поиск подопечных
      builder.addCase(searchTrainees.pending, (state) => {
         state.isLoading.searchTrainees = true;
         state.errors.searchTrainees = null;
      });
      builder.addCase(searchTrainees.fulfilled, (state, action) => {
         state.isLoading.searchTrainees = false;
         state.searchResults.trainees = action.payload;
      });
      builder.addCase(searchTrainees.rejected, (state, action) => {
         state.isLoading.searchTrainees = false;
         state.errors.searchTrainees = action.payload || 'Ошибка поиска подопечных';
      });

      // Рекомендации
      builder.addCase(fetchTrainerRecommendations.pending, (state) => {
         state.isLoading.recommendations = true;
         state.errors.recommendations = null;
      });
      builder.addCase(fetchTrainerRecommendations.fulfilled, (state, action) => {
         state.isLoading.recommendations = false;
         state.trainerRecommendations = action.payload.data || action.payload;
      });
      builder.addCase(fetchTrainerRecommendations.rejected, (state, action) => {
         state.isLoading.recommendations = false;
         state.errors.recommendations = action.payload || 'Ошибка загрузки рекомендаций';
      });

      // Статистика
      builder.addCase(fetchConnectionStats.pending, (state) => {
         state.isLoading.stats = true;
         state.errors.stats = null;
      });
      builder.addCase(fetchConnectionStats.fulfilled, (state, action) => {
         state.isLoading.stats = false;
         state.stats = action.payload.data || action.payload;
      });
      builder.addCase(fetchConnectionStats.rejected, (state, action) => {
         state.isLoading.stats = false;
         state.errors.stats = action.payload || 'Ошибка загрузки статистики';
      });
   }
});

// ===== СЕЛЕКТОРЫ =====
const selectConnectionsState = (state) => state.connections;

// Подопечные
export const selectTrainees = createSelector(
   [selectConnectionsState],
   (connections) => connections.trainees
);

export const selectTraineesLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.trainees
);

export const selectTraineesError = createSelector(
   [selectConnectionsState],
   (connections) => connections.errors.trainees
);

// Тренеры
export const selectTrainers = createSelector(
   [selectConnectionsState],
   (connections) => connections.trainers
);

export const selectTrainersLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.trainers
);

export const selectTrainersError = createSelector(
   [selectConnectionsState],
   (connections) => connections.errors.trainers
);

// Запросы
export const selectIncomingRequests = createSelector(
   [selectConnectionsState],
   (connections) => connections.incomingRequests
);

export const selectOutgoingRequests = createSelector(
   [selectConnectionsState],
   (connections) => connections.outgoingRequests
);

export const selectAllRequests = createSelector(
   [selectConnectionsState],
   (connections) => connections.allRequests
);

export const selectIncomingRequestsLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.incomingRequests
);

export const selectOutgoingRequestsLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.outgoingRequests
);

export const selectIncomingRequestsError = createSelector(
   [selectConnectionsState],
   (connections) => connections.errors.incomingRequests
);

export const selectOutgoingRequestsError = createSelector(
   [selectConnectionsState],
   (connections) => connections.errors.outgoingRequests
);

// Поиск
export const selectSearchResults = createSelector(
   [selectConnectionsState],
   (connections) => connections.searchResults
);

export const selectSearchTrainersLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.searchTrainers
);

export const selectSearchTraineesLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.searchTrainees
);

// Рекомендации
export const selectTrainerRecommendations = createSelector(
   [selectConnectionsState],
   (connections) => connections.trainerRecommendations
);

export const selectRecommendationsLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.recommendations
);

// Статистика
export const selectConnectionStats = createSelector(
   [selectConnectionsState],
   (connections) => connections.stats
);

export const selectStatsLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.stats
);

// Статусы связей
export const selectConnectionStatus = createSelector(
   [selectConnectionsState, (_, userId) => userId],
   (connections, userId) => connections.connectionStatuses[userId]
);

// Состояния отправки
export const selectIsSendingRequestToUser = createSelector(
   [selectConnectionsState, (_, userId) => userId],
   (connections, userId) => connections.sendingRequestIds.includes(userId)
);

export const selectSendingRequestLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.sendingRequest
);

export const selectSendingRequestError = createSelector(
   [selectConnectionsState],
   (connections) => connections.errors.sendingRequest
);

// Общие состояния
export const selectIsLoading = createSelector(
   [selectConnectionsState],
   (connections) => Object.values(connections.isLoading).some(loading => loading)
);

export const selectActiveRequestsCount = createSelector(
   [selectIncomingRequests, selectOutgoingRequests],
   (incoming, outgoing) => incoming.length + outgoing.length
);

// ===== СЕЛЕКТОРЫ ДЛЯ ALL REQUESTS =====
export const selectAllRequestsLoading = createSelector(
   [selectConnectionsState],
   (connections) => connections.isLoading.allRequests
);

export const selectAllRequestsError = createSelector(
   [selectConnectionsState],
   (connections) => connections.errors.allRequests
);

// ===== ACTIONS =====
export const {
   clearError,
   clearSearchResults,
   clearRecommendations,
   clearSendingRequestIds,
   clearConnectionStatus,
   clearAllConnectionsData
} = connectionsSlice.actions;

export default connectionsSlice.reducer;