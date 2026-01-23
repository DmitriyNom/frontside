// src/UI/Pages/MediaLibraryPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   fetchUserMedia,
   clearMediaError,
} from '../../features/mediaSlice';
import MediaGallery from '../Components/MediaGallery';
import FileUploadModal from '../Components/FileUploadModal';
import styles from './MediaLibrary.module.css';

const MediaLibraryPage = () => {
   const dispatch = useDispatch();
   const { items, isLoading, error } = useSelector((state) => state.media);
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

   // Загружаем медиа при монтировании
   useEffect(() => {
      dispatch(fetchUserMedia());
   }, [dispatch]);

   // Очистка ошибок
   useEffect(() => {
      if (error) {
         const timer = setTimeout(() => dispatch(clearMediaError()), 5000);
         return () => clearTimeout(timer);
      }
   }, [error, dispatch]);

   const handleUploadSuccess = () => {
      setIsUploadModalOpen(false);
      // Можно автоматически обновить список или положиться на socket/паузу
   };

   return (
      <div className={styles.container}>
         {/* Шапка страницы с кнопкой добавления */}
         <div className={styles.header}>
            <h1>Медиа-библиотека</h1>
            <button
               className={styles.uploadButton}
               onClick={() => setIsUploadModalOpen(true)}
            >
               + Добавить файлы
            </button>
         </div>

         {/* Блок ошибок */}
         {error && (
            <div className={styles.errorAlert}>
               Ошибка: {error}
               <button onClick={() => dispatch(clearMediaError())}>×</button>
            </div>
         )}

         {/* Основной контент - галерея */}
         <div className={styles.content}>
            {isLoading ? (
               <div className={styles.loading}>Загрузка медиа...</div>
            ) : items.length > 0 ? (
               <MediaGallery items={items} />
            ) : (
               <div className={styles.emptyState}>
                  <p>У вас пока нет загруженных файлов.</p>
                  <button
                     className={styles.emptyUploadButton}
                     onClick={() => setIsUploadModalOpen(true)}
                  >
                     Загрузить первый файл
                  </button>
               </div>
            )}
         </div>

         {/* Модальное окно загрузки */}
         {isUploadModalOpen && (
            <FileUploadModal
               isOpen={isUploadModalOpen}
               onClose={() => setIsUploadModalOpen(false)}
               onSuccess={handleUploadSuccess}
            />
         )}
      </div>
   );
};

export default MediaLibraryPage;