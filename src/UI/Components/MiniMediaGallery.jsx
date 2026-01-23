// src/UI/Components/MiniMediaGallery.jsx
import React, { useState, useEffect, useMemo } from 'react';
import MediaPreviewModal from './MediaPreviewModal';
import { getMediaUrl } from '../../api/api';
import styles from './MiniMediaGallery.module.css';

const MiniMediaGallery = ({
   mediaItems = [],
   loading = false,
   limit = 6,
   onViewAll
}) => {
   console.log('🖼️ MiniMediaGallery rendered with items:', mediaItems.length);

   const [selectedMedia, setSelectedMedia] = useState(null);
   const [isPreviewOpen, setIsPreviewOpen] = useState(false);

   // Функция для получения правильного URL
   const getLocalMediaUrl = (media) => {
      if (!media) return '';

      console.log('🔗 Getting URL for media:', media);

      // Используем универсальную функцию из api.js
      return media.storage_url
         ? getMediaUrl(media.storage_url)
         : '';
   };

   // Получаем последние медиа (ограниченное количество)
   const latestMedia = useMemo(() => {
      if (!mediaItems || mediaItems.length === 0) return [];

      console.log('📊 Calculating latestMedia from', mediaItems.length, 'items');

      const sorted = [...mediaItems]
         .sort((a, b) => {
            const dateA = a.uploaded_at || a.created_at;
            const dateB = b.uploaded_at || b.created_at;
            return new Date(dateB) - new Date(dateA);
         })
         .slice(0, limit);

      console.log('📊 Latest media:', sorted.map(m => ({
         id: m.id,
         name: m.original_filename,
         url: getLocalMediaUrl(m)
      })));

      return sorted;
   }, [mediaItems, limit]);

   // Проверяем URL для дебага
   useEffect(() => {
      if (latestMedia.length > 0) {
         console.log('🔍 Testing first media URL:');
         const testUrl = getLocalMediaUrl(latestMedia[0]);
         console.log('URL:', testUrl);

         // Тестируем загрузку изображения
         const img = new Image();
         img.onload = () => console.log('✅ Image loads successfully');
         img.onerror = () => console.log('❌ Image failed to load');
         img.src = testUrl;
      }
   }, [latestMedia]);

   // Обработчик клика по медиа
   const handleMediaClick = (media) => {
      console.log('🖱️ Clicked on media:', media.original_filename);
      setSelectedMedia(media);
      setIsPreviewOpen(true);
   };

   // Форматирование размера файла
   const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
   };

   // Форматирование даты
   const formatDate = (dateString) => {
      if (!dateString) return 'Дата неизвестна';

      try {
         const date = new Date(dateString);
         const now = new Date();
         const diffTime = Math.abs(now - date);
         const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

         if (diffDays === 0) {
            return 'Сегодня';
         } else if (diffDays === 1) {
            return 'Вчера';
         } else if (diffDays < 7) {
            return `${diffDays} дн. назад`;
         } else {
            return date.toLocaleDateString('ru-RU', {
               day: 'numeric',
               month: 'short'
            });
         }
      } catch (error) {
         console.error('Date formatting error:', error);
         return 'Дата неизвестна';
      }
   };

   // Получение иконки для типа файла
   const getFileTypeIcon = (fileType, mimeType) => {
      if (fileType === 'photo') {
         return '🖼️';
      } else if (fileType === 'video') {
         if (mimeType?.includes('mp4')) return '🎬';
         if (mimeType?.includes('mov')) return '🎥';
         return '📹';
      }
      return '📄';
   };

   // Если идет загрузка и нет медиа
   if (loading && mediaItems.length === 0) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка медиа...</p>
         </div>
      );
   }

   // Если медиа нет (не загружаются и пустой массив)
   if (!loading && mediaItems.length === 0) {
      return (
         <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🖼️</div>
            <p className={styles.emptyText}>Медиа пока нет</p>
            {onViewAll && (
               <button
                  className={styles.viewAllButton}
                  onClick={onViewAll}
               >
                  Добавить файлы
               </button>
            )}
         </div>
      );
   }

   // Определяем количество колонок в зависимости от количества элементов
   const getGridColumns = () => {
      if (latestMedia.length === 1) return '1fr';
      if (latestMedia.length === 2) return 'repeat(2, 1fr)';
      if (latestMedia.length <= 4) return 'repeat(2, 1fr)';
      return 'repeat(3, 1fr)';
   };

   return (
      <div className={styles.miniGallery}>
         <div className={styles.debugInfo} style={{ display: 'none' }}>
            Items: {mediaItems.length}, Latest: {latestMedia.length}
         </div>

         {/* Контейнер с адаптивной сеткой */}
         <div
            className={styles.mediaGrid}
            style={{ gridTemplateColumns: getGridColumns() }}
         >
            {latestMedia.map((media) => {
               const mediaUrl = getLocalMediaUrl(media);

               return (
                  <div
                     key={media.id}
                     className={styles.mediaCard}
                     onClick={() => handleMediaClick(media)}
                     title={media.original_filename}
                     data-media-id={media.id}
                  >
                     {/* Превью медиа */}
                     <div className={styles.mediaPreview}>
                        {media.file_type === 'photo' ? (
                           <>
                              <img
                                 src={mediaUrl}
                                 alt={media.original_filename}
                                 className={styles.previewImage}
                                 loading="lazy"
                                 onError={(e) => {
                                    console.error('❌ Image load error:', mediaUrl);
                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23f0f0f0"/><text x="100" y="80" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle">Ошибка загрузки</text></svg>';
                                 }}
                                 onLoad={() => console.log('✅ Image loaded:', mediaUrl)}
                              />
                              {!mediaUrl && (
                                 <div className={styles.noImage}>
                                    <span>🖼️</span>
                                    <small>Нет изображения</small>
                                 </div>
                              )}
                           </>
                        ) : (
                           <div className={styles.videoPreview}>
                              <div className={styles.videoIcon}>▶️</div>
                              <div className={styles.videoDuration}>
                                 {media.duration ? `${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                              </div>
                           </div>
                        )}

                        {/* Индикатор приватности */}
                        {media.privacy === 'private' && (
                           <div className={styles.privacyBadge} title="Приватный">
                              🔒
                           </div>
                        )}
                     </div>

                     {/* Информация о файле */}
                     <div className={styles.mediaInfo}>
                        <div className={styles.fileName}>
                           {getFileTypeIcon(media.file_type, media.mime_type)}
                           <span className={styles.nameText}>
                              {media.original_filename.length > 20
                                 ? media.original_filename.substring(0, 20) + '...'
                                 : media.original_filename}
                           </span>
                        </div>

                        <div className={styles.fileMeta}>
                           <span className={styles.fileSize}>
                              {formatFileSize(media.size)}
                           </span>
                           <span className={styles.fileDate}>
                              {formatDate(media.uploaded_at || media.created_at)}
                           </span>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* Кнопка "Все медиа" */}
         {onViewAll && (
            <div className={styles.footer}>
               <button
                  className={styles.viewAllButton}
                  onClick={onViewAll}
               >
                  Все медиа →
               </button>
            </div>
         )}

         {/* Модальное окно просмотра */}
         {isPreviewOpen && selectedMedia && (
            <MediaPreviewModal
               media={selectedMedia}
               isOpen={isPreviewOpen}
               onClose={() => setIsPreviewOpen(false)}
            />
         )}
      </div>
   );
};

export default MiniMediaGallery;