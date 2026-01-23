// src/UI/Pages/Profile/ProfileOverview.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
   selectProfile,
   selectIsLoading,
   selectIsProfileLoaded,
   loadProfile
} from '../../../features/profileSlice';
import {
   fetchUserMedia,
   selectMediaItems,
   selectMediaLoading
} from '../../../features/mediaSlice';
import { getTrainingLevelLabel } from '../../../constants/trainingLevels';
import { getUserRoleLabel } from '../../../constants/userRoles';

// Импортируем новый компонент
import MiniMediaGallery from '../../Components/MiniMediaGallery';

import styles from './ProfileOverview.module.css';

// Компонент для главной страницы профиля
const ProfileOverview = ({ user, onSwitchToMedia }) => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   // Данные из profileSlice
   const profile = useSelector(selectProfile);
   const isLoading = useSelector(selectIsLoading);
   const isProfileLoaded = useSelector(selectIsProfileLoaded);

   // Получаем медиа из Redux
   const mediaItems = useSelector(selectMediaItems);
   const mediaLoading = useSelector(selectMediaLoading);

   // Получаем данные из профиля
   const sportSpecialization = profile?.sport_specialization || '';
   const trainingLevel = profile?.training_level || '';
   const userRole = profile?.role || '';
   const allowConnections = profile?.allow_connections !== false;
   const userName = profile?.userName || '';
   const userEmail = profile?.email || '';

   // Определяем роль из профиля
   const isTrainer = userRole === 'trainer';
   const isTrainee = userRole === 'trainee';

   // Загружаем профиль при монтировании
   useEffect(() => {
      if (!isProfileLoaded && !isLoading) {
         console.log('🟡 ProfileOverview: Загрузка профиля...');
         dispatch(loadProfile());
      }
   }, [dispatch, isProfileLoaded, isLoading]);

   // Загружаем медиа при монтировании
   useEffect(() => {
      console.log('🖼️ ProfileOverview: Проверяем медиа...');
      if (mediaItems.length === 0 && !mediaLoading) {
         console.log('🔄 Загружаем медиа...');
         dispatch(fetchUserMedia());
      }
   }, [dispatch, mediaItems.length, mediaLoading]);

   // Обработчик перехода к медиа-библиотеке
   const handleViewAllMedia = () => {
      if (onSwitchToMedia) {
         onSwitchToMedia();
      }
   };

   // Показываем загрузку
   if (isLoading && !profile) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   // Если профиль не загружен
   if (!profile && isProfileLoaded) {
      return (
         <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Профиль не найден</h2>
            <p>Пожалуйста, заполните данные профиля</p>
            <button
               className={styles.retryButton}
               onClick={() => navigate('/profile/settings')}
            >
               Перейти к настройкам
            </button>
         </div>
      );
   }

   // Функция для отображения тегов из строки через запятую
   const renderTags = (tagsString) => {
      if (!tagsString || !tagsString.trim()) return null;

      const tags = tagsString
         .split(',')
         .map(tag => tag.trim())
         .filter(tag => tag.length > 0);

      if (tags.length === 0) return null;

      return (
         <div className={styles.tagsContainer}>
            {tags.map((tag, index) => (
               <span key={index} className={styles.tagChip}>
                  {tag}
               </span>
            ))}
         </div>
      );
   };

   // Функция для отображения тегов в карточке (первые 3)
   const renderLimitedTags = (tagsString) => {
      if (!tagsString || !tagsString.trim()) return null;

      const tags = tagsString
         .split(',')
         .map(tag => tag.trim())
         .filter(tag => tag.length > 0)
         .slice(0, 3); // Показываем только первые 3 тега

      if (tags.length === 0) return null;

      return (
         <div className={styles.tagsList}>
            {tags.map((tag, index) => (
               <span key={index} className={styles.specializationBadge}>
                  {tag}
               </span>
            ))}
         </div>
      );
   };

   return (
      <div className={styles.overview}>
         <header className={styles.pageHeader}>
            <h1>Обзор профиля</h1>
            <p>Добро пожаловать в ваш личный кабинет</p>
            {userName && (
               <p className={styles.welcomeMessage}>
                  Привет, <strong>{userName}</strong>!
               </p>
            )}
         </header>

         <div className={styles.statsGrid}>
            {/* Карточка профиля */}
            <div className={styles.statCard}>
               <div className={styles.statIcon}>👤</div>
               <div className={styles.statContent}>
                  <h3>Профиль</h3>
                  <p>Управление вашими данными</p>
                  <div className={styles.profileBadges}>
                     {userRole && (
                        <span className={`${styles.roleBadge} ${styles[userRole]}`}>
                           {getUserRoleLabel(userRole)}
                        </span>
                     )}
                     {trainingLevel && (
                        <span className={styles.levelBadge}>
                           {getTrainingLevelLabel(trainingLevel)}
                        </span>
                     )}
                  </div>
               </div>
            </div>

            {/* Карточка заметок */}
            <div className={styles.statCard}>
               <div className={styles.statIcon}>📝</div>
               <div className={styles.statContent}>
                  <h3>Заметки</h3>
                  <p>Ваши персональные записи</p>
               </div>
            </div>

            {/* Карточка для тренера */}
            {isTrainer && (
               <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statContent}>
                     <h3>Подопечные</h3>
                     <p>Управление вашими спортсменами</p>
                     {sportSpecialization && renderLimitedTags(sportSpecialization)}
                  </div>
               </div>
            )}

            {/* Карточка для спортсмена */}
            {isTrainee && (
               <div className={styles.statCard}>
                  <div className={styles.statIcon}>💪</div>
                  <div className={styles.statContent}>
                     <h3>Тренировки</h3>
                     <p>Ваши задания и прогресс</p>
                     {sportSpecialization && renderLimitedTags(sportSpecialization)}
                  </div>
               </div>
            )}

            {/* Карточка настроек */}
            <div className={styles.statCard}>
               <div className={styles.statIcon}>⚙️</div>
               <div className={styles.statContent}>
                  <h3>Настройки</h3>
                  <p>Персонализация аккаунта</p>
               </div>
            </div>
         </div>

         {/* Детальная информация о профиле */}
         <div className={styles.userDetails}>
            <h3>Информация о профиле</h3>
            <div className={styles.detailsGrid}>
               {/* Роль */}
               {userRole && (
                  <div className={styles.detailItem}>
                     <label>Роль в системе:</label>
                     <span className={`${styles.detailValue} ${styles[userRole]}`}>
                        {getUserRoleLabel(userRole)}
                     </span>
                  </div>
               )}

               {/* Уровень подготовки */}
               {trainingLevel && (
                  <div className={styles.detailItem}>
                     <label>Уровень подготовки:</label>
                     <span className={styles.detailValue}>
                        {getTrainingLevelLabel(trainingLevel)}
                     </span>
                  </div>
               )}

               {/* Специализация/Интересы */}
               {sportSpecialization && (
                  <div className={styles.detailItem}>
                     <label>
                        {userRole === 'trainer' ? 'Специализация:' : 'Спортивные интересы:'}
                     </label>
                     <div className={styles.detailValue}>
                        {renderTags(sportSpecialization)}
                     </div>
                  </div>
               )}

               {/* Доступ для подключений */}
               <div className={styles.detailItem}>
                  <label>Доступен для подключений:</label>
                  <span className={styles.detailValue}>
                     {allowConnections ? '✅ Да' : '❌ Нет'}
                  </span>
               </div>

               {/* Email (если есть в профиле) */}
               {userEmail && (
                  <div className={styles.detailItem}>
                     <label>Email:</label>
                     <span className={styles.detailValue}>{userEmail}</span>
                  </div>
               )}

               {/* Дата рождения (если есть в профиле) */}
               {profile?.birthDate && (
                  <div className={styles.detailItem}>
                     <label>Дата рождения:</label>
                     <span className={styles.detailValue}>
                        {new Date(profile.birthDate).toLocaleDateString('ru-RU')}
                     </span>
                  </div>
               )}

               {/* Дата создания профиля */}
               {profile?.createdAt && (
                  <div className={styles.detailItem}>
                     <label>Дата регистрации:</label>
                     <span className={styles.detailValue}>
                        {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
                     </span>
                  </div>
               )}
            </div>
         </div>

         {/* Последние действия */}
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
               {profile?.updatedAt && (
                  <div className={styles.activityItem}>
                     <span className={styles.activityIcon}>📱</span>
                     <div className={styles.activityContent}>
                        <p>Профиль обновлен</p>
                        <span className={styles.activityTime}>
                           {new Date(profile.updatedAt).toLocaleDateString('ru-RU')}
                        </span>
                     </div>
                  </div>
               )}
               <div className={styles.activityItem}>
                  <span className={styles.activityIcon}>⚡</span>
                  <div className={styles.activityContent}>
                     <p>Готов к тренировкам</p>
                     <span className={styles.activityTime}>Всегда</span>
                  </div>
               </div>
            </div>
         </div>

         {/* ✅ НОВАЯ СЕКЦИЯ: Последние медиа */}
         <div className={styles.recentMedia}>
            <div className={styles.mediaHeader}>
               <h3>Последние медиа</h3>
               <button
                  className={styles.viewAllButton}
                  onClick={handleViewAllMedia}
               >
                  Все медиа →
               </button>
            </div>

            <MiniMediaGallery
               mediaItems={mediaItems}
               loading={mediaLoading}
               limit={6}
               onViewAll={handleViewAllMedia}
            />

            <p className={styles.mediaHint}>
               Загружайте фото и видео тренировок, чтобы отслеживать прогресс
            </p>
         </div>
      </div>
   );
};

export default ProfileOverview;