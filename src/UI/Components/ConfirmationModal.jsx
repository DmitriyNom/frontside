import React from 'react';
import Modal from 'react-modal';
import styles from './ConfirmationModal.module.css';

Modal.setAppElement('#root');

const ConfirmationModal = ({
   isOpen,
   onClose,
   onConfirm,
   title,
   message,
   confirmText = "Да",
   cancelText = "Нет",
   type = "status" // 👈 Новый пропс для типа модалки
}) => {
   // 👇 ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ИКОНКИ ПО ТИПУ
   const getIcon = () => {
      switch (type) {
         case 'delete':
            return '🗑️';
         case 'status':
         default:
            return '❓';
      }
   };

   // 👇 ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ЦВЕТА КНОПКИ ПОДТВЕРЖДЕНИЯ
   const getConfirmButtonClass = () => {
      switch (type) {
         case 'delete':
            return styles.confirmButtonDelete;
         case 'status':
         default:
            return styles.confirmButtonStatus;
      }
   };

   return (
      <Modal
         isOpen={isOpen}
         onRequestClose={onClose}
         className={styles.modal}
         overlayClassName={styles.overlay}
      >
         <div className={styles.modalContent}>
            {/* 👇 ИКОНКА В ЗАВИСИМОСТИ ОТ ТИПА */}
            <div className={styles.iconContainer}>
               <span className={styles.modalIcon}>{getIcon()}</span>
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.message}>{message}</p>

            <div className={styles.actions}>
               <button
                  className={styles.cancelButton}
                  onClick={onClose}
               >
                  {cancelText}
               </button>
               <button
                  className={`${styles.confirmButton} ${getConfirmButtonClass()}`}
                  onClick={onConfirm}
               >
                  {confirmText}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default ConfirmationModal;