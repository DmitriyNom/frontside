// frontend/src/UI/Components/UserProfileModal.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userAPI, friendsAPI, getAvatarUrl } from '../../api/api';
import { getTrainingLevelLabel } from '../../constants/trainingLevels';
import { getUserRoleLabel } from '../../constants/userRoles';
import { clearFriendStatus } from '../../features/friendsSlice';
import { selectUser } from '../../features/authSlice';
import commonStyles from '../../styles/friends-common.module.css';
import styles from './UserProfileModal.module.css';
import ConfirmationModal from './ConfirmationModal';
import TaskCreateModal from './TaskCreateModal';
// ❌ CreateTrainingContextModal больше не нужен — контекст создаётся автоматически
// import CreateTrainingContextModal from './CreateTrainingContextModal';

const UserProfileModal = ({ isOpen, onClose, userId, currentUserId, onUserClick }) => {
   const dispatch = useDispatch();
   const authUser = useSelector(selectUser);
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [activeTab, setActiveTab] = useState('overview');
   const [friendsCount, setFriendsCount] = useState(0);
   const [userFriends, setUserFriends] = useState([]);
   const [friendStatus, setFriendStatus] = useState(null);
   const [sendingRequest, setSendingRequest] = useState(false);
   const [loadingFriends, setLoadingFriends] = useState(false);
   const [showConfirmModal, setShowConfirmModal] = useState(false);
   const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false);
   // ❌ isTrainingContextOpen больше не нужен
   // const [isTrainingContextOpen, setIsTrainingContextOpen] = useState(false);

   const loadUserProfile = useCallback(async () => {
      if (!userId) return;
      try {
         setLoading(true);
         const response = await userAPI.getUserById(userId);
         let userData = response.data;
         if (response.data?.data) userData = response.data.data;
         if (response.data?.user) userData = response.data.user;
         console.log('📋 User profile loaded:', { id: userData?.id, name: userData?.userName, role: userData?.role });
         setUser(userData);
         setError(null);
      } catch (err) {
         console.error('❌ Error loading user profile:', err);
         setError(err.response?.data?.message || 'Не удалось загрузить профиль');
      } finally {
         setLoading(false);
      }
   }, [userId]);

   const loadUserFriends = useCallback(async () => {
      console.log('🟡 loadUserFriends called, userId:', userId);
      if (!userId) {
         console.log('❌ userId is null, skipping');
         return;
      }
      setLoadingFriends(true);
      try {
         const response = await friendsAPI.getUserFriends(userId);
         console.log('🟢 getUserFriends response:', response.data);
         const friends = response.data?.data || response.data || [];
         const filteredFriends = friends.filter(friend => friend.id !== currentUserId);
         console.log('📊 Friends count (after filtering self):', filteredFriends.length);
         setUserFriends(filteredFriends);
         setFriendsCount(filteredFriends.length);
      } catch (err) {
         console.error('Ошибка загрузки друзей пользователя:', err);
         setUserFriends([]);
         setFriendsCount(0);
      } finally {
         setLoadingFriends(false);
      }
   }, [userId, currentUserId]);

   const loadFriendStatus = useCallback(async () => {
      if (!userId) return;
      try {
         const response = await friendsAPI.getFriendStatus(userId);
         const statusData = response.data?.data || response.data;
         console.log('🔍 Friend status loaded:', statusData);
         setFriendStatus(statusData);
      } catch (err) {
         console.error('Ошибка загрузки статуса дружбы:', err);
         setFriendStatus(null);
      }
   }, [userId]);

   useEffect(() => {
      console.log('🟡 useEffect triggered, isOpen:', isOpen, 'userId:', userId);
      if (isOpen && userId) {
         console.log('🟢 Loading profile data for user:', userId);
         loadUserProfile();
         loadUserFriends();
         loadFriendStatus();
      }
   }, [isOpen, userId, loadUserProfile, loadUserFriends, loadFriendStatus]);

   useEffect(() => {
      const handleEscape = (e) => {
         if (e.key === 'Escape') onClose();
      };
      if (isOpen) {
         document.addEventListener('keydown', handleEscape);
         document.body.style.overflow = 'hidden';
      }
      return () => {
         document.removeEventListener('keydown', handleEscape);
         document.body.style.overflow = 'unset';
      };
   }, [isOpen, onClose]);

   const handleStatusChange = useCallback(() => {
      loadUserFriends();
      loadFriendStatus();
      window.dispatchEvent(new CustomEvent('refreshFriendRequests'));
   }, [loadUserFriends, loadFriendStatus]);

   const handleSendFriendRequest = async () => {
      setSendingRequest(true);
      try {
         await friendsAPI.sendRequest(userId);
         handleStatusChange();
      } catch (err) {
         const errorMsg = err.response?.data?.message || 'Не удалось отправить запрос';
         alert(`Ошибка: ${errorMsg}`);
      } finally {
         setSendingRequest(false);
      }
   };

   const handleCancelRequest = async () => {
      if (!friendStatus?.requestId) return;
      setSendingRequest(true);
      try {
         await friendsAPI.cancelRequest(friendStatus.requestId);
         handleStatusChange();
      } catch (err) {
         alert('Ошибка при отмене запроса');
      } finally {
         setSendingRequest(false);
      }
   };

   const handleRemoveFriend = async () => {
      setSendingRequest(true);
      try {
         await friendsAPI.removeFriend(userId);
         handleStatusChange();
         setShowConfirmModal(false);
         dispatch(clearFriendStatus(userId));
      } catch (err) {
         alert('Ошибка при удалении из друзей');
      } finally {
         setSendingRequest(false);
      }
   };

   const handleConfirmRemoveFriend = () => {
      setShowConfirmModal(true);
   };

   const handleAcceptRequest = async () => {
      if (!friendStatus?.requestId) return;
      setSendingRequest(true);
      try {
         await friendsAPI.respondToRequest(friendStatus.requestId, 'accept');
         handleStatusChange();
      } catch (err) {
         alert('Ошибка при принятии запроса');
      } finally {
         setSendingRequest(false);
      }
   };

   const handleRejectRequest = async () => {
      if (!friendStatus?.requestId) return;
      setSendingRequest(true);
      try {
         await friendsAPI.respondToRequest(friendStatus.requestId, 'reject');
         handleStatusChange();
      } catch (err) {
         alert('Ошибка при отклонении запроса');
      } finally {
         setSendingRequest(false);
      }
   };

   const handleViewFriendProfile = (friendId) => {
      onClose();
      setTimeout(() => {
         if (onUserClick) {
            onUserClick(friendId);
         }
      }, 100);
   };

   // ✅ УПРОЩЁННАЯ ПРОВЕРКА ВОЗМОЖНОСТИ СОЗДАНИЯ ЗАДАНИЯ
   const canCreateTask = useCallback(() => {
      if (!authUser || !user) return false;

      // 1. Себе можно всегда
      if (authUser.id === user.id) return true;

      // 2. Админ может любому
      if (authUser.role === 'admin') return true;

      // 3. Для остальных — показываем кнопку, бэкенд сам проверит права
      //    (если нет дружбы — вернёт ошибку 403)
      return true;
   }, [authUser, user]);

   const handleCreateTask = () => {
      console.log('📋 Opening TaskCreateModal for user:', user?.id);
      setIsTaskCreateOpen(true);
   };

   // ❌ handleCreateTrainingContext больше не нужен
   // const handleCreateTrainingContext = () => {
   //    console.log('🏋️ Opening CreateTrainingContextModal for user:', user?.id);
   //    setIsTrainingContextOpen(true);
   // };

   // ❌ handleTrainingContextSuccess больше не нужен
   // const handleTrainingContextSuccess = () => {
   //    console.log('✅ TrainingContext created successfully');
   //    setIsTrainingContextOpen(false);
   //    loadFriendStatus();
   // };

   // ✅ УПРОЩЁННЫЙ РЕНДЕР ДОПОЛНИТЕЛЬНЫХ КНОПОК (только "Создать задание")
   const renderExtraButtons = () => {
      if (!user) return null;

      // Не показываем кнопку для самого себя
      if (user.id === currentUserId) return null;

      const canCreate = canCreateTask();
      if (!canCreate) return null;

      return (
         <div className={styles.extraButtons}>
            <button
               className={`${commonStyles.textButton} ${commonStyles.primary}`}
               onClick={handleCreateTask}
               disabled={sendingRequest}
            >
               📋 Создать задание
            </button>
         </div>
      );
   };

   const renderFriendButton = () => {
      if (sendingRequest) {
         return (
            <button className={commonStyles.textButton} disabled>
               <span className={commonStyles.spinner}></span>
            </button>
         );
      }

      if (!friendStatus) {
         return (
            <button className={commonStyles.textButton} disabled>
               Загрузка...
            </button>
         );
      }

      switch (friendStatus.status) {
         case 'pending':
            if (friendStatus.direction === 'outgoing') {
               return (
                  <button
                     className={`${commonStyles.textButton} ${commonStyles.secondary}`}
                     onClick={handleCancelRequest}
                  >
                     ⏳ Отменить запрос
                  </button>
               );
            } else {
               return (
                  <div className={commonStyles.actions}>
                     <button
                        className={`${commonStyles.iconButton} ${commonStyles.success}`}
                        onClick={handleAcceptRequest}
                        title="Принять"
                     >
                        ✓
                     </button>
                     <button
                        className={`${commonStyles.iconButton} ${commonStyles.danger}`}
                        onClick={handleRejectRequest}
                        title="Отклонить"
                     >
                        ✗
                     </button>
                  </div>
               );
            }

         case 'accepted':
            return (
               <button
                  className={`${commonStyles.textButton} ${commonStyles.secondary}`}
                  onClick={handleConfirmRemoveFriend}
               >
                  👥 Удалить из друзей
               </button>
            );

         case 'blocked':
            return (
               <button className={`${commonStyles.textButton} ${commonStyles.secondary}`} disabled>
                  🔨 Заблокирован
               </button>
            );

         default:
            return (
               <button
                  className={commonStyles.textButton}
                  onClick={handleSendFriendRequest}
               >
                  ➕ Добавить в друзья
               </button>
            );
      }
   };

   const renderFriendsList = () => {
      if (loadingFriends) {
         return (
            <div className={commonStyles.emptyState}>
               <div className={commonStyles.spinner}></div>
               <p>Загрузка списка друзей...</p>
            </div>
         );
      }

      if (userFriends.length === 0) {
         return (
            <div className={commonStyles.emptyState}>
               <div className={commonStyles.emptyIcon}>👥</div>
               <p>У пользователя пока нет друзей</p>
            </div>
         );
      }

      return (
         <div className={styles.friendsGrid}>
            {userFriends.map((friend) => (
               <div key={friend.id} className={commonStyles.card}>
                  <div
                     className={commonStyles.avatar}
                     onClick={() => handleViewFriendProfile(friend.id)}
                     style={{ cursor: 'pointer' }}
                  >
                     {friend.userAvatar ? (
                        <img src={getAvatarUrl(friend.userAvatar)} alt={friend.userName} />
                     ) : (
                        friend.userName?.charAt(0).toUpperCase() || 'U'
                     )}
                  </div>
                  <div className={commonStyles.userInfo}>
                     <div
                        className={commonStyles.userName}
                        onClick={() => handleViewFriendProfile(friend.id)}
                        style={{ cursor: 'pointer' }}
                     >
                        {friend.userName || 'Пользователь'}
                     </div>
                     <div className={commonStyles.userMeta}>
                        <span className={`${commonStyles.badge} ${commonStyles[friend.role] || ''}`}>
                           {friend.role === 'trainer' ? 'Тренер' :
                              friend.role === 'trainee' ? 'Спортсмен' :
                                 getUserRoleLabel(friend.role) || 'Пользователь'}
                        </span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      );
   };

   const renderTags = (tagsString) => {
      if (!tagsString || !tagsString.trim()) return null;
      const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tags.length === 0) return null;
      return (
         <div className={commonStyles.tags}>
            {tags.map((tag, index) => (
               <span key={index} className={commonStyles.tag}>{tag}</span>
            ))}
         </div>
      );
   };

   if (!isOpen) return null;

   const displayName = user?.userName || user?.email || 'Пользователь';
   const userRole = user?.role || 'user';
   const isTrainer = userRole === 'trainer';
   const isTrainee = userRole === 'trainee';
   const userCreatedAt = user?.createdAt || user?.created_at;

   return (
      <>
         <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
               <button className={styles.closeButton} onClick={onClose}>×</button>

               {loading ? (
                  <div className={commonStyles.emptyState}>
                     <div className={commonStyles.spinner}></div>
                     <p>Загрузка профиля...</p>
                  </div>
               ) : error || !user ? (
                  <div className={commonStyles.emptyState}>
                     <div className={commonStyles.emptyIcon}>⚠️</div>
                     <p>{error || 'Пользователь не найден'}</p>
                  </div>
               ) : (
                  <>
                     <div className={styles.profileHeader}>
                        <div className={styles.profileHeaderContent}>
                           <div className={`${commonStyles.avatar} ${styles.avatarLarge}`}>
                              {displayName.charAt(0).toUpperCase()}
                           </div>
                           <div className={styles.headerInfo}>
                              <h2>{displayName}</h2>
                              {user.email && <p className={styles.userEmail}>{user.email}</p>}
                              <div className={styles.userBadges}>
                                 <span className={`${commonStyles.badge} ${commonStyles[userRole] || ''}`}>
                                    {userRole === 'trainer' ? 'Тренер' :
                                       userRole === 'trainee' ? 'Спортсмен' :
                                          getUserRoleLabel(userRole) || 'Пользователь'}
                                 </span>
                                 {user.training_level && (
                                    <span className={`${commonStyles.badge} ${commonStyles.level}`}>
                                       {getTrainingLevelLabel(user.training_level)}
                                    </span>
                                 )}
                              </div>
                              {user.sport_specialization && renderTags(user.sport_specialization)}
                           </div>
                           <div className={styles.friendButtonWrapper}>
                              {renderFriendButton()}
                           </div>
                        </div>
                        {/* ✅ Только кнопка "Создать задание" */}
                        {renderExtraButtons()}
                     </div>

                     <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                           <span className={styles.statValue}>{friendsCount}</span>
                           <span className={styles.statLabel}>друзей</span>
                        </div>
                        <div className={styles.statCard}>
                           <span className={styles.statValue}>—</span>
                           <span className={styles.statLabel}>тренировок</span>
                        </div>
                        <div className={styles.statCard}>
                           <span className={styles.statValue}>—</span>
                           <span className={styles.statLabel}>выполнение</span>
                        </div>
                     </div>

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
                           👥 Друзья ({friendsCount})
                        </button>
                        {(isTrainer || isTrainee) && (
                           <button
                              className={`${styles.tab} ${activeTab === 'training' ? styles.tabActive : ''}`}
                              onClick={() => setActiveTab('training')}
                              disabled
                           >
                              {isTrainer ? '🎓 Тренер' : '💪 Спортсмен'}
                           </button>
                        )}
                     </div>

                     <div className={styles.tabContent}>
                        {activeTab === 'overview' && (
                           <div className={styles.overview}>
                              <div className={styles.infoCard}>
                                 <h4>📋 О пользователе</h4>
                                 <div className={styles.infoGrid}>
                                    {user.birthDate && (
                                       <div className={styles.infoItem}>
                                          <label>Дата рождения:</label>
                                          <span>{new Date(user.birthDate).toLocaleDateString('ru-RU')}</span>
                                       </div>
                                    )}
                                    <div className={styles.infoItem}>
                                       <label>В спорте с:</label>
                                       <span>
                                          {userCreatedAt
                                             ? new Date(userCreatedAt).toLocaleDateString('ru-RU')
                                             : 'Дата не указана'}
                                       </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                       <label>Доступен для подключений:</label>
                                       <span className={user.allow_connections ? styles.yes : styles.no}>
                                          {user.allow_connections ? '✅ Да' : '❌ Нет'}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}

                        {activeTab === 'friends' && (
                           <div className={styles.friendsTab}>
                              <h4>👥 Друзья пользователя {displayName}</h4>
                              {renderFriendsList()}
                           </div>
                        )}

                        {activeTab === 'training' && (
                           <div className={styles.trainingTab}>
                              <h4>{isTrainer ? '🎓 Тренерская деятельность' : '💪 Тренировочный процесс'}</h4>
                              <div className={commonStyles.emptyState}>
                                 <div className={commonStyles.emptyIcon}>{isTrainer ? '🎓' : '💪'}</div>
                                 <p>Информация о тренировках появится здесь</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </>
               )}
            </div>
         </div>

         <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleRemoveFriend}
            title="Удалить друга?"
            message={`Вы действительно хотите удалить ${displayName} из друзей?`}
            confirmText="Удалить"
            cancelText="Отмена"
            type="delete"
         />

         {/* ✅ Модалка создания задания */}
         <TaskCreateModal
            isOpen={isTaskCreateOpen}
            onClose={() => setIsTaskCreateOpen(false)}
            onSuccess={() => {
               setIsTaskCreateOpen(false);
               console.log('📋 Task created successfully');
            }}
            defaultUserId={user?.id}
         />

         {/* ❌ CreateTrainingContextModal больше не нужен */}
      </>
   );
};

export default UserProfileModal;