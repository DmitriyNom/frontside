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

export default api;