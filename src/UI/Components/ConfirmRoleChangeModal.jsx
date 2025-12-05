// src/UI/Components/ConfirmRoleChangeModal.jsx
import React from 'react';
import styles from './ConfirmRoleChangeModal.module.css';

const ConfirmRoleChangeModal = ({
   isOpen,
   onClose,
   onConfirm,
   currentRole,
   newRole,
   userName
}) => {
   if (!isOpen) return null;

   const roleLabels = {
      trainee: 'Спортсмен',
      trainer: 'Тренер',
      skipped: 'Пропущено'
   };

   const currentRoleLabel = roleLabels[currentRole] || currentRole;
   const newRoleLabel = roleLabels[newRole] || newRole;

   const warnings = {
      trainer: 'Вы потеряете доступ к функциям тренера: создание заданий, управление подопечными, просмотр отчетов.',
      trainee: 'Вы потеряете доступ к функциям спортсмена: получение заданий, отправка отчетов, отслеживание прогресса.'
   };

   return (
      <div className={styles.modalOverlay}>
         <div className={styles.modal}>
            <div className={styles.modalHeader}>
               <h2>⚠️ Подтверждение смены роли</h2>
               <button onClick={onClose} className={styles.closeButton}>
                  &times;
               </button>
            </div>

            <div className={styles.modalContent}>
               <p className={styles.confirmationText}>
                  <strong>{userName}</strong>, вы уверены, что хотите сменить роль с
                  <span className={`${styles.roleBadge} ${styles[currentRole]}`}>
                     {currentRoleLabel}
                  </span>
                  на
                  <span className={`${styles.roleBadge} ${styles[newRole]}`}>
                     {newRoleLabel}
                  </span>?
               </p>

               {(currentRole === 'trainer' || currentRole === 'trainee') && (
                  <div className={styles.warningSection}>
                     <div className={styles.warningIcon}>⚠️</div>
                     <div className={styles.warningContent}>
                        <h4>Внимание!</h4>
                        <p>{warnings[currentRole]}</p>
                        {newRole === 'trainee' && (
                           <p className={styles.additionalInfo}>
                              <strong>Ваша специализация будет сброшена.</strong>
                           </p>
                        )}
                        {newRole === 'trainer' && (
                           <p className={styles.additionalInfo}>
                              <strong>Уровень подготовки будет сброшен.</strong>
                           </p>
                        )}
                     </div>
                  </div>
               )}

               <div className={styles.consequences}>
                  <h4>Последствия смены роли:</h4>
                  <ul>
                     <li>Доступ к функциям изменится</li>
                     <li>Связанные данные могут быть сброшены</li>
                     <li>Настройки могут потребовать обновления</li>
                     <li>Возможна потеря доступа к некоторым разделам</li>
                  </ul>
               </div>
            </div>

            <div className={styles.modalActions}>
               <button
                  onClick={onClose}
                  className={styles.cancelButton}
               >
                  Отмена
               </button>
               <button
                  onClick={onConfirm}
                  className={styles.confirmButton}
               >
                  Да, сменить роль
               </button>
            </div>

            <div className={styles.modalFooter}>
               <p className={styles.footerNote}>
                  Вы всегда сможете вернуться к настройкам профиля и изменить роль позже.
               </p>
            </div>
         </div>
      </div>
   );
};

export default ConfirmRoleChangeModal;