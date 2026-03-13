// // import axios from 'axios';

// // const api = axios.create({
// //    baseURL: 'http://localhost:5000',
// //    withCredentials: true,
// // });

// // /**
// //  * Универсальная функция для получения URL файла
// //  * @param {string} path - Путь из БД (может быть разным для разных модулей)
// //  * @param {string} type - Тип файла: 'media', 'note', 'exercise', 'avatar'
// //  * @returns {string} Полный URL
// //  */
// // export const getFileUrl = (path, type = 'media') => {
// //    if (!path || path === 'null' || path === 'undefined') return '';

// //    // Если уже полный URL
// //    if (path.startsWith('http')) return path;

// //    const baseUrl = 'http://localhost:5000';

// //    // ===== НОВЫЕ ПУТИ (media/public/, media/private/) =====

// //    // 1. Если путь начинается с media/public/
// //    if (path.includes('media/public/')) {
// //       const relativePath = path.split('media/public/')[1];
// //       return `${baseUrl}/media/public/${relativePath}`;
// //    }

// //    // 2. Если путь начинается с media/private/
// //    if (path.includes('media/private/')) {
// //       const relativePath = path.split('media/private/')[1];
// //       return `${baseUrl}/media/private/${relativePath}`;
// //    }

// //    // ===== СТАРЫЕ ПУТИ (для обратной совместимости) =====

// //    // Убираем возможные дублирующиеся uploads/
// //    let cleanPath = path.replace(/^uploads\//, '');

// //    // Обработка разных типов файлов
// //    switch (type) {
// //       case 'media':
// //          // training-media/19/... → 19/...
// //          if (cleanPath.includes('training-media/')) {
// //             cleanPath = cleanPath.replace('training-media/', '');
// //             return `${baseUrl}/uploads/training-media/${cleanPath}`;
// //          }
// //          // training-media-public/19/...
// //          if (cleanPath.includes('training-media-public/')) {
// //             cleanPath = cleanPath.replace('training-media-public/', '');
// //             return `${baseUrl}/public/uploads/training-media-public/${cleanPath}`;
// //          }
// //          return `${baseUrl}/uploads/${cleanPath}`;

// //       case 'note':
// //          // Для заметок
// //          return `${baseUrl}/uploads/${cleanPath}`;

// //       case 'avatar':
// //          // Для аватарок
// //          return `${baseUrl}/uploads/avatars/${cleanPath}`;

// //       default:
// //          return `${baseUrl}/uploads/${cleanPath}`;
// //    }
// // };

// // // Также можно добавить вспомогательные функции
// // export const getMediaUrl = (path) => getFileUrl(path, 'media');
// // export const getNoteFileUrl = (path) => getFileUrl(path, 'note');
// // export const getAvatarUrl = (path) => getFileUrl(path, 'avatar');

// // export default api;

// import axios from 'axios';

// const api = axios.create({
//    baseURL: 'http://localhost:5000',
//    withCredentials: true,
// });

// /**
//  * Универсальная функция для получения URL файла
//  * @param {string} path - Путь из БД (может быть разным для разных модулей)
//  * @param {string} type - Тип файла: 'media', 'note', 'exercise', 'avatar'
//  * @returns {string} Полный URL
//  */
// export const getFileUrl = (path, type = 'media') => {
//    if (!path || path === 'null' || path === 'undefined') return '';

//    // Если уже полный URL
//    if (path.startsWith('http')) return path;

//    const baseUrl = 'http://localhost:5000';

//    // ===== НОВЫЕ ПУТИ (media/public/, media/private/) =====

//    // 1. Если путь начинается с media/public/
//    if (path.includes('media/public/')) {
//       const relativePath = path.split('media/public/')[1];
//       return `${baseUrl}/media/public/${relativePath}`;
//    }

//    // 2. Если путь начинается с media/private/
//    if (path.includes('media/private/')) {
//       const relativePath = path.split('media/private/')[1];
//       return `${baseUrl}/media/private/${relativePath}`;
//    }

//    // ===== СТАРЫЕ ПУТИ (для обратной совместимости) =====

//    // Убираем возможные дублирующиеся uploads/
//    let cleanPath = path.replace(/^uploads\//, '');

