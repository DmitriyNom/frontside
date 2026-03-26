import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux'; // 👇 Убрали неиспользуемый dispatch
import { userAPI } from '../../../api/api';
import { getTrainingLevelLabel } from '../../../constants/trainingLevels';
import { getUserRoleLabel } from '../../../constants/userRoles';
import { useSelector } from 'react-redux'; // 👈 Добавили импорт useSelector
import { selectUser } from '../../../features/authSlice';
import FriendButton from '../../Components/FriendButton';
import MutualFriends from '../../Components/MutualFriends';
import styles from './UserProfile.module.css';

const UserProfile = () => {
   const { userId } = useParams();
   const navigate = useNavigate();
   // const dispatch = useDispatch(); // 👇 Закомментировали, если не используется

   const currentUser = useSelector(selectUser);
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [activeTab, setActiveTab] = useState('overview');

   // Загружаем данные пользователя
   useEffect(() => {
      const loadUserProfile = async () => {
         try {
            setLoading(true);
            const response = await userAPI.getUserById(userId);
            setUser(response.data);
            setError(null);
         } catch (err) {
            setError(err.response?.data?.message || 'Не удалось загрузить профиль');
            console.error('Ошибка загрузки профиля:', err);
         } finally {
            setLoading(false);
         }
      };

      if (userId) {
         loadUserProfile();
      }
   }, [userId]);

   // Если это свой профиль - редирект на /profile
   useEffect(() => {
      if (currentUser && user && currentUser.id === user.id) {
         navigate('/profile', { replace: true });
      }
   }, [currentUser, user, navigate]);

   // Обработка тегов
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

   if (loading) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   if (error || !user) {
      return (
         <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Ошибка загрузки</h2>
            <p>{error || 'Пользователь не найден'}</p>
            <button
               className={styles.backButton}
               onClick={() => navigate(-1)}
            >
               ← Вернуться назад
            </button>
         </div>
      );
   }

   const isTrainer = user.role === 'trainer';
   const isTrainee = user.role === 'trainee';

   return (
      <div className={styles.userProfileContainer}>
         {/* Шапка профиля */}
         <div className={styles.profileHeader}>
            <button
               className={styles.backButton}
               onClick={() => navigate(-1)}
            >
               ← Назад
            </button>

            <div className={styles.profileHeaderContent}>
               <div className={styles.avatar}>
                  {user.userName?.charAt(0).toUpperCase() || 'U'}
               </div>

               <div className={styles.headerInfo}>
                  <h1>{user.userName}</h1>
                  <p className={styles.userEmail}>{user.email}</p>

                  <div className={styles.userBadges}>
                     <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                        {getUserRoleLabel(user.role)}
                     </span>
                     {user.training_level && (
                        <span className={styles.levelBadge}>
                           {getTrainingLevelLabel(user.training_level)}
                        </span>
                     )}
                  </div>
               </div>

               {/* Кнопка дружбы */}
               <div className={styles.friendButtonContainer}>
                  <FriendButton
                     userId={user.id}
                     userName={user.userName}
                     onStatusChange={() => {
                        // Обновляем данные после изменения статуса
                        // Можно перезагрузить профиль или обновить локально
                     }}
                  />
               </div>
            </div>
         </div>

         {/* Навигация по вкладкам */}
         <div className={styles.profileTabs}>
            <button
               className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
               onClick={() => setActiveTab('overview')}
            >
               📊 Обзор
            </button>
            <button
               className={`${styles.tab} ${activeTab === 'friends' ? styles.tabActive : ''}`}
               onClick={() => setActiveTab('friends')}
            >
               👥 Друзья
            </button>
            {(isTrainer || isTrainee) && (
               <button
                  className={`${styles.tab} ${activeTab === 'training' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('training')}
               >
                  {isTrainer ? '👥 Тренер' : '💪 Спортсмен'}
               </button>
            )}
         </div>

         {/* Контент вкладок */}
         <div className={styles.tabContent}>
            {activeTab === 'overview' && (
               <div className={styles.overview}>
                  {/* Информация о пользователе */}
                  <div className={styles.infoCard}>
                     <h3>О пользователе</h3>
                     <div className={styles.infoGrid}>
                        {user.birthDate && (
                           <div className={styles.infoItem}>
                              <label>Дата рождения:</label>
                              <span>{new Date(user.birthDate).toLocaleDateString('ru-RU')}</span>
                           </div>
                        )}

                        {user.sport_specialization && (
                           <div className={styles.infoItem}>
                              <label>
                                 {isTrainer ? 'Специализация:' : 'Спортивные интересы:'}
                              </label>
                              <div className={styles.specializations}>
                                 {renderTags(user.sport_specialization)}
                              </div>
                           </div>
                        )}

                        <div className={styles.infoItem}>
                           <label>На сайте с:</label>
                           <span>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>

                        <div className={styles.infoItem}>
                           <label>Доступен для подключений:</label>
                           <span className={user.allow_connections ? styles.yes : styles.no}>
                              {user.allow_connections ? '✅ Да' : '❌ Нет'}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Общие друзья */}
                  <MutualFriends userId={user.id} />
               </div>
            )}

            {activeTab === 'friends' && (
               <div className={styles.friendsTab}>
                  <h3>Друзья пользователя</h3>
                  <p className={styles.comingSoon}>Список друзей появится позже</p>
               </div>
            )}

            {activeTab === 'training' && (
               <div className={styles.trainingTab}>
                  <h3>Тренировочная информация</h3>
                  <p className={styles.comingSoon}>Информация о тренировках появится позже</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default UserProfile;