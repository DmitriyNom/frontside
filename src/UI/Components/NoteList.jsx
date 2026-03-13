import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllNotes, selectNotes, selectLoading, selectError, selectCurrentPage, selectTotalPages, setPage } from '../../features/notesSlice';
import NoteItem from './NoteItem';
import styles from './NoteList.module.css';

const NoteList = () => {
   const dispatch = useDispatch();
   const notes = useSelector(selectNotes);
   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);
   const currentPage = useSelector(selectCurrentPage);
   const totalPages = useSelector(selectTotalPages);

   useEffect(() => {
      dispatch(getAllNotes({ page: currentPage, limit: 10 }));
   }, [dispatch, currentPage]);

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
         dispatch(setPage(newPage));
      }
   };

   if (loading) {
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
               onClick={() => dispatch(getAllNotes({ page: currentPage, limit: 10 }))}
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