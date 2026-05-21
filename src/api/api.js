import axios from 'axios';
import store from '../store/store';
import { updateTokenRefreshTime, logoutWithoutApi } from '../features/authSlice';

const api = axios.create({
   baseURL: 'http://localhost:5000',
   withCredentials: true,
   headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
   }
});

// ========== ПЕРЕМЕННЫЕ ДЛЯ ОБНОВЛЕНИЯ ТОКЕНА ==========
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
   failedQueue.forEach(prom => {
      if (error) prom.reject(error);
      else prom.resolve();
   });
   failedQueue = [];
};

const refreshToken = async () => {
   try {
      await axios.post('http://localhost:5000/api/user/refresh', {}, {
         withCredentials: true
      });
      store.dispatch(updateTokenRefreshTime());
      return true;
   } catch (error) {
      console.error('❌ Refresh token failed:', error);
      return false;
   }
};

/**
 * Универсальная функция для получения URL файла
 * @param {string} path - Путь из БД (может быть разным для разных модулей)
 * @param {string} type - Тип файла: 'media', 'note', 'exercise', 'avatar'
 * @returns {string} Полный URL
 */
export const getFileUrl = (path, type = 'media') => {
   if (!path || path === 'null' || path === 'undefined') return '';

   if (path.startsWith('http')) return path;

   const baseUrl = 'http://localhost:5000';

   // Новые пути (media/public/, media/private/)
   if (path.includes('media/public/')) {
      const relativePath = path.split('media/public/')[1];
      return `${baseUrl}/media/public/${relativePath}`;
   }

   if (path.includes('media/private/')) {
      const relativePath = path.split('media/private/')[1];
      return `${baseUrl}/media/private/${relativePath}`;
   }

   // Старые пути для обратной совместимости
   let cleanPath = path.replace(/^uploads\//, '');

   switch (type) {
      case 'media':
         if (cleanPath.includes('training-media/')) {
            cleanPath = cleanPath.replace('training-media/', '');
            return `${baseUrl}/uploads/training-media/${cleanPath}`;
         }
         if (cleanPath.includes('training-media-public/')) {
            cleanPath = cleanPath.replace('training-media-public/', '');
            return `${baseUrl}/public/uploads/training-media-public/${cleanPath}`;
         }
         return `${baseUrl}/uploads/${cleanPath}`;

      case 'note':
         return `${baseUrl}/uploads/${cleanPath}`;

      case 'avatar':
         return `${baseUrl}/uploads/avatars/${cleanPath}`;

      default:
         return `${baseUrl}/uploads/${cleanPath}`;
   }
};

export const getMediaUrl = (path) => getFileUrl(path, 'media');
export const getNoteFileUrl = (path) => getFileUrl(path, 'note');
export const getAvatarUrl = (path) => getFileUrl(path, 'avatar');

// ===== ИНТЕРЦЕПТОР С ОБНОВЛЕНИЕМ ТОКЕНА =====

api.interceptors.response.use(
   (response) => response,
   async (error) => {
      const originalRequest = error.config;

      // Определяем тип запроса
      const isRefreshEndpoint = originalRequest.url?.includes('/api/user/refresh') ||
         originalRequest.url?.includes('/auth/refresh');
      const isLoginEndpoint = originalRequest.url?.includes('/api/user/login');
      const isLogoutEndpoint = originalRequest.url?.includes('/api/user/logout');

      // Если refresh эндпоинт упал с 401 - токен обновления истек
      if (isRefreshEndpoint && error.response?.status === 401) {
         console.log('❌ api: refresh token expired');
         window.dispatchEvent(new CustomEvent('auth-expired', {
            detail: { message: 'Сессия истекла, войдите снова' }
         }));
         return Promise.reject(error);
      }

      // Login/logout не трогаем
      if (isLoginEndpoint || isLogoutEndpoint) {
         return Promise.reject(error);
      }

      // Только для 401 и не повторяющихся запросов
      if (error.response?.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true;

         if (isRefreshing) {
            // Ждем окончания обновления
            return new Promise((resolve, reject) => {
               failedQueue.push({ resolve, reject });
            }).then(() => {
               return api(originalRequest);
            });
         }

         isRefreshing = true;

         const success = await refreshToken();
         isRefreshing = false;

         if (success) {
            processQueue(null);
            return api(originalRequest);
         } else {
            processQueue(error);
            store.dispatch(logoutWithoutApi());
            window.dispatchEvent(new CustomEvent('auth-expired', {
               detail: { message: 'Сессия истекла, войдите снова' }
            }));
            return Promise.reject(error);
         }
      }

      return Promise.reject(error);
   }
);

// Интерцептор запросов
api.interceptors.request.use(
   (config) => config,
   (error) => Promise.reject(error)
);

// API методы (без изменений)
export const connectionsAPI = {
   sendRequest: (trainerId, message = '') =>
      api.post('/api/connections/request', { trainer_id: trainerId, message }),

   respondToRequest: (requestId, action) =>
      api.post(`/api/connections/request/${requestId}/respond`, { action }),

   removeConnection: (userId) =>
      api.delete(`/api/connections/${userId}`),

   getMyTrainees: () => api.get('/api/connections/trainees'),
   getMyTrainers: () => api.get('/api/connections/trainers'),

   getIncomingRequests: (status) =>
      api.get('/api/connections/requests/incoming', {
         params: status ? { status } : {}
      }),

   getOutgoingRequests: (status) =>
      api.get('/api/connections/requests/outgoing', {
         params: status ? { status } : {}
      }),

   cancelRequest: (requestId) =>
      api.delete(`/api/connections/request/${requestId}/cancel`),

   searchTrainers: ({ query, specialization, limit = 10, offset = 0 }) =>
      api.get('/api/connections/search/trainers', {
         params: {
            query: query || '',
            specialization: specialization || '',
            limit,
            offset
         }
      }),

   searchTrainees: ({ query, limit = 10, offset = 0 }) =>
      api.get('/api/connections/search/trainees', {
         params: {
            query: query || '',
            limit,
            offset
         }
      }),

   getTrainerRecommendations: (limit = 5) =>
      api.get('/api/connections/recommendations/trainers', {
         params: { limit }
      }),

   getConnectionStats: () => api.get('/api/connections/stats')
};

export const userAPI = {
   getUsersByIds: (userIds) =>
      api.post('/api/user/batch', { userIds }),

   searchUsers: (query, role = null) =>
      api.get('/api/user/search', {
         params: { query, role }
      }),

   getUserById: (userId) =>
      api.get(`/api/user/${userId}`)
};

export const friendsAPI = {
   sendRequest: (receiverId, message = '') =>
      api.post('/api/friends/request', { receiver_id: receiverId, message }),

   respondToRequest: (requestId, action) =>
      api.put(`/api/friends/request/${requestId}`, { action }),

   cancelRequest: (requestId) =>
      api.delete(`/api/friends/request/${requestId}`),

   getRequests: (direction = 'all', status = 'pending') =>
      api.get('/api/friends/requests', { params: { direction, status } }),

   getRequestsCount: () =>
      api.get('/api/friends/requests/count'),

   getFriends: (params = {}) =>
      api.get('/api/friends', { params }),

   removeFriend: (friendId) =>
      api.delete(`/api/friends/${friendId}`),

   getFriendStatus: (targetUserId) =>
      api.get(`/api/friends/status/${targetUserId}`),

   getUserFriends: (userId, params = {}) =>
      api.get(`/api/friends/user/${userId}`, { params }),

   checkIsFriend: (targetUserId) =>
      api.get(`/api/friends/check/${targetUserId}`),

   getFriendStats: () =>
      api.get('/api/friends/stats'),

   searchFriends: (query, params = {}) =>
      api.get('/api/friends/search', { params: { q: query, ...params } }),

   getMutualFriends: (targetUserId) =>
      api.get(`/api/friends/mutual/${targetUserId}`),

   getRecommendations: (limit = 10) =>
      api.get('/api/friends/recommendations', { params: { limit } }),

   blockUser: (userId) =>
      api.post(`/api/friends/${userId}/block`),

   unblockUser: (userId) =>
      api.delete(`/api/friends/${userId}/block`),

   getBlockedUsers: () =>
      api.get('/api/friends/blocked')
};

export const contextsAPI = {
   getContextsByFriend: (friendId) =>
      api.get(`/api/friends/${friendId}/contexts`),

   createContext: (friendshipId, data) =>
      api.post(`/api/friends/${friendshipId}/contexts`, data),

   getTrainerContexts: (status = 'active') =>
      api.get('/api/contexts/trainer', { params: { status } }),

   getTraineeContexts: (status = 'active') =>
      api.get('/api/contexts/trainee', { params: { status } }),

   getActiveContexts: () =>
      api.get('/api/contexts/active'),

   endContext: (contextId) =>
      api.post(`/api/contexts/${contextId}/end`),

   pauseContext: (contextId) =>
      api.post(`/api/contexts/${contextId}/pause`),

   resumeContext: (contextId) =>
      api.post(`/api/contexts/${contextId}/resume`),

   getContextStats: () =>
      api.get('/api/contexts/stats'),
};

// ==================== НОВЫЙ API ДЛЯ ЗАДАНИЙ (TASKS) ====================

export const tasksAPI = {
   /**
    * Создать задание
    * @param {Object} data - Данные задания
    * @param {number} data.user_id - ID спортсмена (обязательно)
    * @param {number} [data.exercise_id] - ID упражнения из библиотеки
    * @param {string} [data.custom_title] - Название кастомного задания
    * @param {string} [data.custom_description] - Описание кастомного задания
    * @param {Object} data.metrics - Метрики выполнения (обязательно)
    * @param {number} [data.priority=2] - Приоритет (1-3)
    * @param {string} [data.due_date] - Срок выполнения (ISO date)
    * @param {number} [data.points_earned=0] - Базовые баллы
    * @param {number} [data.order_index=0] - Порядок сортировки
    * @param {number[]} [data.media_ids=[]] - ID медиафайлов
    */
   createTask: (data) => api.post('/api/tasks', data),

   /**
    * Получить мои задания (с фильтрацией и сортировкой)
    * @param {string} [role='assignee'] - 'assignee' (я выполняю) или 'assigner' (я создал)
    * @param {string} [status=null] - 'active', 'completed', 'archived'
    * @param {string} [sortBy='created_at'] - 'created_at', 'due_date', 'title', 'priority'
    * @param {string} [sortOrder='desc'] - 'asc' или 'desc'
    * @param {number} [limit=50] - Лимит записей
    * @param {number} [offset=0] - Смещение для пагинации
    */
   getMyTasks: (role = 'assignee', status = null, sortBy = 'created_at', sortOrder = 'desc', limit = 50, offset = 0) =>
      api.get('/api/tasks', {
         params: {
            role,
            status,
            sortBy,
            sortOrder,
            limit,
            offset,
            _t: Date.now()
         }
      }),

   /**
    * Получить задание по ID
    * @param {number} taskId - ID задания
    */
   getTaskById: (taskId) => api.get(`/api/tasks/${taskId}`),

   /**
    * Обновить задание (только для тренера/создателя)
    * @param {number} taskId - ID задания
    * @param {Object} data - Данные для обновления
    */
   updateTask: (taskId, data) => api.put(`/api/tasks/${taskId}`, data),

   /**
    * Завершить задание (спортсмен)
    * @param {number} taskId - ID задания
    * @param {Object} result - Результат выполнения
    * @param {Object} result.actual_metrics - Фактические метрики
    * @param {number} [result.felt_difficulty] - Субъективная сложность (1-10)
    * @param {string} [result.comment] - Комментарий к выполнению
    */
   completeTask: (taskId, result) =>
      api.put(`/api/tasks/${taskId}/complete`, result),

   /**
    * Удалить задание (только для тренера/создателя)
    * @param {number} taskId - ID задания
    */
   deleteTask: (taskId) => api.delete(`/api/tasks/${taskId}`),

   /**
    * Получить активные задания (для дашборда спортсмена)
    * @param {number} [limit=10] - Лимит
    */
   getActiveTasks: (limit = 10) =>
      api.get('/api/tasks/active', { params: { limit } }),

   /**
    * Получить статистику по заданиям
    */
   getTaskStats: () => api.get('/api/tasks/stats'),

   /**
    * Получить задания с истекающим сроком
    * @param {number} [days=3] - Количество дней до истечения
    */
   getExpiringTasks: (days = 3) =>
      api.get('/api/tasks/expiring', { params: { days } }),

   /**
    * Получить список пользователей, для которых можно создавать задания
    * @returns {Promise<{data: Array}>} Список пользователей с полем relation_type
    */
   getAssignableUsers: () => api.get('/api/tasks/assignable-users'),

   /**
    * Сохранить кастомное задание в библиотеку упражнений
    * @param {number} taskId - ID кастомного задания
    */
   saveToLibrary: (taskId) =>
      api.post(`/api/tasks/${taskId}/save-to-library`),

   /**
    * Добавить медиа к кастомному заданию
    * @param {number} taskId - ID задания
    * @param {number} mediaId - ID медиафайла
    */
   addMedia: (taskId, mediaId) =>
      api.post(`/api/tasks/${taskId}/media`, { media_id: mediaId }),

   /**
    * Получить медиа задания
    * @param {number} taskId - ID задания
    */
   getTaskMedia: (taskId) => api.get(`/api/tasks/${taskId}/media`),

   /**
    * Удалить медиа из задания
    * @param {number} taskId - ID задания
    * @param {number} mediaId - ID медиафайла
    */
   removeMedia: (taskId, mediaId) =>
      api.delete(`/api/tasks/${taskId}/media/${mediaId}`),
};

export default api;