import React from 'react';
import Modal from 'react-modal';
import styles from './NoteViewModal.module.css';

Modal.setAppElement('#root');

// В компоненте NoteViewModal добавим проверку просрочки:

const NoteViewModal = ({
   isOpen,
   onClose,
   onEdit,
   note
}) => {
   if (!note) return null;

   // 👇 НОВАЯ ФУНКЦИЯ - Проверка просрочки
   const isOverdue = () => {
      if (!note.note_expiration_date || note.note_is_completed) return false;

      const now = new Date();
      const expirationDate = new Date(note.note_expiration_date);
      return expirationDate < now;
   };

   const getPriorityIcon = (priority) => {
      switch (priority) {
         case 3: return '🔴 Высокий';
         case 2: return '🟡 Средний';
         case 1: return '🟢 Низкий';
         default: return '🟢 Низкий';
      }
   };

   const formatDate = (dateString) => {
      if (!dateString) return 'Не установлен';
      try {
         const date = new Date(dateString);
         return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
         });
      } catch (error) {
         return 'Не установлен';
      }
   };

   const handleEditClick = () => {
      onClose();
      onEdit();
   };

   return (
      <Modal
         isOpen={isOpen}
         onRequestClose={onClose}
         className={styles.modal}
         overlayClassName={styles.overlay}
         contentLabel={`Просмотр заметки: ${note.note_name}`}
      >
         <div className={styles.modalHeader}>
            <h2>
               Просмотр заметки
               {/* 👇 ИКОНКА ПРОСРОЧКИ В ЗАГОЛОВКЕ */}
               {isOverdue() && (
                  <span className={styles.overdueHeaderBadge} title="Просрочено!">
                     ⚠️ ПРОСРОЧЕНО
                  </span>
               )}
            </h2>
            <button
               className={styles.closeButton}
               onClick={onClose}
            >
               ×
            </button>
         </div>

         <div className={styles.modalContent}>
            {/* Основная информация */}
            <div className={styles.section}>
               <h3 className={styles.sectionTitle}>Основная информация</h3>
               <div className={styles.field}>
                  <span className={styles.fieldLabel}>Название:</span>
                  <span className={styles.fieldValue}>{note.note_name}</span>
               </div>
               <div className={styles.field}>
                  <span className={styles.fieldLabel}>Приоритет:</span>
                  <span className={styles.fieldValue}>
                     {getPriorityIcon(note.note_priority)}
                  </span>
               </div>
               <div className={styles.field}>
                  <span className={styles.fieldLabel}>Статус:</span>
                  <span className={`${styles.fieldValue} ${styles.status} ${note.note_is_completed ? styles.completed : isOverdue() ? styles.overdue : styles.inProgress}`}>
                     {note.note_is_completed ? '✅ Выполнена' : isOverdue() ? '🚨 ПРОСРОЧЕНО' : '⏳ В процессе'}
                  </span>
               </div>
            </div>

            {/* Полное описание */}
            <div className={styles.section}>
               <h3 className={styles.sectionTitle}>Описание</h3>
               <div className={styles.description}>
                  {note.note_description && note.note_description !== 'A note without description'
                     ? note.note_description
                     : 'Описание отсутствует'
                  }
               </div>
            </div>

            {/* Дополнительная информация */}
            <div className={styles.section}>
               <h3 className={styles.sectionTitle}>Дополнительная информация</h3>
               <div className={styles.field}>
                  <span className={styles.fieldLabel}>Метка:</span>
                  <span className={styles.fieldValue}>
                     {note.note_mark || 'Не установлена'}
                  </span>
               </div>
               <div className={styles.field}>
                  <span className={styles.fieldLabel}>Срок выполнения:</span>
                  <span className={`${styles.fieldValue} ${isOverdue() ? styles.overdueDate : ''}`}>
                     {formatDate(note.note_expiration_date)}
                     {isOverdue() && ' ⚠️ ПРОСРОЧЕНО'}
                  </span>
               </div>
               <div className={styles.field}>
                  <span className={styles.fieldLabel}>Дата создания:</span>
                  <span className={styles.fieldValue}>
                     {new Date(note.createdAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                     })}
                  </span>
               </div>
               <div className={styles.field}>
                  <span className={styles.fieldLabel}>Последнее обновление:</span>
                  <span className={styles.fieldValue}>
                     {new Date(note.updatedAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                     })}
                  </span>
               </div>
            </div>
         </div>

         <div className={styles.modalFooter}>
            <button
               className={styles.viewedButton}
               onClick={onClose}
            >
               Просмотрено
            </button>
            <button
               className={styles.editButton}
               onClick={handleEditClick}
            >
               ✏️ Редактировать
            </button>
         </div>
      </Modal>
   );
};

export default NoteViewModal;