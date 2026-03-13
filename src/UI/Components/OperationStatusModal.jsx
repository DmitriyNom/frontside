import React, { useEffect } from 'react';
import styles from './OperationStatusModal.module.css';

const OperationStatusModal = ({
   isOpen,
   onClose,
   status = 'idle',
   title = '',
   message = '',
   progress = 0,
   autoCloseDelay = 0,
   onAutoClose,
   type = 'default'
}) => {
   console.log('🎯 OperationStatusModal: получены пропсы', {
      isOpen,
      status,
      title,
      message,
      progress,
      autoCloseDelay
   });

   // Автозакрытие через useEffect
   useEffect(() => {
      if (isOpen && (status === 'success' || status === 'error') && autoCloseDelay > 0) {
         console.log('⏰ OperationStatusModal: установлен таймер автозакрытия', autoCloseDelay, 'ms');

         const timer = setTimeout(() => {
            console.log('🕐 OperationStatusModal: таймер сработал');
            onClose?.();
            onAutoClose?.();
         }, autoCloseDelay);

         return () => {
            console.log('🧹 OperationStatusModal: очистка таймера автозакрытия');
            clearTimeout(timer);
         };
      }
   }, [isOpen, status, autoCloseDelay, onClose, onAutoClose]);

   // Если модалка не открыта - не рендерим
   if (!isOpen) {
      console.log('🚫 OperationStatusModal: не монтируем (isOpen false)');
      return null;
   }

   console.log('🎨 OperationStatusModal: рендеринг компонента', {
      isOpen,
      status,
      title
   });

   const getStatusIcon = () => {
      switch (status) {
         case 'loading':
            return (
               <div className={styles.spinnerContainer}>
                  <div className={styles.spinner}></div>
               </div>
            );
         case 'success':
            return (
               <div className={styles.successIcon}>
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                     <circle cx="30" cy="30" r="28" stroke="#2ecc71" strokeWidth="4" />
                     <path d="M20 30 L27 37 L40 23" stroke="#2ecc71" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
               </div>
            );
         case 'error':
            return (
               <div className={styles.errorIcon}>
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                     <circle cx="30" cy="30" r="28" stroke="#e74c3c" strokeWidth="4" />
                     <path d="M20 20 L40 40 M40 20 L20 40" stroke="#e74c3c" strokeWidth="4" strokeLinecap="round" />
                  </svg>
               </div>
            );
         default:
            return (
               <div className={styles.infoIcon}>
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                     <circle cx="30" cy="30" r="28" stroke="#3498db" strokeWidth="4" />
                     <path d="M30 20 V30 M30 35 V40" stroke="#3498db" strokeWidth="4" strokeLinecap="round" />
                     <circle cx="30" cy="45" r="2" fill="#3498db" />
                  </svg>
               </div>
            );
      }
   };

   const handleClose = () => {
      console.log('🖱️ OperationStatusModal: handleClose вызван', { status });

      if (status !== 'loading') {
         console.log('✅ OperationStatusModal: закрытие разрешено');
         onClose?.();
      } else {
         console.log('⏸️ OperationStatusModal: закрытие заблокировано (loading)');
      }
   };

   return (
      <div className={`${styles.modalOverlay} ${styles.show}`}>
         <div className={styles.modalContent}>
            {/* Статусная иконка */}
            <div className={styles.statusIcon}>
               {getStatusIcon()}
            </div>

            {/* Заголовок и сообщение */}
            <div className={styles.statusContent}>
               <h3 className={styles.statusTitle}>
                  {title || (status === 'loading' ? 'Выполняется...' :
                     status === 'success' ? 'Готово!' :
                        status === 'error' ? 'Ошибка' : 'Информация')}
               </h3>
               <p className={styles.statusMessage}>
                  {message || (status === 'loading' ? 'Пожалуйста, подождите' :
                     status === 'success' ? 'Операция выполнена успешно' :
                        status === 'error' ? 'Не удалось выполнить операцию' : '')}
               </p>
            </div>

            {/* Прогресс-бар для загрузки */}
            {status === 'loading' && progress > 0 && (
               <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                     <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                     />
                  </div>
                  <span className={styles.progressText}>
                     {progress}%
                  </span>
               </div>
            )}

            {/* Кнопка закрытия */}
            <div className={styles.modalActions}>
               <button
                  onClick={handleClose}
                  disabled={status === 'loading'}
                  className={styles.closeButton}
               >
                  {status === 'loading' ? 'Загрузка...' : 'Закрыть'}
               </button>
            </div>
         </div>
      </div>
   );
};

export default OperationStatusModal;