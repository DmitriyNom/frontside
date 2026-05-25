// src/UI/Pages/Profile/ProfileMedia.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
   fetchUserMedia,
   deleteMedia,
   updateMediaPrivacy,
   selectMediaItems,
   selectMediaTotal,
   selectMediaLoading,
   selectMediaError,
   selectMediaSortBy,
   selectMediaSortOrder,
   selectMediaLimit,
   selectMediaOffset,
   setMediaSort,
   setMediaPage,
   resetMediaFilters
} from '../../../features/mediaSlice';
import MediaGallery from '../../Components/MediaGallery';
import FileUploadModal from '../../Components/FileUploadModal';
import ConfirmationModal from '../../Components/ConfirmationModal';
import styles from './ProfileMedia.module.css';

// Конфиг для сортировки - 4 кнопки (как в TaskList)
const SORT_OPTIONS = [
   { value: 'created_at', label: 'По дате загрузки', icon: '🆕' },
   { value: 'original_filename', label: 'По названию', icon: '📝' },
   { value: 'file_type', label: 'По типу', icon: '🎯' },
   { value: 'size', label: 'По размеру', icon: '💾' }
];

// Фильтр по типу (заменяет статусы в TaskList)
const TYPE_FILTERS = [
   { value: null, label: 'Все', icon: '📋' },
   { value: 'photo', label: 'Фото', icon: '🖼️' },
   { value: 'video', label: 'Видео', icon: '🎥' }
];

