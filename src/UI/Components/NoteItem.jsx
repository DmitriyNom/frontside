import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteNote, updateNote } from '../../features/notesSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NoteForm from '../Forms/NoteForm';
import ConfirmationModal from './ConfirmationModal';
import NoteViewModal from './NoteViewModal';
import styles from './NoteItem.module.css';

const NoteItem = ({ note }) => {
   const dispatch = useDispatch();
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
   const [isStatusConfirmModalOpen, setIsStatusConfirmModalOpen] = useState(false);
   const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false); // 👈 Новое состояние для отслеживания процесса удаления

   const isOverdue = () => {
      if (!note.note_expiration_date || note.note_is_completed) return false;

      const now = new Date();
      const expirationDate = new Date(note.note_expiration_date);
      return expirationDate < now;
   };

   const getPriorityColor = (priority) => {
      switch (priority) {
         case 3: return styles.priorityHigh;
         case 2: return styles.priorityMedium;
         case 1: return styles.priorityLow;
         default: return styles.priorityLow;
      }
   };

   const getCardClassNames = () => {
      const baseClass = `${styles.noteCard} ${getPriorityColor(note.note_priority)} ${note.note_is_completed ? styles.completed : ''}`;

      if (isOverdue()) {
         return `${baseClass} ${styles.overdue}`;
      }

      return baseClass;
   };

   const getPriorityIcon = (priority) => {
      switch (priority) {
         case 3: return '🔴';
         case 2: return '🟡';
         case 1: return '🟢';
         default: return '🟢';
      }
   };

   const getPriorityText = (priority) => {
      switch (priority) {
         case 3: return 'Высокий';
         case 2: return 'Средний';
         case 1: return 'Низкий';
         default: return 'Низкий';
      }
   };

   const formatDate = (dateString) => {
      if (!dateString) return 'Без срока';
      try {
         const date = new Date(dateString);
         return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
         });
      } catch (error) {
         return 'Без срока';
      }
   };

   const getShortDescription = (description) => {
      if (!description || description === 'A note without description') {
         return 'Заметка без описания...';
      }

      if (description.length > 120) {
         return description.substring(0, 120) + '...';
      }

      return description;
   };

   const handleViewClick = () => {
      setIsViewModalOpen(true);
   };

   const handleEditFromView = () => {
      setIsViewModalOpen(false);
      setIsEditModalOpen(true);
   };

   const handleEdit = () => {
      setIsEditModalOpen(true);
   };

   const handleDeleteClick = () => {
      setIsDeleteConfirmModalOpen(true);
   };

   // 👇 ИЗМЕНЕННАЯ ФУНКЦИЯ - Добавлены toast-уведомления
   const handleDeleteConfirm = async () => {
      setIsDeleting(true);

      try {
         const result = await dispatch(deleteNote(note.id));

         if (result.meta.requestStatus === 'fulfilled') {
            // Успешное удаление
            toast.success(`Заметка "${note.note_name}" успешно удалена`, {
               position: "top-right",
               autoClose: 3000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
               progress: undefined,
               theme: "light",
               icon: "🗑️",
            });
         } else {
            // Ошибка удаления
            toast.error(`Не удалось удалить заметку "${note.note_name}"`, {
               position: "top-right",
               autoClose: 4000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
               progress: undefined,
               theme: "light",
               icon: "❌",
            });
         }
      } catch (error) {
         // Ошибка при выполнении операции
         toast.error('Произошла ошибка при удалении заметки', {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            icon: "⚠️",
         });
         console.error('Ошибка при удалении заметки:', error);
      } finally {
         setIsDeleting(false);
         setIsDeleteConfirmModalOpen(false);
      }
   };

   const handleStatusClick = () => {
      setIsStatusConfirmModalOpen(true);
   };

   // 👇 ОБНОВЛЕННАЯ ФУНКЦИЯ - Добавлены toast-уведомления для статуса
   const handleStatusConfirm = async () => {
      try {
         const updatedNote = {
            ...note,
            note_is_completed: !note.note_is_completed
         };

         const result = await dispatch(updateNote({ id: note.id, noteData: updatedNote }));

         if (result.meta.requestStatus === 'fulfilled') {
            const newStatus = updatedNote.note_is_completed ? 'выполнена' : 'в процессе';
            toast.success(`Заметка отмечена как ${newStatus}`, {
               position: "top-right",
               autoClose: 2500,
               hideProgressBar: true,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
               theme: "light",
               icon: updatedNote.note_is_completed ? "✅" : "⏳",
            });
         }
      } catch (error) {
         toast.error('Ошибка при изменении статуса', {
            position: "top-right",
            autoClose: 3000,
            theme: "light",
         });
      } finally {
         setIsStatusConfirmModalOpen(false);
      }
   };

   const closeEditModal = () => {
      setIsEditModalOpen(false);
   };

   const closeViewModal = () => {
      setIsViewModalOpen(false);
   };

   const closeStatusConfirmModal = () => {
      setIsStatusConfirmModalOpen(false);
   };

   const closeDeleteConfirmModal = () => {
      setIsDeleteConfirmModalOpen(false);
   };

   return (
      <>
         <div className={getCardClassNames()}>
            <div
               className={styles.clickableArea}
               onClick={handleViewClick}
               title="Нажмите для просмотра полной информации"
            >
               <div className={styles.noteHeader}>
                  <div className={styles.titleSection}>
                     <h3 className={styles.noteTitle}>
                        {note.note_name}
                        {isOverdue() && (
                           <span className={styles.overdueBadge} title="Просрочено!">
                              ⚠️
                           </span>
                        )}
                     </h3>
                     <p className={styles.noteExcerpt}>
                        {getShortDescription(note.note_description)}
                     </p>
                  </div>
                  <div className={styles.priorityBadge}>
                     <span className={styles.priorityIcon}>{getPriorityIcon(note.note_priority)}</span>
                     <span className={styles.priorityText}>{getPriorityText(note.note_priority)}</span>
                  </div>
               </div>

               <div className={styles.footer}>
                  <div className={styles.metaRow}>
                     <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>🏷️</span>
                        <span className={styles.metaText}>
                           {note.note_mark || 'Без метки'}
                        </span>
                     </div>
                     <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>📅</span>
                        <span className={`${styles.metaText} ${isOverdue() ? styles.overdueDate : ''}`}>
                           {formatDate(note.note_expiration_date)}
                           {isOverdue() && ' ⚠️'}
                        </span>
                     </div>
                  </div>

                  <div
                     className={`${styles.statusSection} ${note.note_is_completed ? styles.statusCompleted : ''} ${isOverdue() ? styles.statusOverdue : ''} ${styles.clickableStatus}`}
                     onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick();
                     }}
                     title={note.note_is_completed ? "Отменить выполнение" : isOverdue() ? "Просрочено! Отметить как выполненную" : "Отметить как выполненную"}
                  >
                     <span className={styles.statusIcon}>
                        {note.note_is_completed ? '✅' : isOverdue() ? '🚨' : '⏳'}
                     </span>
                     <div className={styles.statusContent}>
                        <span className={styles.statusText}>
                           {note.note_is_completed ? 'Задача выполнена' : isOverdue() ? 'ПРОСРОЧЕНО!' : 'Задача в процессе'}
                        </span>
                        <span className={styles.statusSubtext}>
                           {note.note_is_completed ? 'Все готово!' : isOverdue() ? 'Срочно выполните задачу!' : 'Требует внимания'}
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            <div className={styles.actions}>
               <button
                  onClick={handleEdit}
                  className={styles.editButton}
                  title="Редактировать заметку"
               >
                  <span className={styles.buttonIcon}>✏️</span>
                  <span className={styles.buttonText}>Редактировать</span>
               </button>
               <button
                  onClick={handleDeleteClick}
                  className={styles.deleteButton}
                  title="Удалить заметку"
                  disabled={isDeleting} // 👈 Блокировка кнопки во время удаления
               >
                  <span className={styles.buttonIcon}>
                     {isDeleting ? '⏳' : '🗑️'}
                  </span>
                  <span className={styles.buttonText}>
                     {isDeleting ? 'Удаление...' : 'Удалить'}
                  </span>
               </button>
            </div>
         </div>

         {/* Модальное окно редактирования */}
         {isEditModalOpen && (
            <NoteForm
               isOpen={isEditModalOpen}
               onClose={closeEditModal}
               note={note}
               isEdit={true}
            />
         )}

         {/* Модальное окно просмотра */}
         <NoteViewModal
            isOpen={isViewModalOpen}
            onClose={closeViewModal}
            onEdit={handleEditFromView}
            note={note}
         />

         {/* Модальное окно подтверждения статуса */}
         <ConfirmationModal
            isOpen={isStatusConfirmModalOpen}
            onClose={closeStatusConfirmModal}
            onConfirm={handleStatusConfirm}
            title={note.note_is_completed ? "Отменить выполнение?" : "Выполнить задачу?"}
            message={note.note_is_completed
               ? "Вы действительно хотите отметить задачу как не выполненную?"
               : "Вы действительно хотите отметить задачу как выполненную?"
            }
            confirmText="Да"
            cancelText="Нет"
            type="status"
         />

         {/* Модальное окно подтверждения удаления */}
         <ConfirmationModal
            isOpen={isDeleteConfirmModalOpen}
            onClose={closeDeleteConfirmModal}
            onConfirm={handleDeleteConfirm}
            title="Удалить заметку?"
            message={`Вы уверены, что хотите удалить заметку "${note.note_name}"? Это действие невозможно отменить.`}
            confirmText={isDeleting ? "Удаление..." : "Удалить"}
            cancelText="Отмена"
            type="delete"
            isProcessing={isDeleting} // 👈 Передаем состояние обработки в модалку
         />
      </>
   );
};

export default NoteItem;