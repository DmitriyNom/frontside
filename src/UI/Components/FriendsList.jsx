// frontend/src/UI/Components/FriendsList.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import {
   fetchFriends,
   removeFriend,
   searchFriends,
   selectFriends,
   selectFriendsLoading,
   selectFriendsPagination,
   selectFriendsErrors
} from '../../features/friendsSlice';
import { getUserRoleLabel } from '../../constants/userRoles';
import { getAvatarUrl } from '../../api/api';
import { selectUser } from '../../features/authSlice';
import CreateTrainingContextModal from './CreateTrainingContextModal';
import ConfirmationModal from './ConfirmationModal';
import TaskCreateModal from './TaskCreateModal';  // 👈 ДОБАВЛЕНО
import commonStyles from '../../styles/friends-common.module.css';
import styles from './FriendsList.module.css';

const FriendsList = ({ isOwnProfile = true, onUserClick }) => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const [searchQuery, setSearchQuery] = useState('');
   const [filter, setFilter] = useState('all'); // 'all', 'my_trainees', 'my_trainers'
   const [friendToRemove, setFriendToRemove] = useState(null);
   const [selectedFriendForTraining, setSelectedFriendForTraining] = useState(null);
   const [selectedFriendForTask, setSelectedFriendForTask] = useState(null);  // 👈 ДОБАВЛЕНО

   const friends = useSelector(selectFriends);
   const loading = useSelector(selectFriendsLoading);
   const pagination = useSelector(selectFriendsPagination);
   const errors = useSelector(selectFriendsErrors);
   const currentUser = useSelector(selectUser);
   const currentUserId = currentUser?.id;

   const initialLoadDone = useRef(false);

   useEffect(() => {
      if (!initialLoadDone.current) {
         initialLoadDone.current = true;
         console.log('FriendsList - первый монтаж, загружаем друзей');
         dispatch(fetchFriends({ limit: 50 }));
      }

      return () => {
         console.log('FriendsList - демонтаж');
      };
   }, [dispatch]);

   const debouncedSearchRef = useRef();

   useEffect(() => {
      debouncedSearchRef.current = debounce((query) => {
         if (query.trim()) {
            dispatch(searchFriends({ query }));
         } else {
            dispatch(fetchFriends({ limit: 50 }));
         }
      }, 500);

      return () => {
         if (debouncedSearchRef.current) {
            debouncedSearchRef.current.cancel();
         }
      };
   }, [dispatch]);

   const handleSearchChange = useCallback((e) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (debouncedSearchRef.current) {
         debouncedSearchRef.current(query);
      }
   }, []);

   const handleConfirmRemove = (friend) => {
      setFriendToRemove(friend);
   };

   const handleRemoveFriend = async () => {
      if (friendToRemove) {
         await dispatch(removeFriend(friendToRemove.id));
         setFriendToRemove(null);
      }
   };

   const handleCancelRemove = () => {
      setFriendToRemove(null);
   };

   const handleViewProfile = useCallback((friendId) => {
      if (onUserClick) {
         onUserClick(friendId);
      } else {
         navigate(`/user/${friendId}`);
      }
   }, [navigate, onUserClick]);

   const openTrainingModal = (friend) => {
      setSelectedFriendForTraining(friend);
   };

   const closeTrainingModal = () => {
      setSelectedFriendForTraining(null);
   };

   const handleTrainingCreated = () => {
      dispatch(fetchFriends({ limit: 50 }));
   };

   // 👈 ДОБАВЛЕНО: открытие модалки создания задания
   const openTaskModal = (friend) => {
      setSelectedFriendForTask(friend);
   };

   // 👈 ДОБАВЛЕНО: закрытие модалки создания задания
   const closeTaskModal = () => {
      setSelectedFriendForTask(null);
   };

   // 👈 ДОБАВЛЕНО: обработчик успешного создания задания
   const handleTaskCreated = () => {
      closeTaskModal();
      // Можно показать уведомление
   };

   // 👈 ДОБАВЛЕНО: проверка возможности создания задания
   const canCreateTask = useCallback((friend) => {
      if (!currentUser) return false;
      // Себе можно создать задание
      if (currentUser.id === friend.id) return true;
      // Админ может создать задание любому
      if (currentUser.role === 'admin') return true;
      // Тренер может создать задание (бэкенд проверит права)
      if (currentUser.role === 'trainer') return true;
      return false;
   }, [currentUser]);

   const filteredFriends = React.useMemo(() => {
      let result = friends;

      if (searchQuery.trim()) {
         const query = searchQuery.toLowerCase();
         result = result.filter(friend =>
            friend.userName?.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query)
         );
      }

      if (filter === 'my_trainees') {
         return result.filter(friend => {
            const contexts = friend.training_contexts || [];
            return contexts.some(ctx =>
               ctx.status === 'active' && ctx.trainer_id === currentUserId
            );
         });
      }

      if (filter === 'my_trainers') {
         return result.filter(friend => {
            const contexts = friend.training_contexts || [];
            return contexts.some(ctx =>
               ctx.status === 'active' && ctx.trainee_id === currentUserId
            );
         });
      }

      return result;
   }, [friends, filter, searchQuery, currentUserId]);

   const counts = React.useMemo(() => {
      return {
         all: friends.length,
         myTrainees: friends.filter(f => {
            const contexts = f.training_contexts || [];
            return contexts.some(ctx => ctx.status === 'active' && ctx.trainer_id === currentUserId);
         }).length,
         myTrainers: friends.filter(f => {
            const contexts = f.training_contexts || [];
            return contexts.some(ctx => ctx.status === 'active' && ctx.trainee_id === currentUserId);
         }).length
      };
   }, [friends, currentUserId]);

   const loadMore = useCallback(() => {
      if (pagination.hasMore && !loading.friends) {
         dispatch(fetchFriends({
            limit: 50,
            offset: pagination.offset + 50
         }));
      }
   }, [dispatch, pagination.hasMore, pagination.offset, loading.friends]);

   if (errors.fetchFriends) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.emptyIcon}>⚠️</div>
            <h4 className={commonStyles.emptyTitle}>Ошибка загрузки</h4>
            <p className={commonStyles.emptyText}>{errors.fetchFriends}</p>
            <button
               className={commonStyles.textButton}
               onClick={() => dispatch(fetchFriends({ limit: 50 }))}
            >
               Попробовать снова
            </button>
         </div>
      );
   }

   if (loading.friends && friends.length === 0) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.spinner}></div>
            <p className={commonStyles.emptyText}>Загрузка списка друзей...</p>
         </div>
      );
   }

   return (
      <>
         <div className={styles.friendsListContainer}>
            {/* Заголовок */}
            <div className={styles.header}>
               <h3>
                  Мои друзья
                  {counts.all > 0 && (
                     <span className={styles.friendsCount}>{counts.all}</span>
                  )}
               </h3>

               <div className={styles.searchContainer}>
                  <input
                     type="text"
                     className={styles.searchInput}
                     placeholder="Поиск по друзьям..."
                     value={searchQuery}
                     onChange={handleSearchChange}
                  />
                  {loading.search ? (
                     <span className={commonStyles.spinner}></span>
                  ) : (
                     <span className={styles.searchIcon}>🔍</span>
                  )}
               </div>
            </div>

            {/* Фильтры */}
            <div className={styles.filters}>
               <button
                  className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                  onClick={() => setFilter('all')}
               >
                  Все друзья
                  <span>{counts.all}</span>
               </button>

               <button
                  className={`${styles.filterButton} ${filter === 'my_trainees' ? styles.active : ''}`}
                  onClick={() => setFilter('my_trainees')}
               >
                  📋 Мои ученики
                  <span>{counts.myTrainees}</span>
               </button>

               <button
                  className={`${styles.filterButton} ${filter === 'my_trainers' ? styles.active : ''}`}
                  onClick={() => setFilter('my_trainers')}
               >
                  🎓 Мои тренеры
                  <span>{counts.myTrainers}</span>
               </button>
            </div>

            {/* Список друзей */}
            {filteredFriends.length === 0 ? (
               <div className={commonStyles.emptyState}>
                  <div className={commonStyles.emptyIcon}>
                     {searchQuery ? '🔍' :
                        filter === 'my_trainees' ? '📋' :
                           filter === 'my_trainers' ? '🎓' : '👥'}
                  </div>
                  <h4 className={commonStyles.emptyTitle}>
                     {searchQuery ? 'Ничего не найдено' :
                        filter === 'my_trainees' ? 'Нет учеников' :
                           filter === 'my_trainers' ? 'Нет тренеров' :
                              'Друзей пока нет'}
                  </h4>
                  <p className={commonStyles.emptyText}>
                     {searchQuery ? 'Попробуйте изменить параметры поиска' :
                        filter === 'my_trainees' ? 'Начните тренировки с друзьями, чтобы они стали вашими учениками' :
                           filter === 'my_trainers' ? 'Найдите тренера среди друзей' :
                              'Найдите новых друзей через поиск или принимайте входящие запросы'}
                  </p>
                  {searchQuery && (
                     <button
                        className={commonStyles.textButton}
                        onClick={() => setSearchQuery('')}
                     >
                        Очистить поиск
                     </button>
                  )}
               </div>
            ) : (
               <div className={styles.friendsGrid}>
                  {filteredFriends.map((friend) => (
                     <div key={friend.id} className={commonStyles.card}>
                        {/* Аватар */}
                        <div
                           className={commonStyles.avatar}
                           onClick={() => handleViewProfile(friend.id)}
                        >
                           {friend.userAvatar ? (
                              <img src={getAvatarUrl(friend.userAvatar)} alt={friend.userName} />
                           ) : (
                              friend.userName?.charAt(0).toUpperCase() || 'U'
                           )}
                        </div>

                        {/* Информация */}
                        <div className={commonStyles.userInfo}>
                           <div
                              className={commonStyles.userName}
                              onClick={() => handleViewProfile(friend.id)}
                           >
                              {friend.userName}
                           </div>

                           <div className={commonStyles.userMeta}>
                              <span className={`${commonStyles.badge} ${commonStyles[friend.role]}`}>
                                 {getUserRoleLabel(friend.role)}
                              </span>
                              {friend.training_level && (
                                 <span className={`${commonStyles.badge} ${commonStyles.level}`}>
                                    {friend.training_level}
                                 </span>
                              )}
                           </div>

                           {friend.sport_specialization && (
                              <div className={commonStyles.tags}>
                                 {friend.sport_specialization.split(',').slice(0, 3).map((tag, i) => (
                                    <span key={i} className={commonStyles.tag}>
                                       {tag.trim()}
                                    </span>
                                 ))}
                              </div>
                           )}

                           {friend.contexts_count > 0 && (
                              <div className={styles.activeContextBadge}>
                                 🏒 Активная тренировка
                              </div>
                           )}
                        </div>

                        {/* 👈 ИЗМЕНЕНО: добавили кнопку создания задания */}
                        <div className={commonStyles.actions}>
                           {/* Кнопка создания задания */}
                           {isOwnProfile && canCreateTask(friend) && (
                              <button
                                 className={`${commonStyles.iconButton} ${commonStyles.primary}`}
                                 onClick={() => openTaskModal(friend)}
                                 title="Создать задание"
                              >
                                 📋
                              </button>
                           )}

                           {/* Кнопка тренировки */}
                           {isOwnProfile && (
                              <button
                                 className={`${commonStyles.iconButton} ${commonStyles.primary}`}
                                 onClick={() => openTrainingModal(friend)}
                                 disabled={friend.contexts_count > 0}
                                 title={friend.contexts_count > 0 ? "Уже есть активная тренировка" : "Начать тренировки"}
                              >
                                 {friend.contexts_count > 0 ? '🏒✓' : '🏒'}
                              </button>
                           )}

                           {/* Кнопка удаления */}
                           {isOwnProfile && (
                              <button
                                 className={`${commonStyles.iconButton} ${commonStyles.danger}`}
                                 onClick={() => handleConfirmRemove(friend)}
                                 disabled={loading.action}
                                 title="Удалить из друзей"
                              >
                                 🗑️
                              </button>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {/* Кнопка "Загрузить еще" */}
            {pagination.hasMore && filteredFriends.length > 0 && (
               <div className={styles.loadMoreContainer}>
                  <button
                     className={commonStyles.textButton}
                     onClick={loadMore}
                     disabled={loading.friends}
                  >
                     {loading.friends ? (
                        <>
                           <span className={commonStyles.spinner}></span>
                           Загрузка...
                        </>
                     ) : (
                        'Загрузить еще'
                     )}
                  </button>
               </div>
            )}
         </div>

         {/* Модалка подтверждения удаления */}
         <ConfirmationModal
            isOpen={!!friendToRemove}
            onClose={handleCancelRemove}
            onConfirm={handleRemoveFriend}
            title="Удалить друга?"
            message={`Вы действительно хотите удалить ${friendToRemove?.userName || 'этого пользователя'} из друзей?`}
            confirmText="Удалить"
            cancelText="Отмена"
            type="delete"
         />

         {/* Модалка создания контекста тренировки */}
         <CreateTrainingContextModal
            isOpen={!!selectedFriendForTraining}
            onClose={closeTrainingModal}
            friend={selectedFriendForTraining}
            currentUserId={currentUserId}
            onSuccess={handleTrainingCreated}
         />

         {/* 👈 ДОБАВЛЕНА модалка создания задания */}
         <TaskCreateModal
            isOpen={!!selectedFriendForTask}
            onClose={closeTaskModal}
            onSuccess={handleTaskCreated}
            defaultUserId={selectedFriendForTask?.id}
         />
      </>
   );
};

export default FriendsList;