//    // Обработка разных типов файлов
//    switch (type) {
//       case 'media':
//          // training-media/19/... → 19/...
//          if (cleanPath.includes('training-media/')) {
//             cleanPath = cleanPath.replace('training-media/', '');
//             return `${baseUrl}/uploads/training-media/${cleanPath}`;
//          }
//          // training-media-public/19/...
//          if (cleanPath.includes('training-media-public/')) {
//             cleanPath = cleanPath.replace('training-media-public/', '');
//             return `${baseUrl}/public/uploads/training-media-public/${cleanPath}`;
//          }
//          return `${baseUrl}/uploads/${cleanPath}`;

//       case 'note':
//          // Для заметок
//          return `${baseUrl}/uploads/${cleanPath}`;

//       case 'avatar':
//          // Для аватарок
//          return `${baseUrl}/uploads/avatars/${cleanPath}`;

//       default:
//          return `${baseUrl}/uploads/${cleanPath}`;
//    }
// };

// // Также можно добавить вспомогательные функции
// export const getMediaUrl = (path) => getFileUrl(path, 'media');
// export const getNoteFileUrl = (path) => getFileUrl(path, 'note');
// export const getAvatarUrl = (path) => getFileUrl(path, 'avatar');

// // ===== КОД ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ ТОКЕНОВ =====

// // Переменные для управления очередью запросов при обновлении токена
// let isRefreshing = false;
// let failedQueue = [];

// // Очередь запросов, ожидающих обновления токена
// const processQueue = (error, token = null) => {
//    failedQueue.forEach(prom => {
//       if (error) {
//          prom.reject(error);
//       } else {
//          prom.resolve(token);
//       }
//    });
//    failedQueue = [];
// };

// // Интерцептор для обработки ошибок 401 (Unauthorized)
// api.interceptors.response.use(
//    (response) => {
//       // Успешный ответ - просто возвращаем его
//       return response;
//    },
//    async (error) => {
//       const originalRequest = error.config;

//       // ✅ ИСПРАВЛЕНО: Определяем, является ли запрос эндпоинтом обновления токена
//       const isRefreshEndpoint = originalRequest.url?.includes('/api/user/refresh') ||
//          originalRequest.url?.includes('/auth/refresh');

//       // ✅ ИСПРАВЛЕНО: Добавляем проверку, чтобы избежать зацикливания
//       const isLoginEndpoint = originalRequest.url?.includes('/api/user/login');
//       const isLogoutEndpoint = originalRequest.url?.includes('/api/user/logout');

//       // Если ошибка 401 и это не запрос на обновление токена, логин или логаут
//       if (error.response?.status === 401 &&
//          !originalRequest._retry &&
//          !isRefreshEndpoint &&
//          !isLoginEndpoint &&
//          !isLogoutEndpoint) {

//          // Если уже идет процесс обновления токена
//          if (isRefreshing) {
//             // Помещаем запрос в очередь и ждем обновления токена
//             return new Promise((resolve, reject) => {
//                failedQueue.push({ resolve, reject });
//             }).then(() => {
//                // После обновления токена повторяем оригинальный запрос
//                return api(originalRequest);
//             }).catch(err => {
//                return Promise.reject(err);
//             });
//          }

//          // Помечаем запрос как обработанный для предотвращения циклов
//          originalRequest._retry = true;
//          isRefreshing = true;

//          try {
//             // ✅ ИСПРАВЛЕНО: Используем правильный эндпоинт из authSlice.js
//             await axios.post('http://localhost:5000/api/user/refresh', {}, {
//                withCredentials: true
//             });

//             // Токен успешно обновлен
//             isRefreshing = false;

//             // Обрабатываем очередь ожидающих запросов
//             processQueue(null);

//             // Повторяем оригинальный запрос с обновленным токеном
//             return api(originalRequest);

//          } catch (refreshError) {
//             // Не удалось обновить токен
//             isRefreshing = false;
//             processQueue(refreshError, null);

//             // ✅ ИСПРАВЛЕНО: Проверяем, не отправляли ли мы уже событие
//             if (!originalRequest._authExpiredSent) {
//                originalRequest._authExpiredSent = true;

