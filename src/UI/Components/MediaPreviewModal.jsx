import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   deleteMedia,
   updateMediaPrivacy,
   fetchUserMedia
} from '../../features/mediaSlice';
import { getMediaUrl } from '../../api/api';
import ConfirmationModal from './ConfirmationModal';
import styles from './MediaPreviewModal.module.css';

const MediaPreviewModal = ({ media, isOpen, onClose }) => {
   const dispatch = useDispatch();
   const { items } = useSelector((state) => state.media);

   const [currentMedia, setCurrentMedia] = useState(media);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isEditing, setIsEditing] = useState(false);
   const [isDownloading, setIsDownloading] = useState(false); // NEW: состояние загрузки
   const [editForm, setEditForm] = useState({
      privacy: media?.privacy || 'private',
      allow_reshare: media?.allow_reshare || true,
      shared_with_friends: media?.shared_with_friends || false,
      shared_with_trainees: media?.shared_with_trainees || false,
   });

   // Состояние для модалки подтверждения удаления
   const [deleteModal, setDeleteModal] = useState({
      isOpen: false,
      mediaId: null,
      mediaName: ''
   });

   // Находим индекс текущего медиа в общем списке
   useEffect(() => {
      if (media && items.length > 0) {
         const index = items.findIndex(item => item.id === media.id);
         setCurrentIndex(index >= 0 ? index : 0);
         setCurrentMedia(items[index] || media);

         setEditForm({
            privacy: items[index]?.privacy || media.privacy || 'private',
            allow_reshare: items[index]?.allow_reshare || media.allow_reshare || true,
            shared_with_friends: items[index]?.shared_with_friends || media.shared_with_friends || false,
            shared_with_trainees: items[index]?.shared_with_trainees || media.shared_with_trainees || false,
         });
      }
   }, [media, items]);

   // Получение URL медиа
   const getLocalMediaUrl = useCallback((mediaItem) => {
      if (!mediaItem?.storage_url) return '';
      return getMediaUrl(mediaItem.storage_url);
   }, []);

   // Функция для скачивания файла через fetch + Blob
   const downloadWithFetch = useCallback(async (url, filename) => {
      try {
         console.log('Начинаем скачивание через fetch:', url);

         const response = await fetch(url);

         if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`);
         }

         // Получаем Blob из ответа
         const blob = await response.blob();

         // Создаем URL для Blob
         const blobUrl = window.URL.createObjectURL(blob);

         // Создаем временную ссылку
         const link = document.createElement('a');
         link.href = blobUrl;
         link.download = filename;

         // Важно: добавляем в DOM для некоторых браузеров
         document.body.appendChild(link);

         // Эмулируем клик
         link.click();

         // Убираем ссылку из DOM
         document.body.removeChild(link);

         // Освобождаем память
         window.URL.revokeObjectURL(blobUrl);

         console.log('Файл успешно скачан через fetch');
         return true;

      } catch (error) {
         console.error('Ошибка при скачивании через fetch:', error);
         return false;
      }
   }, []);

   // Fallback метод для скачивания (если fetch не работает)
   const downloadWithDirectLink = useCallback((url, filename) => {
      try {
         console.log('Пробуем прямой метод скачивания');

         // Создаем временную ссылку
         const link = document.createElement('a');
         link.href = url;
         link.download = filename;
         link.target = '_blank';
         link.rel = 'noopener noreferrer';

         // Для мобильных устройств иногда нужно добавить атрибут
         link.setAttribute('download', filename);

         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);

         console.log('Прямой метод выполнен');
         return true;

      } catch (error) {
         console.error('Ошибка при прямом скачивании:', error);
         return false;
      }
   }, []);

   // Основной обработчик скачивания
   const handleDownload = useCallback(async () => {
      if (!currentMedia || isDownloading) return;

      setIsDownloading(true);

      const url = getLocalMediaUrl(currentMedia);
      const filename = currentMedia.original_filename;

      if (!url) {
         alert('Не удалось получить ссылку на файл');
         setIsDownloading(false);
         return;
      }

      console.log('Скачивание файла:', filename, 'URL:', url);

      // Пробуем сначала метод с fetch (надежнее)
      const fetchSuccess = await downloadWithFetch(url, filename);

      if (!fetchSuccess) {
         console.log('Метод с fetch не сработал, пробуем прямой метод');

         // Пробуем прямой метод как fallback
         const directSuccess = downloadWithDirectLink(url, filename);

         if (!directSuccess) {
            // Если оба метода не сработали, показываем сообщение
            alert('Не удалось скачать файл. Попробуйте:\n\n' +
               '1. Нажать правой кнопкой на файл и выбрать "Сохранить как"\n' +
               '2. Или скопировать ссылку и открыть в новом окне');
         }
      }

      setIsDownloading(false);

   }, [currentMedia, isDownloading, getLocalMediaUrl, downloadWithFetch, downloadWithDirectLink]);

   // Переход к следующему медиа
   const handleNext = useCallback(() => {
      if (items.length === 0) return;
      const nextIndex = (currentIndex + 1) % items.length;
      setCurrentIndex(nextIndex);
      setCurrentMedia(items[nextIndex]);
      setIsEditing(false);
   }, [items, currentIndex]);

   // Переход к предыдущему медиа
   const handlePrevious = useCallback(() => {
      if (items.length === 0) return;
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      setCurrentIndex(prevIndex);
      setCurrentMedia(items[prevIndex]);
      setIsEditing(false);
   }, [items, currentIndex]);

   // Обработчик клика на кнопку удаления
   const handleDeleteClick = useCallback(() => {
      if (!currentMedia) return;

      setDeleteModal({
         isOpen: true,
         mediaId: currentMedia.id,
         mediaName: currentMedia.original_filename
      });
   }, [currentMedia]);

   // Подтверждение удаления
   const handleConfirmDelete = useCallback(() => {
      if (!deleteModal.mediaId) return;

      const currentItemId = currentMedia?.id;
      const currentItemIndex = currentIndex;

      dispatch(deleteMedia(deleteModal.mediaId)).then(() => {
         setDeleteModal({ isOpen: false, mediaId: null, mediaName: '' });

         // После удаления обновляем список
         dispatch(fetchUserMedia()).then(() => {
            // Проверяем, остались ли элементы
            const updatedItems = items.filter(item => item.id !== currentItemId);

            if (updatedItems.length === 0) {
               // Если больше нет медиа - закрываем модалку
               onClose();
            } else {
               // Переходим к следующему элементу или предыдущему, если это был последний
               let newIndex = currentItemIndex;
               if (currentItemIndex >= updatedItems.length) {
                  newIndex = updatedItems.length - 1;
               }

               // Обновляем текущее медиа
               if (updatedItems[newIndex]) {
                  setCurrentMedia(updatedItems[newIndex]);
                  setCurrentIndex(newIndex);
               }
            }
         });
      });
   }, [deleteModal.mediaId, dispatch, currentMedia?.id, currentIndex, items, onClose]);

   // Отмена удаления
   const handleCancelDelete = useCallback(() => {
      setDeleteModal({ isOpen: false, mediaId: null, mediaName: '' });
   }, []);

   // Сохранение изменений
   const handleSaveEdit = useCallback(() => {
      if (!currentMedia) return;

      dispatch(updateMediaPrivacy({
         mediaId: currentMedia.id,
         privacy: editForm.privacy
      })).then(() => {
         setIsEditing(false);
         dispatch(fetchUserMedia());
      });
   }, [currentMedia, dispatch, editForm.privacy]);

   // Навигация с клавиатуры
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (!isOpen) return;

         switch (e.key) {
            case 'Escape':
               onClose();
               break;
            case 'ArrowLeft':
               handlePrevious();
               break;
            case 'ArrowRight':
               handleNext();
               break;
            default:
               break;
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, handlePrevious, handleNext, onClose]);

   // Форматирование даты
   const formatDate = useCallback((dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('ru-RU', {
         day: 'numeric',
         month: 'long',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   }, []);

   // Форматирование размера
   const formatFileSize = useCallback((bytes) => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
   }, []);

   // Если модальное окно закрыто
   if (!isOpen || !currentMedia) return null;

   const mediaUrl = getLocalMediaUrl(currentMedia);

   return (
      <>
         <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
               {/* Заголовок с информацией */}
               <div className={styles.header}>
                  <div className={styles.titleSection}>
                     <h2 className={styles.filename}>
                        {currentMedia.original_filename}
                     </h2>
                     <div className={styles.fileInfo}>
                        <span className={styles.fileType}>
                           {currentMedia.file_type === 'photo' ? 'Изображение' : 'Видео'}
                        </span>
                        <span className={styles.fileSize}>
                           {formatFileSize(currentMedia.size)}
                        </span>
                        <span className={styles.uploadDate}>
                           {formatDate(currentMedia.uploaded_at)}
                        </span>
                     </div>
                  </div>

                  <button className={styles.closeButton} onClick={onClose}>
                     ×
                  </button>
               </div>

               {/* Основное содержимое */}
               <div className={styles.mainContent}>
                  {/* Левая часть - медиа */}
                  <div className={styles.mediaContainer}>
                     {currentMedia.file_type === 'photo' ? (
                        <img
                           src={mediaUrl}
                           alt={currentMedia.original_filename}
                           className={styles.mediaDisplay}
                           onError={(e) => {
                              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23f0f0f0"/><text x="400" y="300" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle">Изображение не найдено</text></svg>';
                           }}
                        />
                     ) : (
                        <div className={styles.videoContainer}>
                           <video
                              src={mediaUrl}
                              controls
                              className={styles.videoDisplay}
                              poster={currentMedia.thumbnail_url ?
                                 `http://localhost:5000${currentMedia.thumbnail_url}` :
                                 undefined
                              }
                           >
                              Ваш браузер не поддерживает видео.
                           </video>
                        </div>
                     )}

                     {/* Кнопки навигации */}
                     {items.length > 1 && (
                        <>
                           <button
                              className={`${styles.navButton} ${styles.prevButton}`}
                              onClick={handlePrevious}
                           >
                              ‹
                           </button>
                           <button
                              className={`${styles.navButton} ${styles.nextButton}`}
                              onClick={handleNext}
                           >
                              ›
                           </button>

                           <div className={styles.navInfo}>
                              {currentIndex + 1} / {items.length}
                           </div>
                        </>
                     )}
                  </div>

                  {/* Правая часть - информация и управление */}
                  <div className={styles.sidePanel}>
                     {isEditing ? (
                        <div className={styles.editForm}>
                           <h3>Настройки доступа</h3>

                           {/* Только приватность */}
                           <div className={styles.formGroup}>
                              <label className={styles.formLabel}>Приватность</label>
                              <div className={styles.radioGroup}>
                                 <label className={styles.radioOption}>
                                    <input
                                       type="radio"
                                       value="private"
                                       checked={editForm.privacy === 'private'}
                                       onChange={(e) => setEditForm({ ...editForm, privacy: e.target.value })}
                                    />
                                    <span>Приватный</span>
                                 </label>
                                 <label className={styles.radioOption}>
                                    <input
                                       type="radio"
                                       value="public"
                                       checked={editForm.privacy === 'public'}
                                       onChange={(e) => setEditForm({ ...editForm, privacy: e.target.value })}
                                    />
                                    <span>Публичный</span>
                                 </label>
                              </div>
                           </div>

                           <div className={styles.formActions}>
                              <button
                                 className={styles.cancelButton}
                                 onClick={() => setIsEditing(false)}
                              >
                                 Отмена
                              </button>
                              <button
                                 className={styles.saveButton}
                                 onClick={handleSaveEdit}
                              >
                                 Сохранить
                              </button>
                           </div>
                        </div>
                     ) : (
                        <>
                           {/* Информация о файле */}
                           <div className={styles.infoSection}>
                              <h3>Информация о файле</h3>

                              <div className={styles.infoGrid}>
                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Тип:</span>
                                    <span className={styles.infoValue}>
                                       {currentMedia.mime_type}
                                    </span>
                                 </div>

                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Размер:</span>
                                    <span className={styles.infoValue}>
                                       {formatFileSize(currentMedia.size)}
                                    </span>
                                 </div>

                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Загружен:</span>
                                    <span className={styles.infoValue}>
                                       {formatDate(currentMedia.uploaded_at)}
                                    </span>
                                 </div>

                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Статус:</span>
                                    <span className={`${styles.infoValue} ${styles.privacyBadge} ${currentMedia.privacy === 'public' ? styles.public : styles.private}`}>
                                       {currentMedia.privacy === 'public' ? 'Публичный' : 'Приватный'}
                                    </span>
                                 </div>

                                 {currentMedia.shared_count > 0 && (
                                    <div className={styles.infoRow}>
                                       <span className={styles.infoLabel}>Поделились:</span>
                                       <span className={styles.infoValue}>
                                          {currentMedia.shared_count} раз
                                       </span>
                                    </div>
                                 )}

                                 {currentMedia.duration && (
                                    <div className={styles.infoRow}>
                                       <span className={styles.infoLabel}>Длительность:</span>
                                       <span className={styles.infoValue}>
                                          {new Date(currentMedia.duration * 1000).toISOString().substr(11, 8)}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Действия */}
                           <div className={styles.actionsSection}>
                              <h3>Действия</h3>

                              <div className={styles.actionsGrid}>
                                 {/* ЗАМЕНА: кнопка скачивания вместо ссылки */}
                                 <button
                                    className={styles.actionButton}
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                 >
                                    {isDownloading ? '⏳ Скачивание...' : '⬇️ Скачать'}
                                 </button>

                                 <button
                                    className={styles.actionButton}
                                    onClick={() => setIsEditing(true)}
                                 >
                                    ✏️ Редактировать
                                 </button>

                                 <button
                                    className={`${styles.actionButton} ${styles.shareButton}`}
                                    onClick={() => {
                                       if (mediaUrl) {
                                          navigator.clipboard.writeText(mediaUrl);
                                          alert('Ссылка скопирована в буфер обмена');
                                       }
                                    }}
                                 >
                                    🔗 Копировать ссылку
                                 </button>

                                 <button
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    onClick={handleDeleteClick}
                                 >
                                    🗑️ Удалить
                                 </button>
                              </div>
                           </div>
                        </>
                     )}
                  </div>
               </div>
            </div>
         </div>

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

export default MediaPreviewModal;