const ProfileMedia = () => {
   const dispatch = useDispatch();

   // Получаем данные из Redux
   const mediaItems = useSelector(selectMediaItems);
   const total = useSelector(selectMediaTotal);
   const isLoading = useSelector(selectMediaLoading);
   const error = useSelector(selectMediaError);
   const sortBy = useSelector(selectMediaSortBy);
   const sortOrder = useSelector(selectMediaSortOrder);
   const limit = useSelector(selectMediaLimit);
   const offset = useSelector(selectMediaOffset);

   // Локальное состояние
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [mediaToDelete, setMediaToDelete] = useState(null);
   const [localTypeFilter, setLocalTypeFilter] = useState(null);
   const [searchQuery, setSearchQuery] = useState('');

   // Загрузка медиа с параметрами
   const loadMedia = useCallback(async () => {
      await dispatch(fetchUserMedia({
         sortBy,
         sortOrder,
         limit,
         offset
      }));
   }, [dispatch, sortBy, sortOrder, limit, offset]);

   // Загрузка при монтировании и изменении параметров
   useEffect(() => {
      loadMedia();
   }, [loadMedia]);

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

   // Обработчик сортировки (как в TaskList)
   const handleSortChange = (newSortBy) => {
      let newSortOrder = sortOrder;

      if (sortBy === newSortBy) {
         // Если та же кнопка - меняем направление
         newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
         // Если другая кнопка - сбрасываем на desc (новые сверху)
         newSortOrder = 'desc';
      }

      dispatch(setMediaSort({ sortBy: newSortBy, sortOrder: newSortOrder }));
   };

   // Получение иконки для кнопки сортировки
   const getSortIcon = (sortByValue) => {
      if (sortBy !== sortByValue) return '↕️';
      return sortOrder === 'asc' ? '⬆️' : '⬇️';
   };

   // Сброс фильтров
   const handleResetFilters = () => {
      setLocalTypeFilter(null);
      setSearchQuery('');
      dispatch(resetMediaFilters());
   };

   // Пагинация
   const handleNextPage = () => {
      if (offset + limit < total) {
         const newPage = Math.floor(offset / limit) + 1;
         dispatch(setMediaPage(newPage));
      }
   };

   const handlePrevPage = () => {
      if (offset - limit >= 0) {
         const newPage = Math.floor(offset / limit) - 1;
         dispatch(setMediaPage(newPage));
      }
   };

   // Текущая страница
   const currentPage = Math.floor(offset / limit) + 1;
   const totalPages = Math.ceil(total / limit);

   // Рендер статистики
   const renderStats = () => {
      // Подсчитываем статистику из загруженных медиа (не точная, но для UI)
      const photoCount = mediaItems.filter(item => item.file_type === 'photo').length;
      const videoCount = mediaItems.filter(item => item.file_type === 'video').length;
      const publicCount = mediaItems.filter(item => item.privacy === 'public').length;

      return (
         <div className={styles.statsContainer}>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>📁</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{total}</span>
                  <span className={styles.statLabel}>Всего</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>🖼️</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{photoCount}</span>
                  <span className={styles.statLabel}>Фото</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>🎥</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{videoCount}</span>
                  <span className={styles.statLabel}>Видео</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>🌍</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{publicCount}</span>
                  <span className={styles.statLabel}>Публичные</span>
               </div>
            </div>
         </div>
      );
   };

   // Рендер фильтров и сортировки
   const renderFilters = () => {
      return (
         <div className={styles.filtersContainer}>
            {/* Фильтры по типу (вместо статусов в TaskList) */}
            <div className={styles.typeFilters}>
               {TYPE_FILTERS.map(filter => (
                  <button
                     key={filter.value || 'all'}
                     className={`${styles.typeButton} ${localTypeFilter === filter.value ? styles.active : ''}`}
                     onClick={() => setLocalTypeFilter(filter.value)}
                  >
                     {filter.icon} {filter.label}
                  </button>
               ))}

               {(localTypeFilter !== null || searchQuery) && (
                  <button className={styles.resetButton} onClick={handleResetFilters}>
                     🔄 Сбросить
                  </button>
               )}
            </div>

            {/* Нижняя строка: поиск + сортировка */}
            <div className={styles.bottomBar}>
               {/* Поиск */}
               <div className={styles.searchContainer}>
                  <input
                     type="text"
                     placeholder="Поиск по названию..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className={styles.searchInput}
                  />
                  <span className={styles.searchIcon}>🔍</span>
               </div>

               {/* Блок сортировки - 4 кнопки (как в TaskList) */}
               <div className={styles.sortGroup}>
                  <span className={styles.sortLabel}>Сортировка:</span>
                  {SORT_OPTIONS.map(option => (
                     <button
                        key={option.value}
                        className={`${styles.sortButton} ${sortBy === option.value ? styles.active : ''}`}
                        onClick={() => handleSortChange(option.value)}
                     >
                        {option.icon} {option.label} {getSortIcon(option.value)}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      );
   };

   // Фильтрация медиа на клиенте (только по типу и поиску, сортировка на бэкенде)
   const getFilteredMedia = () => {
      let filtered = [...mediaItems];

      // Фильтр по типу (клиентский, быстро)
      if (localTypeFilter) {
         filtered = filtered.filter(item => item.file_type === localTypeFilter);
      }

      // Фильтр по поиску (клиентский, мгновенный)
      if (searchQuery.trim()) {
         const query = searchQuery.toLowerCase().trim();
         filtered = filtered.filter(item =>
            item.original_filename?.toLowerCase().includes(query)
         );
      }

      return filtered;
   };

   const filteredMedia = getFilteredMedia();
   const hasActiveFilters = localTypeFilter !== null || searchQuery.trim() !== '';

   // Рендер списка медиа
   const renderMediaList = () => {
      if (isLoading && mediaItems.length === 0) {
         return (
            <div className={styles.loadingContainer}>
               <div className={styles.spinner} />
               <p>Загрузка медиа...</p>
            </div>
         );
      }

      if (error) {
         return (
            <div className={styles.errorContainer}>
               <span className={styles.errorIcon}>⚠️</span>
               <p>{error}</p>
               <button onClick={loadMedia} className={styles.retryButton}>
                  Повторить
               </button>
            </div>
         );
      }

      if (filteredMedia.length === 0) {
         return (
            <div className={styles.emptyContainer}>
               <span className={styles.emptyIcon}>🖼️</span>
               <p>
                  {hasActiveFilters
                     ? 'Медиа не найдены по заданным критериям'
                     : 'Медиа пока нет'}
               </p>
               {!hasActiveFilters && (
                  <button
                     className={styles.uploadButtonEmpty}
                     onClick={handleUploadClick}
                  >
                     📤 Загрузить файлы
                  </button>
               )}
               {hasActiveFilters && (
                  <button className={styles.resetButtonLarge} onClick={handleResetFilters}>
                     Сбросить фильтры
                  </button>
               )}
            </div>
         );
      }

      return (
         <>
            <div className={styles.mediaGrid}>
               <MediaGallery
                  media={filteredMedia}
                  onDeleteClick={handleDeleteClick}
                  onPrivacyChange={handlePrivacyChange}
               />
            </div>
         </>
      );
   };

   // Рендер пагинации (как в TaskList)
   const renderPagination = () => {
      if (total <= limit) return null;

      return (
         <div className={styles.pagination}>
            <button
               onClick={handlePrevPage}
               disabled={offset === 0}
               className={styles.pageButton}
            >
               ◀ Назад
            </button>
            <span className={styles.pageInfo}>
               Страница {currentPage} из {totalPages}
            </span>
            <button
               onClick={handleNextPage}
               disabled={offset + limit >= total}
               className={styles.pageButton}
            >
               Вперед ▶
            </button>
         </div>
      );
   };

   return (
      <div className={styles.profileMedia}>
         {/* Заголовок и статистика */}
         <header className={styles.mediaHeader}>
            <div className={styles.headerContent}>
               <h1>Медиа-библиотека</h1>
               <p>Управляйте вашими фото и видео</p>
            </div>
            <button
               className={styles.uploadButtonHeader}
               onClick={handleUploadClick}
            >
               <span className={styles.buttonIcon}>📤</span>
               Добавить файлы
            </button>
         </header>

         {renderStats()}
         {renderFilters()}

         {/* Информация о фильтрах */}
         {hasActiveFilters && (
            <div className={styles.filterInfo}>
               <span>
                  Найдено {filteredMedia.length} из {total} файлов
                  {searchQuery && ` по запросу "${searchQuery}"`}
                  {localTypeFilter && `, тип: ${localTypeFilter === 'photo' ? 'фото' : 'видео'}`}
               </span>
               <button
                  className={styles.clearFiltersButton}
                  onClick={handleResetFilters}
               >
                  Очистить фильтры
               </button>
            </div>
         )}

         {/* Основной контент */}
         <div className={styles.mediaContent}>
            {renderMediaList()}
         </div>

         {renderPagination()}

         {/* Модальное окно загрузки */}
         {isUploadModalOpen && (
            <FileUploadModal
               isOpen={isUploadModalOpen}
               onClose={() => setIsUploadModalOpen(false)}
               onSuccess={() => {
                  setIsUploadModalOpen(false);
                  loadMedia();
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