//                // Отправляем событие о истечении аутентификации
//                window.dispatchEvent(new CustomEvent('auth-expired', {
//                   detail: {
//                      message: 'Сессия истекла',
//                      fromRefresh: false,
//                      status: refreshError.response?.status
//                   }
//                }));
//             }

//             return Promise.reject(refreshError);
//          }
//       }

//       // ✅ ИСПРАВЛЕНО: Обработка 401 ошибки на эндпоинте обновления токена
//       if (error.response?.status === 401 && isRefreshEndpoint) {
//          // Отправляем событие о невалидном refresh токене
//          window.dispatchEvent(new CustomEvent('auth-expired', {
//             detail: {
//                message: 'Сессия истекла (refresh token невалиден)',
//                fromRefresh: true,
//                status: 401
//             }
//          }));
//       }

//       // Если это не ошибка 401, просто прокидываем ее дальше
//       return Promise.reject(error);
//    }
// );

// // Интерцептор для добавления заголовков к запросам
// api.interceptors.request.use(
//    (config) => {
//       // Можно добавить логирование запросов для отладки
//       console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
//       return config;
//    },
//    (error) => {
//       console.error('API Request Error:', error);
//       return Promise.reject(error);
//    }
// );

// // Экспортируем настроенный экземпляр axios
// export default api;

import axios from 'axios';

const api = axios.create({
   baseURL: 'http://localhost:5000',
   withCredentials: true,
});

/**
 * Универсальная функция для получения URL файла
 * @param {string} path - Путь из БД (может быть разным для разных модулей)
 * @param {string} type - Тип файла: 'media', 'note', 'exercise', 'avatar'
 * @returns {string} Полный URL
 */
