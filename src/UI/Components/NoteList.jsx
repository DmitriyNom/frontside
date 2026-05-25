import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   getAllNotes,
   selectNotes,
   selectLoading,
   selectError,
   selectCurrentPage,
   selectTotalPages,
   selectNotesSortBy,
   selectNotesSortOrder,
   setPage,
   setNotesSort
} from '../../features/notesSlice';
import NoteItem from './NoteItem';
import styles from './NoteList.module.css';

// Конфиг для сортировки - 5 кнопок (как в TaskList)
const SORT_OPTIONS = [
   { value: 'createdAt', label: 'По дате создания', icon: '🆕' },
   { value: 'note_name', label: 'По названию', icon: '📝' },
   { value: 'note_priority', label: 'По приоритету', icon: '🎯' },
   { value: 'note_expiration_date', label: 'По дате выполнения', icon: '📅' }, // ← ИСПРАВЛЕНО
   { value: 'status', label: 'По статусу', icon: '🔄' }
];

const NoteList = () => {
   const dispatch = useDispatch();
   const notes = useSelector(selectNotes);
   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);
   const currentPage = useSelector(selectCurrentPage);
   const totalPages = useSelector(selectTotalPages);
   const sortBy = useSelector(selectNotesSortBy);
   const sortOrder = useSelector(selectNotesSortOrder);

   // Загрузка заметок с сортировкой
   useEffect(() => {
      dispatch(getAllNotes({ page: currentPage, limit: 10, sortBy, sortOrder }));
   }, [dispatch, currentPage, sortBy, sortOrder]);

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
         dispatch(setPage(newPage));
      }
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

      dispatch(setNotesSort({ sortBy: newSortBy, sortOrder: newSortOrder }));
   };

   // Получение иконки для кнопки сортировки
   const getSortIcon = (sortValue) => {
      if (sortBy !== sortValue) return '↕️';
      return sortOrder === 'asc' ? '⬆️' : '⬇️';
   };

   // 🔧 ИСПРАВЛЕНИЕ: спиннер ТОЛЬКО при первой загрузке (когда заметок ещё нет)
   if (loading && notes.length === 0) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загружаем ваши заметки...</p>
         </div>
      );
   }

   if (error) {
      return (
         <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button
               className={styles.retryButton}
               onClick={() => dispatch(getAllNotes({ page: currentPage, limit: 10, sortBy, sortOrder }))}
            >
               Попробовать снова
            </button>
         </div>
      );
   }

   return (
      <div className={styles.noteList}>
         <header className={styles.header}>
            <div className={styles.headerContent}>
               <h2>Ваши заметки</h2>
               <p>Всего заметок: {notes.length}</p>
            </div>
         </header>

         {/* Панель сортировки (как в TaskList) */}
         <div className={styles.sortPanel}>
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

         {notes.length === 0 ? (
            <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>📝</div>
               <h3>Пока нет заметок</h3>
               <p>Создайте первую заметку, чтобы начать работу</p>
            </div>
         ) : (
            <>
               <div className={styles.notesGrid}>
                  {notes.map(note => (
                     <NoteItem key={note.id} note={note} />
                  ))}
               </div>

               {totalPages > 1 && (
                  <div className={styles.pagination}>
                     <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${styles.pageButton} ${styles.prevButton}`}
                     >
                        <span>←</span>
                        Предыдущая
                     </button>

                     <div className={styles.pageInfo}>
                        <span className={styles.currentPage}>{currentPage}</span>
                        <span className={styles.pageSeparator}>из</span>
                        <span className={styles.totalPages}>{totalPages}</span>
                     </div>

                     <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`${styles.pageButton} ${styles.nextButton}`}
                     >
                        Следующая
                        <span>→</span>
                     </button>
                  </div>
               )}
            </>
         )}
      </div>
   );
};

export default NoteList;