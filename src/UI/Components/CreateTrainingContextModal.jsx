// frontend/src/UI/Components/CreateTrainingContextModal.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import Modal from 'react-modal';
import { fetchFriends } from '../../features/friendsSlice';
import api from '../../api/api';
import styles from './CreateTrainingContextModal.module.css';

Modal.setAppElement('#root');

// Доступные виды спорта
const SPORTS = [
   { value: 'hockey', label: 'Хоккей', emoji: '🏒' },
   { value: 'football', label: 'Футбол', emoji: '⚽' },
   { value: 'basketball', label: 'Баскетбол', emoji: '🏀' },
   { value: 'tennis', label: 'Теннис', emoji: '🎾' },
   { value: 'swimming', label: 'Плавание', emoji: '🏊' },
   { value: 'running', label: 'Бег', emoji: '🏃' },
   { value: 'boxing', label: 'Бокс', emoji: '🥊' },
   { value: 'gym', label: 'Тренажерный зал', emoji: '💪' }
];

const CreateTrainingContextModal = ({
   isOpen,
   onClose,
   friend,
   currentUserId,
   onSuccess
}) => {
   const dispatch = useDispatch();

   const [sport, setSport] = useState('hockey');
   const [trainerId, setTrainerId] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);

   // Защита от null значений
   if (!friend || !currentUserId) {
      return null;
   }

   // Определяем текущего пользователя
   const isCurrentUserTrainer = trainerId === currentUserId;
   const actualTrainerId = isCurrentUserTrainer ? currentUserId : friend.id;
   const actualTraineeId = isCurrentUserTrainer ? friend.id : currentUserId;

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!trainerId) {
         setError('Пожалуйста, выберите, кто будет тренером');
         return;
      }

      setLoading(true);
      setError(null);

      try {
         await api.post(`/api/contexts/friends/${friend.friendship_id}/contexts`, {
            sport,
            trainer_id: actualTrainerId,
            trainee_id: actualTraineeId
         });

         // Обновляем список друзей
         await dispatch(fetchFriends({ limit: 50 }));

         if (onSuccess) onSuccess();
         onClose();
      } catch (err) {
         console.error('Error creating training context:', err);
         setError(err.response?.data?.message || 'Ошибка создания контекста тренировки');
      } finally {
         setLoading(false);
      }
   };

   const handleRoleSelect = (trainerIsCurrentUser) => {
      setTrainerId(trainerIsCurrentUser ? currentUserId : friend.id);
   };

   return (
      <Modal
         isOpen={isOpen}
         onRequestClose={onClose}
         className={styles.modal}
         overlayClassName={styles.overlay}
      >
         <form onSubmit={handleSubmit}>
            <div className={styles.modalContent}>
               <div className={styles.header}>
                  <h2 className={styles.title}>🏒 Начать тренировки</h2>
                  <button
                     type="button"
                     className={styles.closeButton}
                     onClick={onClose}
                  >
                     ✕
                  </button>
               </div>

               <div className={styles.body}>
                  <div className={styles.friendInfo}>
                     <div className={styles.friendAvatar}>
                        {friend.userName?.charAt(0).toUpperCase() || 'U'}
                     </div>
                     <div className={styles.friendName}>
                        {friend.userName || 'Пользователь'}
                     </div>
                  </div>

                  {/* Выбор вида спорта */}
                  <div className={styles.formGroup}>
                     <label className={styles.label}>
                        <span className={styles.labelIcon}>🏆</span>
                        Вид спорта
                     </label>
                     <select value={sport} onChange={(e) => setSport(e.target.value)} className={styles.select} disabled={loading}>
                        {SPORTS.map(s => (
                           <option key={s.value} value={s.value}>
                              {s.emoji} {s.label}
                           </option>
                        ))}
                     </select>
                     <div className={styles.hint}>
                        * можно будет изменить позже
                     </div>
                  </div>

                  {/* Выбор ролей */}
                  <div className={styles.formGroup}>
                     <label className={styles.label}>
                        <span className={styles.labelIcon}>👥</span>
                        Распределение ролей
                     </label>
                     <div className={styles.roleButtons}>
                        <button
                           type="button"
                           className={`${styles.roleButton} ${trainerId === currentUserId ? styles.active : ''}`}
                           onClick={() => handleRoleSelect(true)}
                           disabled={loading}
                        >
                           <span className={styles.roleIcon}>📋</span>
                           <div className={styles.roleContent}>
                              <div className={styles.roleTitle}>Я тренер</div>
                              <div className={styles.roleDesc}>
                                 Я буду давать задания, {friend.userName || 'друг'} — выполнять
                              </div>
                           </div>
                           {trainerId === currentUserId && (
                              <span className={styles.checkmark}>✓</span>
                           )}
                        </button>

                        <button
                           type="button"
                           className={`${styles.roleButton} ${trainerId === friend.id ? styles.active : ''}`}
                           onClick={() => handleRoleSelect(false)}
                           disabled={loading}
                        >
                           <span className={styles.roleIcon}>🏃</span>
                           <div className={styles.roleContent}>
                              <div className={styles.roleTitle}>{friend.userName || 'Друг'} — тренер</div>
                              <div className={styles.roleDesc}>
                                 {friend.userName || 'Друг'} будет давать задания, я — выполнять
                              </div>
                           </div>
                           {trainerId === friend.id && (
                              <span className={styles.checkmark}>✓</span>
                           )}
                        </button>
                     </div>
                  </div>

                  {/* Ошибка */}
                  {error && (
                     <div className={styles.error}>
                        <span className={styles.errorIcon}>⚠️</span>
                        {error}
                     </div>
                  )}
               </div>

               <div className={styles.footer}>
                  <button
                     type="button"
                     className={styles.cancelButton}
                     onClick={onClose}
                     disabled={loading}
                  >
                     Отмена
                  </button>
                  <button
                     type="submit"
                     className={styles.submitButton}
                     disabled={loading || !trainerId}
                  >
                     {loading ? (
                        <>
                           <span className={styles.spinner}></span>
                           Создание...
                        </>
                     ) : (
                        '🏒 Начать тренировки'
                     )}
                  </button>
               </div>
            </div>
         </form>
      </Modal>
   );
};

export default CreateTrainingContextModal;