export const getFileUrl = (path, type = 'media') => {
   if (!path || path === 'null' || path === 'undefined') return '';

   // Если уже полный URL
   if (path.startsWith('http')) return path;

   const baseUrl = 'http://localhost:5000';

   // ===== НОВЫЕ ПУТИ (media/public/, media/private/) =====

   // 1. Если путь начинается с media/public/
   if (path.includes('media/public/')) {
      const relativePath = path.split('media/public/')[1];
      return `${baseUrl}/media/public/${relativePath}`;
   }

   // 2. Если путь начинается с media/private/
   if (path.includes('media/private/')) {
      const relativePath = path.split('media/private/')[1];
      return `${baseUrl}/media/private/${relativePath}`;
   }

   // ===== СТАРЫЕ ПУТИ (для обратной совместимости) =====

   // Убираем возможные дублирующиеся uploads/
   let cleanPath = path.replace(/^uploads\//, '');

   // Обработка разных типов файлов
   switch (type) {
      case 'media':
         // training-media/19/... → 19/...
         if (cleanPath.includes('training-media/')) {
            cleanPath = cleanPath.replace('training-media/', '');
            return `${baseUrl}/uploads/training-media/${cleanPath}`;
         }
         // training-media-public/19/...
         if (cleanPath.includes('training-media-public/')) {
            cleanPath = cleanPath.replace('training-media-public/', '');
            return `${baseUrl}/public/uploads/training-media-public/${cleanPath}`;
         }
         return `${baseUrl}/uploads/${cleanPath}`;

      case 'note':
         // Для заметок
         return `${baseUrl}/uploads/${cleanPath}`;

      case 'avatar':
         // Для аватарок
         return `${baseUrl}/uploads/avatars/${cleanPath}`;

      default:
         return `${baseUrl}/uploads/${cleanPath}`;
   }
};

// Также можно добавить вспомогательные функции
export const getMediaUrl = (path) => getFileUrl(path, 'media');
export const getNoteFileUrl = (path) => getFileUrl(path, 'note');
export const getAvatarUrl = (path) => getFileUrl(path, 'avatar');

// ===== КОД ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ ТОКЕНОВ =====

// Переменные для управления очередью запросов при обновлении токена
let isRefreshing = false;
let failedQueue = [];

// Очередь запросов, ожидающих обновления токена
const processQueue = (error, token = null) => {
   failedQueue.forEach(prom => {
      if (error) {
         prom.reject(error);
      } else {
         prom.resolve(token);
      }
   });
   failedQueue = [];
};

// Интерцептор для обработки ошибок 401 (Unauthorized)
api.interceptors.response.use(
   (response) => {
      // Успешный ответ - просто возвращаем его
      return response;
   },
   async (error) => {
      const originalRequest = error.config;

      // Определяем, является ли запрос эндпоинтом обновления токена
      const isRefreshEndpoint = originalRequest.url?.includes('/api/user/refresh') ||
         originalRequest.url?.includes('/auth/refresh');

      // Добавляем проверку, чтобы избежать зацикливания
      const isLoginEndpoint = originalRequest.url?.includes('/api/user/login');
      const isLogoutEndpoint = originalRequest.url?.includes('/api/user/logout');

      // Если ошибка 401 и это не запрос на обновление токена, логин или логаут
      if (error.response?.status === 401 &&
         !originalRequest._retry &&
         !isRefreshEndpoint &&
         !isLoginEndpoint &&
         !isLogoutEndpoint) {

         // Если уже идет процесс обновления токена
         if (isRefreshing) {
            // Помещаем запрос в очередь и ждем обновления токена
            return new Promise((resolve, reject) => {
               failedQueue.push({ resolve, reject });
            }).then(() => {
               // После обновления токена повторяем оригинальный запрос
               return api(originalRequest);
            }).catch(err => {
               return Promise.reject(err);
            });
         }

         // Помечаем запрос как обработанный для предотвращения циклов
         originalRequest._retry = true;
         isRefreshing = true;

         try {
            // Используем правильный эндпоинт из authSlice.js
            await axios.post('http://localhost:5000/api/user/refresh', {}, {
               withCredentials: true
            });

            // Токен успешно обновлен
            isRefreshing = false;

            // Обрабатываем очередь ожидающих запросов
            processQueue(null);

            // Повторяем оригинальный запрос с обновленным токеном
            return api(originalRequest);

         } catch (refreshError) {
            // Не удалось обновить токен
            isRefreshing = false;
            processQueue(refreshError, null);

            // Проверяем, не отправляли ли мы уже событие
            if (!originalRequest._authExpiredSent) {
               originalRequest._authExpiredSent = true;

               // Отправляем событие о истечении аутентификации
               window.dispatchEvent(new CustomEvent('auth-expired', {
                  detail: {
                     message: 'Сессия истекла',
                     fromRefresh: false,
                     status: refreshError.response?.status
                  }
               }));
            }

            return Promise.reject(refreshError);
         }
      }

      // Обработка 401 ошибки на эндпоинте обновления токена
      if (error.response?.status === 401 && isRefreshEndpoint) {
         // Отправляем событие о невалидном refresh токене
         window.dispatchEvent(new CustomEvent('auth-expired', {
            detail: {
               message: 'Сессия истекла (refresh token невалиден)',
               fromRefresh: true,
               status: 401
            }
         }));
      }

      // Если это не ошибка 401, просто прокидываем ее дальше
      return Promise.reject(error);
   }
);

// Интерцептор для добавления заголовков к запросам (без логирования)
api.interceptors.request.use(
   (config) => {
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

export const connectionsAPI = {
   // Основные операции
   sendRequest: (trainerId, message = '') =>
      api.post('/api/connections/request', { trainer_id: trainerId, message }),

   respondToRequest: (requestId, action) =>
      api.post(`/api/connections/request/${requestId}/respond`, { action }),

   removeConnection: (userId) =>
      api.delete(`/api/connections/${userId}`),

   // Получение данных
   getMyTrainees: () => api.get('/api/connections/trainees'),
   getMyTrainers: () => api.get('/api/connections/trainers'),

   // Управление запросами
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

   // Поиск и рекомендации
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

   // Статистика
   getConnectionStats: () => api.get('/api/connections/stats')
};

// Вспомогательные функции для работы с пользователями
export const userAPI = {
   // Получить список пользователей по ID
   getUsersByIds: (userIds) =>
      api.post('/api/user/batch', { userIds }),

   // Поиск пользователей
   searchUsers: (query, role = null) =>
      api.get('/api/user/search', {
         params: { query, role }
      }),

   // Получить пользователя по ID
   getUserById: (userId) =>
      api.get(`/api/user/${userId}`)
};

// Экспортируем все методы
export default api;