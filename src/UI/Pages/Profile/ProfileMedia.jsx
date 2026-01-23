// src/UI/Pages/Profile/ProfileMedia.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
   fetchUserMedia,
   deleteMedia,
   updateMediaPrivacy,
   selectMediaItems,
   selectMediaLoading,
   selectMediaError
} from '../../../features/mediaSlice';
import MediaGallery from '../../Components/MediaGallery';
import FileUploadModal from '../../Components/FileUploadModal';
import ConfirmationModal from '../../Components/ConfirmationModal';
import styles from './ProfileMedia.module.css';

const ProfileMedia = () => {
   const dispatch = useDispatch();

   // Получаем данные из Redux
   const mediaItems = useSelector(selectMediaItems);
   const isLoading = useSelector(selectMediaLoading);
   const error = useSelector(selectMediaError);

   // Локальное состояние
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [mediaToDelete, setMediaToDelete] = useState(null);
   const [sortBy, setSortBy] = useState('uploaded_at');
   const [sortOrder, setSortOrder] = useState('desc');
   const [searchQuery, setSearchQuery] = useState('');
   const [filterType, setFilterType] = useState('all');

   // Загружаем медиа при монтировании
   useEffect(() => {
      dispatch(fetchUserMedia());
   }, [dispatch]);

   // Обработчики действий
   const handleUploadClick = () => {
      setIsUploadModalOpen(true);
   };

   const handleDeleteClick = (media) => {
      setMediaToDelete(media);
      setIsDeleteModalOpen(true);
   };

   const confirmDelete = () => {
      if (mediaToDelete) {
         dispatch(deleteMedia(mediaToDelete.id));
         setIsDeleteModalOpen(false);
         setMediaToDelete(null);
      }
   };

   const handlePrivacyChange = (mediaId, newPrivacy) => {
      dispatch(updateMediaPrivacy({ mediaId, privacy: newPrivacy }));
   };

   const handleSearchChange = (e) => {
      setSearchQuery(e.target.value);
   };

   const handleSortChange = (newSortBy) => {
      if (sortBy === newSortBy) {
         setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
         setSortBy(newSortBy);
         setSortOrder('desc');
      }
   };

   // ФИЛЬТРАЦИЯ И СОРТИРОВКА МЕДИА - ИСПРАВЛЕННАЯ ВЕРСИЯ
   const filteredAndSortedMedia = useCallback(() => {
      let filtered = [...mediaItems];

      if (filtered.length === 0) {
         return [];
      }

      // 1. ФИЛЬТРАЦИЯ ПО ТИПУ (фото/видео/все)
      if (filterType !== 'all') {
         filtered = filtered.filter(item => item.file_type === filterType);
      }

      // 2. ФИЛЬТРАЦИЯ ПО ПОИСКОВОМУ ЗАПРОСУ (поиск по названию файла)
      if (searchQuery.trim()) {
         const query = searchQuery.toLowerCase().trim();
         filtered = filtered.filter(item =>
            item.original_filename?.toLowerCase().includes(query)
         );
      }

      // 3. СОРТИРОВКА
      if (sortBy === 'original_filename') {
         // Сортировка по названию
         filtered.sort((a, b) => {
            const nameA = a.original_filename?.toLowerCase() || '';
            const nameB = b.original_filename?.toLowerCase() || '';
            if (sortOrder === 'desc') {
               return nameB.localeCompare(nameA);
            }
            return nameA.localeCompare(nameB);
         });
      } else if (sortBy === 'size') {
         // Сортировка по размеру
         filtered.sort((a, b) => {
            const sizeA = a.size || 0;
            const sizeB = b.size || 0;
            return sortOrder === 'desc' ? sizeB - sizeA : sizeA - sizeB;
         });
      } else {
         // Сортировка по дате (по умолчанию)
         filtered.sort((a, b) => {
            const dateA = new Date(a.uploaded_at || a.created_at || 0);
            const dateB = new Date(b.uploaded_at || b.created_at || 0);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
         });
      }

      return filtered;
   }, [mediaItems, filterType, searchQuery, sortBy, sortOrder]);

   // Статистика
   const totalCount = mediaItems.length;
   const photoCount = mediaItems.filter(item => item.file_type === 'photo').length;
   const videoCount = mediaItems.filter(item => item.file_type === 'video').length;
   const publicCount = mediaItems.filter(item => item.privacy === 'public').length;
   const filteredCount = filteredAndSortedMedia().length;

   // Функция для получения иконки сортировки
   const getSortIcon = (field) => {
      if (sortBy !== field) return '↕️';
      return sortOrder === 'asc' ? '⬆️' : '⬇️';
   };

   return (
      <div className={styles.profileMedia}>
         {/* Заголовок и статистика */}
         <header className={styles.mediaHeader}>
            <div className={styles.headerContent}>
               <h1>Медиа-библиотека</h1>
               <p>Управляйте вашими фото и видео</p>
            </div>

            <div className={styles.headerStats}>
               <div className={styles.statItem}>
                  <span className={styles.statNumber}>{totalCount}</span>
                  <span className={styles.statLabel}>Всего</span>
               </div>
               <div className={styles.statItem}>
                  <span className={styles.statNumber}>{photoCount}</span>
                  <span className={styles.statLabel}>Фото</span>
               </div>
               <div className={styles.statItem}>
                  <span className={styles.statNumber}>{videoCount}</span>
                  <span className={styles.statLabel}>Видео</span>
               </div>
               <div className={styles.statItem}>
                  <span className={styles.statNumber}>{publicCount}</span>
                  <span className={styles.statLabel}>Публичные</span>
               </div>
            </div>
         </header>

         {/* Панель управления */}
         <div className={styles.controlsPanel}>
            <div className={styles.leftControls}>
               {/* Кнопка загрузки */}
               <button
                  className={styles.uploadButton}
                  onClick={handleUploadClick}
               >
                  <span className={styles.buttonIcon}>📤</span>
                  Добавить файлы
               </button>

               {/* Фильтр по типу */}
               <div className={styles.filterGroup}>
                  <button
                     className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
                     onClick={() => setFilterType('all')}
                  >
                     Все
                  </button>
                  <button
                     className={`${styles.filterButton} ${filterType === 'photo' ? styles.active : ''}`}
                     onClick={() => setFilterType('photo')}
                  >
                     Фото
                  </button>
                  <button
                     className={`${styles.filterButton} ${filterType === 'video' ? styles.active : ''}`}
                     onClick={() => setFilterType('video')}
                  >
                     Видео
                  </button>
               </div>

               {/* Поиск */}
               <div className={styles.searchContainer}>
                  <input
                     type="text"
                     placeholder="Поиск по названию..."
                     value={searchQuery}
                     onChange={handleSearchChange}
                     className={styles.searchInput}
                  />
                  <span className={styles.searchIcon}>🔍</span>
               </div>
            </div>

            <div className={styles.rightControls}>
               {/* Сортировка */}
               <div className={styles.sortGroup}>
                  <span className={styles.sortLabel}>Сортировка:</span>
                  <button
                     className={`${styles.sortButton} ${sortBy === 'uploaded_at' ? styles.active : ''}`}
                     onClick={() => handleSortChange('uploaded_at')}
                  >
                     По дате {getSortIcon('uploaded_at')}
                  </button>
                  <button
                     className={`${styles.sortButton} ${sortBy === 'original_filename' ? styles.active : ''}`}
                     onClick={() => handleSortChange('original_filename')}
                  >
                     По названию {getSortIcon('original_filename')}
                  </button>
                  <button
                     className={`${styles.sortButton} ${sortBy === 'size' ? styles.active : ''}`}
                     onClick={() => handleSortChange('size')}
                  >
                     По размеру {getSortIcon('size')}
                  </button>
               </div>
            </div>
         </div>

         {/* Информация о фильтрах */}
         {searchQuery || filterType !== 'all' ? (
            <div className={styles.filterInfo}>
               <span>
                  Показано {filteredCount} из {totalCount} файлов
                  {searchQuery && ` по запросу "${searchQuery}"`}
                  {filterType !== 'all' && `, тип: ${filterType === 'photo' ? 'фото' : 'видео'}`}
               </span>
               <button
                  className={styles.clearFiltersButton}
                  onClick={() => {
                     setSearchQuery('');
                     setFilterType('all');
                  }}
               >
                  Сбросить фильтры
               </button>
            </div>
         ) : null}

         {/* Основной контент */}
         <div className={styles.mediaContent}>
            {isLoading ? (
               <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Загрузка медиа...</p>
               </div>
            ) : error ? (
               <div className={styles.errorContainer}>
                  <div className={styles.errorIcon}>⚠️</div>
                  <h3>Ошибка загрузки</h3>
                  <p>{error}</p>
                  <button
                     className={styles.retryButton}
                     onClick={() => dispatch(fetchUserMedia())}
                  >
                     Попробовать снова
                  </button>
               </div>
            ) : filteredCount === 0 ? (
               <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🖼️</div>
                  <h3>Медиа не найдены</h3>
                  <p>
                     {searchQuery || filterType !== 'all'
                        ? 'Попробуйте изменить параметры поиска'
                        : 'Загрузите ваше первое фото или видео'}
                  </p>
                  <button
                     className={styles.uploadButtonEmpty}
                     onClick={handleUploadClick}
                  >
                     📤 Загрузить файлы
                  </button>
               </div>
            ) : (
               <div className={styles.gridView}>
                  <MediaGallery
                     media={filteredAndSortedMedia()}
                     onDeleteClick={handleDeleteClick}
                     onPrivacyChange={handlePrivacyChange}
                  />
               </div>
            )}
         </div>

         {/* Модальное окно загрузки */}
         {isUploadModalOpen && (
            <FileUploadModal
               isOpen={isUploadModalOpen}
               onClose={() => setIsUploadModalOpen(false)}
               onSuccess={() => {
                  setIsUploadModalOpen(false);
                  dispatch(fetchUserMedia());
               }}
            />
         )}

         {/* Модальное окно подтверждения удаления */}
         {isDeleteModalOpen && (
            <ConfirmationModal
               isOpen={isDeleteModalOpen}
               onClose={() => {
                  setIsDeleteModalOpen(false);
                  setMediaToDelete(null);
               }}
               onConfirm={confirmDelete}
               title="Удаление медиа"
               message={`Вы уверены, что хотите удалить "${mediaToDelete?.original_filename}"?`}
               confirmText="Удалить"
               cancelText="Отмена"
               isDanger={true}
            />
         )}
      </div>
   );
};

export default ProfileMedia;