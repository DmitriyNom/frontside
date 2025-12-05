// src/UI/Pages/Profile/ProfileOverview.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
   selectIsTrainer,
   selectIsTrainee,
   selectUserTrainingLevel,
   selectUserSportSpecialization
} from '../../../features/authSlice';
import { getTrainingLevelLabel } from '../../../constants/trainingLevels';
import { getUserRoleLabel } from '../../../constants/userRoles';
import styles from './Profile.module.css';

// Компонент для главной страницы профиля
const ProfileOverview = ({ user }) => {
   const isTrainer = useSelector(selectIsTrainer);
   const isTrainee = useSelector(selectIsTrainee);
   const trainingLevel = useSelector(selectUserTrainingLevel);
   const sportSpecialization = useSelector(selectUserSportSpecialization);

   return (
      <div className={styles.overview}>
         <header className={styles.pageHeader}>
            <h1>Обзор профиля</h1>
            <p>Добро пожаловать в ваш личный кабинет</p>
         </header>

         <div className={styles.statsGrid}>
            <div className={styles.statCard}>
               <div className={styles.statIcon}>👤</div>
               <div className={styles.statContent}>
                  <h3>Профиль</h3>
                  <p>Управление вашими данными</p>
                  <div className={styles.profileBadges}>
                     <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                        {getUserRoleLabel(user.role)}
                     </span>
                     {trainingLevel && (
                        <span className={styles.levelBadge}>
                           {getTrainingLevelLabel(trainingLevel)}
                        </span>
                     )}
                  </div>
               </div>
            </div>

            <div className={styles.statCard}>
               <div className={styles.statIcon}>📝</div>
               <div className={styles.statContent}>
                  <h3>Заметки</h3>
                  <p>Ваши персональные записи</p>
               </div>
            </div>

            {isTrainer && (
               <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statContent}>
                     <h3>Подопечные</h3>
                     <p>Управление вашими спортсменами</p>
                     {sportSpecialization && (
                        <span className={styles.specializationBadge}>
                           {sportSpecialization}
                        </span>
                     )}
                  </div>
               </div>
            )}

            {isTrainee && (
               <div className={styles.statCard}>
                  <div className={styles.statIcon}>💪</div>
                  <div className={styles.statContent}>
                     <h3>Тренировки</h3>
                     <p>Ваши задания и прогресс</p>
                  </div>
               </div>
            )}

            <div className={styles.statCard}>
               <div className={styles.statIcon}>⚙️</div>
               <div className={styles.statContent}>
                  <h3>Настройки</h3>
                  <p>Персонализация аккаунта</p>
               </div>
            </div>
         </div>

         <div className={styles.userDetails}>
            <h3>Информация о профиле</h3>
            <div className={styles.detailsGrid}>
               <div className={styles.detailItem}>
                  <label>Роль в системе:</label>
                  <span className={`${styles.detailValue} ${styles[user.role]}`}>
                     {getUserRoleLabel(user.role)}
                  </span>
               </div>
               {trainingLevel && (
                  <div className={styles.detailItem}>
                     <label>Уровень подготовки:</label>
                     <span className={styles.detailValue}>
                        {getTrainingLevelLabel(trainingLevel)}
                     </span>
                  </div>
               )}
               {sportSpecialization && (
                  <div className={styles.detailItem}>
                     <label>Специализация:</label>
                     <span className={styles.detailValue}>{sportSpecialization}</span>
                  </div>
               )}
               <div className={styles.detailItem}>
                  <label>Доступен для подключений:</label>
                  <span className={styles.detailValue}>
                     {user.allow_connections ? '✅ Да' : '❌ Нет'}
                  </span>
               </div>
            </div>
         </div>

         <div className={styles.recentActivity}>
            <h3>Последние действия</h3>
            <div className={styles.activityList}>
               <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>🟢</span>
                  <div className={styles.activityContent}>
                     <p>Вы вошли в систему</p>
                     <span className={styles.activityTime}>Только что</span>
                  </div>
               </div>
               <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>📱</span>
                  <div className={styles.activityContent}>
                     <p>Профиль обновлен</p>
                     <span className={styles.activityTime}>2 часа назад</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ProfileOverview;