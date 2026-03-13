import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteMedia } from '../../features/mediaSlice';
import MediaPreviewModal from './MediaPreviewModal';
import ConfirmationModal from './ConfirmationModal';
import { getMediaUrl } from '../../api/api';
import styles from './MediaGallery.module.css';

const MediaGallery = ({ media = [], viewMode = 'grid' }) => {
   const dispatch = useDispatch();
   const [selectedMedia, setSelectedMedia] = useState(null);
   const [previewOpen, setPreviewOpen] = useState(false);

   // Состояние для модалки подтверждения удаления
   const [deleteModal, setDeleteModal] = useState({
      isOpen: false,
      mediaId: null,
      mediaName: ''
   });

   // Функция для получения правильного URL
   const getLocalMediaUrl = (mediaItem) => {
      if (!mediaItem) return '';
      return mediaItem.storage_url
         ? getMediaUrl(mediaItem.storage_url)
         : '';
   };

   // Обработчик удаления - теперь открывает модалку
   const handleDeleteClick = (mediaId, mediaName) => {
      setDeleteModal({
         isOpen: true,
         mediaId,
         mediaName
      });
   };

   // Подтверждение удаления
   const handleConfirmDelete = () => {
      if (deleteModal.mediaId) {
         dispatch(deleteMedia(deleteModal.mediaId));
      }
      setDeleteModal({ isOpen: false, mediaId: null, mediaName: '' });
   };

   // Отмена удаления
   const handleCancelDelete = () => {
      setDeleteModal({ isOpen: false, mediaId: null, mediaName: '' });
   };

   // Открытие превью - вызывается при клике на любую часть карточки
   const handlePreview = (mediaItem) => {
      setSelectedMedia(mediaItem);
      setPreviewOpen(true);
   };

   // Форматирование даты
   const formatDate = (dateString) => {
      if (!dateString) return 'Дата неизвестна';

      try {
         const date = new Date(dateString);
         return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
         });
      } catch (error) {
         return 'Дата неизвестна';
      }
   };

   // Форматирование размера
   const formatFileSize = (bytes) => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
   };

   // Получение иконки для типа файла
   const getMediaIcon = (mediaItem) => {
      if (mediaItem.file_type === 'photo') return '🖼️';
      if (mediaItem.file_type === 'video') return '🎥';
      return '📄';
   };

   if (!media || media.length === 0) {
      return (
         <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🖼️</div>
            <p>Нет медиа для отображения</p>
            <small>Проверьте фильтры или загрузите новые файлы</small>
         </div>
      );
   }

   return (
      <>
         <div className={`${styles.gallery} ${viewMode === 'list' ? styles.listView : styles.gridView}`}>
            {media.map((mediaItem) => {
               const mediaUrl = getLocalMediaUrl(mediaItem);

               return (
                  // ВСЯ КАРТОЧКА КЛИКАБЕЛЬНА - добавлен onClick на корневой элемент
                  <div
                     key={mediaItem.id}
                     className={`${styles.mediaCard} ${mediaItem.file_type === 'video' ? styles.videoItem : styles.photoItem}`}
                     data-media-id={mediaItem.id}
                     onClick={() => handlePreview(mediaItem)}
                     title="Нажмите для просмотра и управления файлом"
                  >
                     {/* Верхняя часть карточки с превью */}
                     <div className={styles.mediaPreview}>
                        {mediaItem.file_type === 'photo' ? (
                           <div className={styles.imageContainer}>
                              <img
                                 src={mediaUrl}
                                 alt={mediaItem.original_filename}
                                 loading="lazy"
                                 className={styles.previewImage}
                                 onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = `
                                       <div class="${styles.imageError}">
                                          <span>🖼️</span>
                                          <small>Ошибка загрузки</small>
                                       </div>
                                    `;
                                 }}
                              />
                              {!mediaUrl && (
                                 <div className={styles.imageError}>
                                    <span>🖼️</span>
                                    <small>Нет изображения</small>
                                 </div>
                              )}
                           </div>
                        ) : (
                           <div className={styles.videoPreview}>
                              <div className={styles.videoIcon}>🎥</div>
                              <div className={styles.videoLabel}>Видео</div>
                              {mediaItem.duration && (
                                 <div className={styles.videoDuration}>
                                    {new Date(mediaItem.duration * 1000).toISOString().substr(11, 8)}
                                 </div>
                              )}
                           </div>
                        )}

                        {/* Бэйджик приватности */}
                        <div className={`${styles.privacyBadge} ${mediaItem.privacy === 'public' ? styles.public : styles.private}`}>
                           {mediaItem.privacy === 'public' ? 'Публичный' : 'Приватный'}
                        </div>
                     </div>

                     {/* Нижняя часть карточки с информацией - тоже кликабельна через родителя */}
                     <div className={styles.mediaInfo}>
                        <div className={styles.filename} title={mediaItem.original_filename}>
                           {getMediaIcon(mediaItem)} {mediaItem.original_filename}
                        </div>

                        <div className={styles.metadata}>
                           <div className={styles.metaItem}>
                              <span className={styles.metaLabel}>Размер:</span>
                              <span className={styles.metaValue}>{formatFileSize(mediaItem.size)}</span>
                           </div>

                           <div className={styles.metaItem}>
                              <span className={styles.metaLabel}>Загружено:</span>
                              <span className={styles.metaValue}>{formatDate(mediaItem.uploaded_at)}</span>
                           </div>

                           {mediaItem.shared_count > 0 && (
                              <div className={styles.metaItem}>
                                 <span className={styles.metaLabel}>Поделились:</span>
                                 <span className={styles.metaValue}>{mediaItem.shared_count}</span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* Модальное окно превью */}
         {previewOpen && selectedMedia && (
            <MediaPreviewModal
               media={selectedMedia}
               isOpen={previewOpen}
               onClose={() => setPreviewOpen(false)}
            />
         )}

         {/* Модалка подтверждения удаления */}
         <ConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            title="Удаление файла"
            message={`Вы уверены, что хотите удалить файл "${deleteModal.mediaName}"?`}
            confirmText="Удалить"
            cancelText="Отмена"
            type="delete"
         />
      </>
   );
};

export default MediaGallery;