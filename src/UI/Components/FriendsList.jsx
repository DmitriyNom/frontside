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
import styles from './FriendsList.module.css';

const FriendsList = ({ isOwnProfile = true }) => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const [searchQuery, setSearchQuery] = useState('');
   const [filter, setFilter] = useState('all'); // all, trainers, trainees
   const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
   const [selectedFriendForTraining, setSelectedFriendForTraining] = useState(null);

   const friends = useSelector(selectFriends);
   const loading = useSelector(selectFriendsLoading);
   const pagination = useSelector(selectFriendsPagination);
   const errors = useSelector(selectFriendsErrors);
   const currentUser = useSelector(selectUser);
   const currentUserId = currentUser?.id;

   // Загружаем друзей при монтировании
   useEffect(() => {
      dispatch(fetchFriends({ limit: 50 }));
   }, [dispatch]);

   // Создаем ref для хранения debounced функции
   const debouncedSearchRef = useRef();

   useEffect(() => {
      // Создаем debounced функцию поиска
      debouncedSearchRef.current = debounce((query) => {
         if (query.trim()) {
            dispatch(searchFriends({ query }));
         } else {
            // Если поиск пустой - загружаем обычный список
            dispatch(fetchFriends({ limit: 50 }));
         }
      }, 500);

      // Очистка при размонтировании
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

   const handleRemoveFriend = async (friendId) => {
      await dispatch(removeFriend(friendId));
      setShowRemoveConfirm(null);
   };

   const handleViewProfile = useCallback((friendId) => {
      navigate(`/user/${friendId}`);
   }, [navigate]);

   const openTrainingModal = (friend) => {
      setSelectedFriendForTraining(friend);
   };

   const closeTrainingModal = () => {
      setSelectedFriendForTraining(null);
   };

   const handleTrainingCreated = () => {
      // Обновляем список друзей после создания контекста
      dispatch(fetchFriends({ limit: 50 }));
   };

   // Фильтрация по роли
   const filteredFriends = React.useMemo(() => {
      return friends.filter(friend => {
         if (filter === 'all') return true;
         if (filter === 'trainers') return friend.role === 'trainer';
         if (filter === 'trainees') return friend.role === 'trainee';
         return true;
      });
   }, [friends, filter]);

   const loadMore = useCallback(() => {
      if (pagination.hasMore && !loading.friends) {
         dispatch(fetchFriends({
            limit: 50,
            offset: pagination.offset + 50
         }));
      }
   }, [dispatch, pagination.hasMore, pagination.offset, loading.friends]);

   // Обработка ошибок
   if (errors.fetchFriends) {
      return (
         <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h4>Ошибка загрузки</h4>
            <p>{errors.fetchFriends}</p>
            <button
               className={styles.retryButton}
               onClick={() => dispatch(fetchFriends({ limit: 50 }))}
            >
               Попробовать снова
            </button>
         </div>
      );
   }

   if (loading.friends && friends.length === 0) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка списка друзей...</p>
         </div>
      );
   }

   return (
      <>
         <div className={styles.friendsListContainer}>
            {/* Заголовок и поиск */}
            <div className={styles.header}>
               <h3>
                  Мои друзья
                  {friends.length > 0 && (
                     <span className={styles.friendsCount}>{friends.length}</span>
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
                     <span className={styles.searchSpinner}></span>
                  ) : (
                     <span className={styles.searchIcon}>🔍</span>
                  )}
               </div>
            </div>

            {/* Фильтры по ролям */}
            <div className={styles.filters}>
               <button
                  className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                  onClick={() => setFilter('all')}
               >
                  Все
                  <span className={styles.filterCount}>
                     {friends.length}
                  </span>
               </button>
               <button
                  className={`${styles.filterButton} ${filter === 'trainers' ? styles.active : ''}`}
                  onClick={() => setFilter('trainers')}
               >
                  Тренеры
                  <span className={styles.filterCount}>
                     {friends.filter(f => f.role === 'trainer').length}
                  </span>
               </button>
               <button
                  className={`${styles.filterButton} ${filter === 'trainees' ? styles.active : ''}`}
                  onClick={() => setFilter('trainees')}
               >
                  Спортсмены
                  <span className={styles.filterCount}>
                     {friends.filter(f => f.role === 'trainee').length}
                  </span>
               </button>
            </div>

            {/* Список друзей */}
            {filteredFriends.length === 0 ? (
               <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                     {searchQuery ? '🔍' : '👥'}
                  </div>
                  <h4>
                     {searchQuery
                        ? 'Ничего не найдено'
                        : 'Друзей пока нет'
                     }
                  </h4>
                  <p>
                     {searchQuery
                        ? 'Попробуйте изменить параметры поиска'
                        : 'Найдите новых друзей через поиск или принимайте входящие запросы'}
                  </p>
                  {searchQuery && (
                     <button
                        className={styles.clearSearchButton}
                        onClick={() => {
                           setSearchQuery('');
                           dispatch(fetchFriends({ limit: 50 }));
                        }}
                     >
                        Очистить поиск
                     </button>
                  )}
               </div>
            ) : (
               <div className={styles.friendsGrid}>
                  {filteredFriends.map((friend) => (
                     <div key={friend.id} className={styles.friendCard}>
                        <div
                           className={styles.friendAvatar}
                           onClick={() => handleViewProfile(friend.id)}
                        >
                           {friend.userAvatar ? (
                              <img
                                 src={getAvatarUrl(friend.userAvatar)}
                                 alt={friend.userName}
                                 className={styles.friendAvatarImage}
                              />
                           ) : (
                              friend.userName?.charAt(0).toUpperCase() || 'U'
                           )}
                        </div>

                        <div className={styles.friendInfo}>
                           <h4
                              className={styles.friendName}
                              onClick={() => handleViewProfile(friend.id)}
                           >
                              {friend.userName}
                           </h4>

                           <div className={styles.friendMeta}>
                              <span className={`${styles.roleBadge} ${styles[friend.role]}`}>
                                 {getUserRoleLabel(friend.role)}
                              </span>

                              {friend.training_level && (
                                 <span className={styles.levelBadge}>
                                    {friend.training_level}
                                 </span>
                              )}
                           </div>

                           {friend.sport_specialization && (
                              <div className={styles.sportSpecialization}>
                                 {friend.sport_specialization.split(',').map((tag, i) => (
                                    <span key={i} className={styles.sportTag}>
                                       {tag.trim()}
                                    </span>
                                 ))}
                              </div>
                           )}

                           {friend.mutualFriendsCount > 0 && (
                              <div
                                 className={styles.mutualFriends}
                                 onClick={() => navigate(`/friends/mutual/${friend.id}`)}
                              >
                                 👥 {friend.mutualFriendsCount} общих друзей
                              </div>
                           )}
                        </div>

                        {/* Действия */}
                        <div className={styles.friendActions}>
                           {/* Кнопка создания тренировки */}
                           {isOwnProfile && (
                              <button
                                 className={styles.trainButton}
                                 onClick={() => openTrainingModal(friend)}
                                 disabled={friend.contexts_count > 0}
                                 title={friend.contexts_count > 0 ? "Уже есть активная тренировка" : "Начать тренировки"}
                              >
                                 {friend.contexts_count > 0 ? '🏒' : '🏒'}
                              </button>
                           )}

                           {/* Кнопка удаления */}
                           {isOwnProfile && (
                              <>
                                 {showRemoveConfirm === friend.id ? (
                                    <div className={styles.confirmActions}>
                                       <button
                                          className={`${styles.actionButton} ${styles.confirmYes}`}
                                          onClick={() => handleRemoveFriend(friend.id)}
                                          disabled={loading.action}
                                          title="Подтвердить удаление"
                                       >
                                          ✓
                                       </button>
                                       <button
                                          className={`${styles.actionButton} ${styles.confirmNo}`}
                                          onClick={() => setShowRemoveConfirm(null)}
                                          disabled={loading.action}
                                          title="Отменить"
                                       >
                                          ✕
                                       </button>
                                    </div>
                                 ) : (
                                    <button
                                       className={`${styles.actionButton} ${styles.removeButton}`}
                                       onClick={() => setShowRemoveConfirm(friend.id)}
                                       disabled={loading.action}
                                       title="Удалить из друзей"
                                    >
                                       {loading.action && showRemoveConfirm === friend.id ? (
                                          <span className={styles.buttonSpinner}></span>
                                       ) : (
                                          '✕'
                                       )}
                                    </button>
                                 )}
                              </>
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
                     className={styles.loadMoreButton}
                     onClick={loadMore}
                     disabled={loading.friends}
                  >
                     {loading.friends ? (
                        <>
                           <span className={styles.buttonSpinner}></span>
                           Загрузка...
                        </>
                     ) : (
                        'Загрузить еще'
                     )}
                  </button>
                  <div className={styles.loadMoreInfo}>
                     Показано {friends.length} из {pagination.total || '...'}
                  </div>
               </div>
            )}
         </div>

         {/* Модалка создания контекста тренировки */}
         <CreateTrainingContextModal
            isOpen={!!selectedFriendForTraining}
            onClose={closeTrainingModal}
            friend={selectedFriendForTraining}
            currentUserId={currentUserId}
            onSuccess={handleTrainingCreated}
         />
      </>
   );
};

export default FriendsList;