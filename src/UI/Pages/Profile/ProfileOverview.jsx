// src/UI/Pages/Profile/ProfileOverview.jsx
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
import { getTrainingLevelLabel } from '../../../constants/trainingLevels';
import { getUserRoleLabel } from '../../../constants/userRoles';
import MiniMediaGallery from '../../Components/MiniMediaGallery';
import styles from './ProfileOverview.module.css';

const ProfileOverview = ({ user: propUser, onSwitchToMedia }) => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   // Данные из profileSlice (могут быть старыми/устаревшими)
   const profile = useSelector(selectProfile);
   const isLoading = useSelector(selectIsLoading);
   const isProfileLoaded = useSelector(selectIsProfileLoaded);

   // Медиа данные
   const mediaItems = useSelector(selectMediaItems);
   const mediaLoading = useSelector(selectMediaLoading);
   const mediaError = useSelector(selectMediaError);
   const shouldFetchMedia = useSelector(selectShouldFetchMedia);
   const isInitialMediaLoadComplete = useSelector(selectIsInitialMediaLoadComplete);

   // 🔑 КЛЮЧЕВОЕ РЕШЕНИЕ: Приоритет у пропса user (из authSlice)
   // profileSlice используем как fallback
   const userData = useMemo(() => {
      // Если есть пропс user - используем его (сайдбар уже показывает его)
      if (propUser) {
         console.log('📊 ProfileOverview: используем пропс user', propUser.email);
         return propUser;
      }

      // Если нет пропса, но есть profile - используем его
      if (profile) {
         console.log('📊 ProfileOverview: используем profile из стора', profile.email);
         return profile;
      }

      // Нет данных
      return null;
   }, [propUser, profile]);

   // 🔍 ДИАГНОСТИКА: логируем источник данных
   useEffect(() => {
      console.log('📊 ProfileOverview - источник данных:', {
         hasPropUser: !!propUser,
         hasProfile: !!profile,
         используем: propUser ? 'пропс (auth)' : profile ? 'profileSlice' : 'нет данных',
         email: userData?.email,
         роль: userData?.role
      });
   }, [propUser, profile, userData]);

   // Извлекаем данные из userData (приоритет) или profile (fallback)
   const sportSpecialization = userData?.sport_specialization || profile?.sport_specialization || '';
   const trainingLevel = userData?.training_level || profile?.training_level || '';
   const userRole = userData?.role || profile?.role || '';
   const allowConnections = userData?.allow_connections !== false;
   const userName = userData?.userName || profile?.userName || '';
   const userEmail = userData?.email || profile?.email || '';
   const birthDate = userData?.birthDate || profile?.birthDate;
   const createdAt = userData?.createdAt || profile?.createdAt;
   const updatedAt = userData?.updatedAt || profile?.updatedAt;

   const isTrainer = userRole === 'trainer';
   const isTrainee = userRole === 'trainee';

   // Загрузка профиля - только если нет пропса и нет профиля
   useEffect(() => {
      // Если есть пропс user - не загружаем профиль
      if (propUser) {
         console.log('📊 ProfileOverview: пропс уже есть, пропускаем загрузку profileSlice');
         return;
      }

      // Если нет пропса и нет профиля - загружаем
      if (!profile && !isLoading && !isProfileLoaded) {
         console.log('📊 ProfileOverview: загружаем профиль из profileSlice');
         dispatch(loadProfile());
      }
   }, [dispatch, propUser, profile, isLoading, isProfileLoaded]);

   // Загрузка медиа (всегда, если нужно)
   useEffect(() => {
      if (shouldFetchMedia) {
         console.log('📊 ProfileOverview: загружаем медиа');
         dispatch(fetchUserMedia());
      }
   }, [dispatch, shouldFetchMedia]);

   // Очистка ошибки при размонтировании
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

   // Показываем загрузку только если действительно нет данных
   if (isLoading && !userData && !profile) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   // Если нет данных после загрузки
   if (!userData && !profile && isProfileLoaded) {
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

   // Если нет данных, но загрузка не завершена
   if (!userData && !profile) {
      return (
         <div className={styles.checkingContainer}>
            <p>Проверка данных профиля...</p>
         </div>
      );
   }

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

   const renderLimitedTags = (tagsString) => {
      if (!tagsString || !tagsString.trim()) return null;

      const tags = tagsString
         .split(',')
         .map(tag => tag.trim())
         .filter(tag => tag.length > 0)
         .slice(0, 3);

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
                     {sportSpecialization && renderLimitedTags(sportSpecialization)}
                  </div>
               </div>
            )}

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
               {userRole && (
                  <div className={styles.detailItem}>
                     <label>Роль в системе:</label>
                     <span className={`${styles.detailValue} ${styles[userRole]}`}>
                        {getUserRoleLabel(userRole)}
                     </span>
                  </div>
               )}

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
                     <label>
                        {userRole === 'trainer' ? 'Специализация:' : 'Спортивные интересы:'}
                     </label>
                     <div className={styles.detailValue}>
                        {renderTags(sportSpecialization)}
                     </div>
                  </div>
               )}

               <div className={styles.detailItem}>
                  <label>Доступен для подключений:</label>
                  <span className={styles.detailValue}>
                     {allowConnections ? '✅ Да' : '❌ Нет'}
                  </span>
               </div>

               {userEmail && (
                  <div className={styles.detailItem}>
                     <label>Email:</label>
                     <span className={styles.detailValue}>{userEmail}</span>
                  </div>
               )}

               {birthDate && (
                  <div className={styles.detailItem}>
                     <label>Дата рождения:</label>
                     <span className={styles.detailValue}>
                        {new Date(birthDate).toLocaleDateString('ru-RU')}
                     </span>
                  </div>
               )}

               {createdAt && (
                  <div className={styles.detailItem}>
                     <label>Дата регистрации:</label>
                     <span className={styles.detailValue}>
                        {new Date(createdAt).toLocaleDateString('ru-RU')}
                     </span>
                  </div>
               )}
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
               {updatedAt && (
                  <div className={styles.activityItem}>
                     <span className={styles.activityIcon}>📱</span>
                     <div className={styles.activityContent}>
                        <p>Профиль обновлен</p>
                        <span className={styles.activityTime}>
                           {new Date(updatedAt).toLocaleDateString('ru-RU')}
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

         <div className={styles.recentMedia}>
            <div className={styles.mediaHeader}>
               <h3>Последние медиа</h3>
               {mediaError && (
                  <button
                     className={styles.retryButton}
                     onClick={handleRetryMedia}
                  >
                     🔄 Повторить
                  </button>
               )}
               <button
                  className={styles.viewAllButton}
                  onClick={handleViewAllMedia}
               >
                  Все медиа →
               </button>
            </div>

            {mediaError && !mediaLoading && (
               <div className={styles.mediaError}>
                  <p>⚠️ Не удалось загрузить медиа</p>
                  <button
                     className={styles.retrySmallButton}
                     onClick={handleRetryMedia}
                  >
                     Повторить попытку
                  </button>
               </div>
            )}

            <MiniMediaGallery
               mediaItems={mediaItems}
               loading={mediaLoading}
               limit={6}
               onViewAll={handleViewAllMedia}
            />

            {!mediaError && (
               <p className={styles.mediaHint}>
                  Загружайте фото и видео тренировок, чтобы отслеживать прогресс
               </p>
            )}

            {!mediaLoading && isInitialMediaLoadComplete && mediaItems.length === 0 && !mediaError && (
               <p className={styles.noMediaMessage}>
                  У вас пока нет загруженных медиа. Нажмите "Все медиа →", чтобы добавить.
               </p>
            )}
         </div>
      </div>
   );
};

export default ProfileOverview;