// frontend/src/UI/Pages/Profile/ProfileOverview.jsx
import React, { useEffect, useMemo } from 'react';
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
   selectMediaLoading,
   selectMediaError,
   selectShouldFetchMedia,
   selectIsInitialMediaLoadComplete,
   clearMediaError
} from '../../../features/mediaSlice';
import {
   fetchFriends,
   selectFriends,
   selectFriendsLoading
} from '../../../features/friendsSlice';
import { getTrainingLevelLabel } from '../../../constants/trainingLevels';
import { getUserRoleLabel } from '../../../constants/userRoles';
import MiniMediaGallery from '../../Components/MiniMediaGallery';
import commonStyles from '../../../styles/friends-common.module.css';
import styles from './ProfileOverview.module.css';

const ProfileOverview = ({ user: propUser, onSwitchToMedia }) => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const profile = useSelector(selectProfile);
   const isLoading = useSelector(selectIsLoading);
   const isProfileLoaded = useSelector(selectIsProfileLoaded);
   const mediaItems = useSelector(selectMediaItems);
   const mediaLoading = useSelector(selectMediaLoading);
   const mediaError = useSelector(selectMediaError);
   const shouldFetchMedia = useSelector(selectShouldFetchMedia);
   const isInitialMediaLoadComplete = useSelector(selectIsInitialMediaLoadComplete);

   // Друзья
   const friends = useSelector(selectFriends);
   const friendsLoading = useSelector(selectFriendsLoading);

   const userData = useMemo(() => propUser || profile, [propUser, profile]);

   // Загрузка профиля
   useEffect(() => {
      if (!propUser && !profile && !isLoading && !isProfileLoaded) {
         dispatch(loadProfile());
      }
   }, [dispatch, propUser, profile, isLoading, isProfileLoaded]);

   // Загрузка друзей
   useEffect(() => {
      if (!friendsLoading.friends && friends.length === 0) {
         dispatch(fetchFriends({ limit: 100 }));
      }
   }, [dispatch, friendsLoading.friends, friends.length]);

   // Загрузка медиа
   useEffect(() => {
      if (shouldFetchMedia) {
         dispatch(fetchUserMedia());
      }
   }, [dispatch, shouldFetchMedia]);

   useEffect(() => {
      return () => {
         dispatch(clearMediaError());
      };
   }, [dispatch]);

   const handleViewAllMedia = () => {
      if (onSwitchToMedia) {
         onSwitchToMedia();
      } else {
         navigate('/media');
      }
   };

   const handleRetryMedia = () => {
      dispatch(clearMediaError());
      dispatch(fetchUserMedia());
   };

   // Реальная статистика (с проверкой, что friends — массив)
   const stats = {
      friendsCount: Array.isArray(friends) ? friends.length : 0,
      mediaCount: Array.isArray(mediaItems) ? mediaItems.length : 0,
   };

   // Функция для безопасного форматирования даты
   const formatDate = (dateString) => {
      if (!dateString) return '—';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('ru-RU', {
         day: 'numeric',
         month: 'long',
         year: 'numeric'
      });
   };

   const formatMonthYear = (dateString) => {
      if (!dateString) return '—';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('ru-RU', {
         month: 'long',
         year: 'numeric'
      });
   };

   // Показываем загрузку, если загружаются друзья или профиль, и нет данных
   const isLoadingComplete = isLoading || friendsLoading.friends;
   const hasNoData = !userData && !profile;

   if (isLoadingComplete && hasNoData) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   if (!userData && !profile && isProfileLoaded) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.emptyIcon}>⚠️</div>
            <h4>Профиль не найден</h4>
            <button
               className={commonStyles.textButton}
               onClick={() => navigate('/profile/settings')}
            >
               Перейти к настройкам
            </button>
         </div>
      );
   }

   // Если нет userData, но есть profile — используем profile
   const displayData = userData || profile;
   if (!displayData) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.spinner}></div>
            <p>Проверка профиля...</p>
         </div>
      );
   }

   const renderTags = (tagsString) => {
      if (!tagsString?.trim()) return null;
      const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tags.length === 0) return null;

      return (
         <div className={commonStyles.tags}>
            {tags.map((tag, index) => (
               <span key={index} className={commonStyles.tag}>
                  {tag}
               </span>
            ))}
         </div>
      );
   };

   const isTrainer = displayData.role === 'trainer';
   const isTrainee = displayData.role === 'trainee';

   return (
      <div className={styles.overview}>
         {/* Статистика в карточках */}
         <div className={styles.statsGrid}>
            <div className={styles.statCard}>
               <div className={styles.statIcon}>👥</div>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.friendsCount}</span>
                  <span className={styles.statLabel}>друзей</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <div className={styles.statIcon}>📸</div>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.mediaCount}</span>
                  <span className={styles.statLabel}>медиа</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <div className={styles.statIcon}>💪</div>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>—</span>
                  <span className={styles.statLabel}>тренировок</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <div className={styles.statIcon}>✅</div>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>—</span>
                  <span className={styles.statLabel}>выполнено</span>
               </div>
            </div>
         </div>

         {/* Две колонки */}
         <div className={styles.twoColumns}>
            {/* Левая колонка - информация о профиле */}
            <div className={styles.infoCard}>
               <h3>📋 О профиле</h3>
               <div className={styles.infoList}>
                  <div className={styles.infoRow}>
                     <span className={styles.infoLabel}>Роль</span>
                     <span className={styles.infoValue}>{getUserRoleLabel(displayData.role)}</span>
                  </div>
                  {displayData.training_level && (
                     <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Уровень</span>
                        <span className={styles.infoValue}>{getTrainingLevelLabel(displayData.training_level)}</span>
                     </div>
                  )}
                  {displayData.sport_specialization && (
                     <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>
                           {isTrainer ? 'Специализация' : 'Интересы'}
                        </span>
                        <div className={styles.infoValue}>
                           {renderTags(displayData.sport_specialization)}
                        </div>
                     </div>
                  )}
                  <div className={styles.infoRow}>
                     <span className={styles.infoLabel}>Email</span>
                     <span className={styles.infoValue}>{displayData.email}</span>
                  </div>
                  <div className={styles.infoRow}>
                     <span className={styles.infoLabel}>В спорте с</span>
                     <span className={styles.infoValue}>{formatMonthYear(displayData.createdAt)}</span>
                  </div>
               </div>
            </div>

            {/* Правая колонка - последняя активность */}
            <div className={styles.activityCard}>
               <h3>⚡ Последняя активность</h3>
               <div className={styles.activityList}>
                  <div className={styles.activityItem}>
                     <span className={styles.activityDot}></span>
                     <div className={styles.activityContent}>
                        <p>Профиль обновлен</p>
                        <span className={styles.activityDate}>{formatDate(displayData.updatedAt)}</span>
                     </div>
                  </div>
                  <div className={styles.activityItem}>
                     <span className={styles.activityDot}></span>
                     <div className={styles.activityContent}>
                        <p>Регистрация в HockeyApp</p>
                        <span className={styles.activityDate}>{formatDate(displayData.createdAt)}</span>
                     </div>
                  </div>
                  {stats.friendsCount > 0 && (
                     <div className={styles.activityItem}>
                        <span className={styles.activityDot}></span>
                        <div className={styles.activityContent}>
                           <p>Добавлено {stats.friendsCount} друзей</p>
                           <span className={styles.activityDate}>За всё время</span>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Медиа галерея */}
         <div className={styles.mediaCard}>
            <div className={styles.mediaHeader}>
               <h3>🖼️ Последние медиа</h3>
               <button className={styles.viewAllButton} onClick={handleViewAllMedia}>
                  Все медиа →
               </button>
            </div>

            {mediaError && (
               <div className={commonStyles.emptyState}>
                  <p>⚠️ Не удалось загрузить медиа</p>
                  <button className={commonStyles.textButton} onClick={handleRetryMedia}>
                     Повторить
                  </button>
               </div>
            )}

            <MiniMediaGallery
               mediaItems={mediaItems}
               loading={mediaLoading}
               limit={6}
               onViewAll={handleViewAllMedia}
            />

            {!mediaLoading && isInitialMediaLoadComplete && mediaItems.length === 0 && !mediaError && (
               <div className={commonStyles.emptyState}>
                  <div className={commonStyles.emptyIcon}>📸</div>
                  <h4>Нет медиа</h4>
                  <p>Загрузите фото или видео тренировок</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default ProfileOverview;