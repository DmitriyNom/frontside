// src/UI/Components/ConnectionsList.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   selectTrainees,
   selectTrainers,
   selectTraineesLoading,
   selectTrainersLoading,
   removeConnection,
   // fetchUserConnections
} from '../../features/connectionsSlice';
import { getAvatarUrl } from '../../api/api';
import styles from './ConnectionsList.module.css';

const ConnectionsList = ({ userRole }) => {
   const dispatch = useDispatch();

   // 🔥 ИСПРАВЛЕНИЕ: Поддержка разных форматов роли (русский/английский)
   const isTrainer = userRole === 'тренер' || userRole === 'trainer';

   // Для отладки (можно удалить после проверки)
   console.log('🎯 ConnectionsList:', {
      userRole,
      isTrainer,
      expected: isTrainer ? '👥 Должен показывать ПОДОПЕЧНЫХ' : '👥 Должен показывать ТРЕНЕРОВ'
   });

   // Подключаемся напрямую к Redux
   const trainees = useSelector(selectTrainees);
   const trainers = useSelector(selectTrainers);
   const loadingTrainees = useSelector(selectTraineesLoading);
   const loadingTrainers = useSelector(selectTrainersLoading);

   // 🔥 ДОБАВЛЕНО: Логирование данных из Redux
   useEffect(() => {
      console.log('📊 Данные из Redux:', {
         traineesCount: trainees?.length || 0,
         trainersCount: trainers?.length || 0,
         trainees: trainees,
         trainers: trainers
      });
   }, [trainees, trainers]);

   // Определяем, какой список показывать
   const connections = isTrainer ? trainees : trainers;
   const loading = isTrainer ? loadingTrainees : loadingTrainers;
   const emptyMessage = isTrainer
      ? 'У вас пока нет подопечных'
      : 'У вас пока нет тренеров';
   const title = isTrainer ? 'Мои подопечные' : 'Мои тренеры';

   // 🔥 ДОБАВЛЕНО: Защита от undefined
   const safeConnections = Array.isArray(connections) ? connections : [];

   // Функция для обработки удаления связи
   const handleRemove = (userId, userName) => {
      if (window.confirm(`Вы уверены, что хотите удалить связь с ${userName}?`)) {
         dispatch(removeConnection(userId));
      }
   };

   // Обработчик кликов для предотвращения submit формы
   const handleButtonClick = (callback, e) => {
      e.preventDefault();
      e.stopPropagation();
      if (callback && typeof callback === 'function') {
         callback();
      }
   };

   // Рендер карточки пользователя
   const renderUserCard = (user) => {
      // 🔥 ИСПРАВЛЕНИЕ: Более надежное извлечение данных
      const userInfo = user?.trainee || user?.trainer || user || {};
      const userId = userInfo.id;
      const userName = userInfo.userName || userInfo.name || 'Без имени';
      const userEmail = userInfo.email || '';
      const userAvatar = userInfo.userAvatar;
      const userSpecialization = userInfo.sport_specialization;
      const userLevel = userInfo.training_level;

      // Если нет userId, не рендерим карточку
      if (!userId) return null;

      return (
         <div key={userId} className={styles.userCard}>
            <div className={styles.userInfo}>
               <div className={styles.avatarContainer}>
                  {userAvatar ? (
                     <img
                        src={getAvatarUrl(userAvatar)}
                        alt={userName}
                        className={styles.avatar}
                        onError={(e) => {
                           e.target.style.display = 'none';
                           e.target.nextElementSibling.style.display = 'flex';
                        }}
                     />
                  ) : null}
                  <div
                     className={styles.avatarFallback}
                     style={{ display: userAvatar ? 'none' : 'flex' }}
                  >
                     {userName.charAt(0).toUpperCase()}
                  </div>
               </div>

               <div className={styles.userDetails}>
                  <h4 className={styles.userName}>{userName}</h4>
                  <p className={styles.userEmail}>{userEmail}</p>

                  {isTrainer ? (
                     userLevel ? (
                        <div className={styles.userBadge}>
                           <span className={styles.badgeIcon}>📊</span>
                           Уровень: {userLevel}
                        </div>
                     ) : null
                  ) : (
                     userSpecialization ? (
                        <div className={styles.userBadge}>
                           <span className={styles.badgeIcon}>🎯</span>
                           Специализация: {userSpecialization}
                        </div>
                     ) : null
                  )}

                  {/* Дополнительная информация, если есть */}
                  {userInfo.sport_goals && (
                     <div className={styles.userGoals}>
                        <span className={styles.goalsIcon}>🏆</span>
                        Цели: {userInfo.sport_goals}
                     </div>
                  )}
               </div>
            </div>

            <div className={styles.actions}>
               <button
                  type="button"
                  className={styles.messageButton}
                  onClick={(e) => handleButtonClick(() => alert('Функция сообщений в разработке'), e)}
                  title="Написать сообщение"
               >
                  ✉️ Написать
               </button>

               <button
                  type="button"
                  className={styles.removeButton}
                  onClick={(e) => handleButtonClick(() => handleRemove(userId, userName), e)}
                  title="Удалить связь"
               >
                  🗑️ Удалить
               </button>
            </div>
         </div>
      );
   };

   // Состояние загрузки
   if (loading) {
      return (
         <div className={styles.container}>
            <div className={styles.header}>
               <h3 className={styles.title}>{title}</h3>
            </div>

            <div className={styles.loadingState}>
               <div className={styles.spinner}></div>
               <p>Загрузка данных...</p>
            </div>
         </div>
      );
   }

   // Состояние: нет связей
   if (safeConnections.length === 0) {
      return (
         <div className={styles.container}>
            <div className={styles.header}>
               <h3 className={styles.title}>{title}</h3>
            </div>

            <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>👥</div>
               <h4>{emptyMessage}</h4>
               <p>
                  {isTrainer
                     ? 'Подопечные появятся здесь после принятия их запросов на подключение'
                     : 'Тренеры появятся здесь после принятия ваших запросов на подключение'
                  }
               </p>
            </div>
         </div>
      );
   }

   // Основной вид: есть связи
   return (
      <div className={styles.container}>
         <div className={styles.header}>
            <h3 className={styles.title}>
               {title} ({safeConnections.length})
            </h3>
         </div>

         <div className={styles.connectionsList}>
            {safeConnections.map(renderUserCard)}
         </div>

         <div className={styles.footer}>
            <p className={styles.footerText}>
               Всего {safeConnections.length} {isTrainer ? 'подопечных' : 'тренеров'}
            </p>
         </div>
      </div>
   );
};

export default ConnectionsList;