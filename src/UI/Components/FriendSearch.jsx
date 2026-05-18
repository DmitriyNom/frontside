import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash/debounce';
import { userAPI, getAvatarUrl } from '../../api/api';
import {
   sendFriendRequest,
   fetchFriendStatus,
   selectFriendStatuses,
   selectFriendsLoading
} from '../../features/friendsSlice';
import { getUserRoleLabel } from '../../constants/userRoles';
import { TRAINING_LEVELS } from '../../constants/trainingLevels';
import styles from './FriendSearch.module.css';

const FriendSearch = ({ onUserClick }) => {
   const dispatch = useDispatch();

   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [sendingToId, setSendingToId] = useState(null);

   const [pagination, setPagination] = useState({
      offset: 0,
      limit: 20,
      hasMore: false,
      total: 0
   });

   const friendStatuses = useSelector(selectFriendStatuses);
   const friendsLoading = useSelector(selectFriendsLoading);

   const paginationLimitRef = useRef(pagination.limit);
   const friendStatusesRef = useRef(friendStatuses);

   useEffect(() => {
      paginationLimitRef.current = pagination.limit;
   }, [pagination.limit]);

   useEffect(() => {
      friendStatusesRef.current = friendStatuses;
   }, [friendStatuses]);

   const performSearch = useCallback(async (query, offset = 0, append = false) => {
      if (!query.trim()) {
         setSearchResults([]);
         setPagination(prev => ({ ...prev, hasMore: false, total: 0 }));
         return;
      }

      try {
         setLoading(true);
         setError(null);

         const response = await userAPI.searchUsers(query, null, {
            limit: paginationLimitRef.current,
            offset
         });

         const users = response.data?.data || [];
         const total = response.data?.count || users.length;

         setSearchResults(prev =>
            append ? [...prev, ...users] : users
         );

         setPagination(prev => ({
            ...prev,
            offset: offset + users.length,
            hasMore: (offset + users.length) < total,
            total
         }));

         // Всегда запрашиваем свежий статус для каждого найденного пользователя
         const statusPromises = users.map(user =>
            dispatch(fetchFriendStatus(user.id)).unwrap()
         );
         await Promise.all(statusPromises);

      } catch (err) {
         setError('Ошибка при поиске пользователей');
         console.error('Search error:', err);
      } finally {
         setLoading(false);
      }
   }, [dispatch]);

   const debouncedSearchRef = useRef(null);

   // eslint-disable-next-line react-hooks/exhaustive-deps
   useEffect(() => {
      debouncedSearchRef.current = debounce((query) => {
         if (query.trim()) {
            performSearch(query, 0, false);
         } else {
            setSearchResults([]);
            setPagination(prev => ({ ...prev, hasMore: false, total: 0 }));
         }
      }, 500);

      return () => {
         if (debouncedSearchRef.current) {
            debouncedSearchRef.current.cancel();
         }
      };
   }, [performSearch]);

   const handleSearchChange = (e) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (debouncedSearchRef.current) {
         debouncedSearchRef.current(query);
      }
   };

   const handleLoadMore = () => {
      if (pagination.hasMore && !loading) {
         performSearch(searchQuery, pagination.offset, true);
      }
   };

   const handleSendRequest = async (userId) => {
      setSendingToId(userId);
      await dispatch(sendFriendRequest({ receiverId: userId, message: '' }));
      setSendingToId(null);
      dispatch(fetchFriendStatus(userId));
   };

   const handleViewProfile = (userId) => {
      if (onUserClick) {
         onUserClick(userId);
      }
   };

   const getFriendButton = (user) => {
      const status = friendStatuses[user.id];

      if (!status) {
         return (
            <button
               className={`${styles.actionButton} ${styles.addButton}`}
               onClick={() => handleSendRequest(user.id)}
               disabled={sendingToId === user.id || friendsLoading.action}
            >
               {sendingToId === user.id ? (
                  <span className={styles.spinner}></span>
               ) : (
                  '➕ Добавить в друзья'
               )}
            </button>
         );
      }

      switch (status.status) {
         case 'pending':
            if (status.direction === 'outgoing') {
               return (
                  <button className={`${styles.actionButton} ${styles.pendingButton}`} disabled>
                     ⏳ Запрос отправлен
                  </button>
               );
            } else {
               return (
                  <button className={`${styles.actionButton} ${styles.acceptButton}`} disabled>
                     ✓ Ожидает ответа
                  </button>
               );
            }

         case 'accepted':
            return (
               <button className={`${styles.actionButton} ${styles.friendButton}`} disabled>
                  👥 Друзья
               </button>
            );

         case 'blocked':
            return (
               <button className={`${styles.actionButton} ${styles.blockedButton}`} disabled>
                  🔨 Заблокирован
               </button>
            );

         default:
            return (
               <button
                  className={`${styles.actionButton} ${styles.addButton}`}
                  onClick={() => handleSendRequest(user.id)}
                  disabled={sendingToId === user.id || friendsLoading.action}
               >
                  {sendingToId === user.id ? (
                     <span className={styles.spinner}></span>
                  ) : (
                     '➕ Добавить в друзья'
                  )}
               </button>
            );
      }
   };

   const getTrainingLevelLabel = (level) => {
      return TRAINING_LEVELS[level]?.label || level;
   };

   return (
      <div className={styles.searchContainer}>
         <div className={styles.searchHeader}>
            <h3>Поиск пользователей</h3>
            <p>Найдите новых друзей по имени, email или специализации</p>
         </div>

         <div className={styles.searchControls}>
            <div className={styles.searchBox}>
               <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Введите имя, email или специализацию..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
               />
               {loading && <div className={styles.searchSpinner}></div>}
            </div>
         </div>

         {error && (
            <div className={styles.errorMessage}>
               ⚠️ {error}
            </div>
         )}

         <div className={styles.searchResults}>
            {searchQuery.trim() === '' ? (
               <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <p>Введите имя или email для поиска</p>
               </div>
            ) : loading && searchResults.length === 0 ? (
               <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Поиск пользователей...</p>
               </div>
            ) : searchResults.length === 0 ? (
               <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>😕</div>
                  <p>Ничего не найдено</p>
                  <span className={styles.emptyHint}>
                     Попробуйте изменить запрос
                  </span>
               </div>
            ) : (
               <>
                  <div className={styles.resultsList}>
                     {searchResults.map((user) => (
                        <div key={user.id} className={styles.userCard}>
                           <div
                              className={styles.userAvatar}
                              onClick={() => handleViewProfile(user.id)}
                           >
                              {user.userAvatar ? (
                                 <img
                                    src={getAvatarUrl(user.userAvatar)}
                                    alt={user.userName}
                                    className={styles.userAvatarImage}
                                 />
                              ) : (
                                 user.userName?.charAt(0).toUpperCase() || 'U'
                              )}
                           </div>

                           <div className={styles.userInfo}>
                              <h4
                                 className={styles.userName}
                                 onClick={() => handleViewProfile(user.id)}
                              >
                                 {user.userName || 'Без имени'}
                              </h4>

                              <div className={styles.userMeta}>
                                 <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                                    {getUserRoleLabel(user.role)}
                                 </span>
                                 {user.training_level && (
                                    <span className={styles.levelBadge}>
                                       {getTrainingLevelLabel(user.training_level)}
                                    </span>
                                 )}
                              </div>

                              {user.sport_specialization && (
                                 <div className={styles.userSpecialization}>
                                    {user.sport_specialization.split(',').map((tag, i) => (
                                       <span key={i} className={styles.sportTag}>
                                          {tag.trim()}
                                       </span>
                                    ))}
                                 </div>
                              )}
                           </div>

                           <div className={styles.userActions}>
                              {getFriendButton(user)}
                           </div>
                        </div>
                     ))}
                  </div>

                  {pagination.hasMore && (
                     <button
                        className={styles.loadMoreButton}
                        onClick={handleLoadMore}
                        disabled={loading}
                     >
                        {loading ? 'Загрузка...' : 'Загрузить ещё'}
                     </button>
                  )}

                  <div className={styles.resultsInfo}>
                     Показано {searchResults.length} из {pagination.total}
                  </div>
               </>
            )}
         </div>
      </div>
   );
};

export default FriendSearch;