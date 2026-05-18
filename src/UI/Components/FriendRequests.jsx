import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   respondToFriendRequest,
   cancelFriendRequest,
   fetchFriendRequests,
   selectIncomingRequests,
   selectOutgoingRequests,
   selectFriendsLoading
} from '../../features/friendsSlice';
import { getUserRoleLabel } from '../../constants/userRoles';
import styles from './FriendRequests.module.css';

const FriendRequests = ({ onUserClick }) => {
   const dispatch = useDispatch();

   const [processingId, setProcessingId] = useState(null);

   const incomingRequests = useSelector(selectIncomingRequests);
   const outgoingRequests = useSelector(selectOutgoingRequests);
   const loading = useSelector(selectFriendsLoading);

   // Отладка
   console.log('🔥 FriendRequests render');
   console.log('📥 incomingRequests:', JSON.stringify(incomingRequests, null, 2));
   console.log('📤 outgoingRequests:', JSON.stringify(outgoingRequests, null, 2));

   useEffect(() => {
      console.log('🔄 FriendRequests mounted, fetching requests...');
      dispatch(fetchFriendRequests({ direction: 'all' }))
         .then((result) => {
            console.log('✅ fetchFriendRequests result:', result);
         })
         .catch((err) => {
            console.error('❌ fetchFriendRequests error:', err);
         });
   }, [dispatch]);

   // ✅ Функция для получения данных пользователя из запроса
   const getUserFromRequest = (request) => {
      // Для исходящих запросов данные получателя в поле recipient
      if (request.direction === 'outgoing') {
         return request.recipient || request.user || null;
      }
      // Для входящих запросов данные отправителя в поле initiator
      if (request.direction === 'incoming') {
         return request.initiator || request.user || null;
      }
      // Fallback
      return request.user || null;
   };

   const handleAccept = async (requestId) => {
      console.log('✓ Accepting request:', requestId);
      setProcessingId(requestId);
      const result = await dispatch(respondToFriendRequest({ requestId, action: 'accept' }));
      console.log('📦 Accept result:', result);
      await dispatch(fetchFriendRequests({ direction: 'all' }));
      setProcessingId(null);
      window.dispatchEvent(new CustomEvent('refreshFriendRequests'));
   };

   const handleReject = async (requestId) => {
      console.log('✗ Rejecting request:', requestId);
      setProcessingId(requestId);
      const result = await dispatch(respondToFriendRequest({ requestId, action: 'reject' }));
      console.log('📦 Reject result:', result);
      await dispatch(fetchFriendRequests({ direction: 'all' }));
      setProcessingId(null);
      window.dispatchEvent(new CustomEvent('refreshFriendRequests'));
   };

   const handleCancel = async (requestId) => {
      console.log('✕ Cancelling request:', requestId);
      setProcessingId(requestId);
      const result = await dispatch(cancelFriendRequest(requestId));
      console.log('📦 Cancel result:', result);
      await dispatch(fetchFriendRequests({ direction: 'all' }));
      setProcessingId(null);
      window.dispatchEvent(new CustomEvent('refreshFriendRequests'));
   };

   const handleViewProfile = (userId) => {
      console.log('👆 View profile clicked for userId:', userId);
      if (userId && onUserClick) {
         onUserClick(userId);
      } else if (!userId) {
         console.warn('⚠️ userId is undefined, cannot open modal');
      }
   };

   const formatDate = (dateString) => {
      if (!dateString) return 'Дата неизвестна';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
         return 'Сегодня';
      } else if (diffDays === 1) {
         return 'Вчера';
      } else if (diffDays < 7) {
         return `${diffDays} дня назад`;
      } else {
         return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
         });
      }
   };

   const renderIncomingRequests = () => {
      if (incomingRequests.length === 0) {
         return (
            <div className={styles.emptySection}>
               <div className={styles.emptyIcon}>📭</div>
               <p>Нет входящих запросов</p>
            </div>
         );
      }

      return incomingRequests.map((request) => {
         const user = getUserFromRequest(request);

         // Отладка
         console.log('🔍 Incoming request detail:', {
            id: request.id,
            direction: request.direction,
            user: user,
            userId: user?.id,
            userName: user?.userName,
            role: user?.role,
            rawRequest: request
         });

         return (
            <div key={request.id} className={styles.requestItem}>
               <div className={styles.requestUserInfo}>
                  <div
                     className={styles.requestAvatar}
                     onClick={() => handleViewProfile(user?.id)}
                  >
                     {user?.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className={styles.requestDetails}>
                     <span
                        className={styles.requestName}
                        onClick={() => handleViewProfile(user?.id)}
                     >
                        {user?.userName || 'Пользователь'}
                     </span>
                     <span className={styles.requestMeta}>
                        <span className={`${styles.roleBadge} ${styles[user?.role]}`}>
                           {getUserRoleLabel(user?.role)}
                        </span>
                        <span className={styles.requestDate}>
                           {formatDate(request.createdAt || request.created_at)}
                        </span>
                     </span>
                     {request.message && (
                        <span className={styles.requestMessage}>
                           {request.message}
                        </span>
                     )}
                  </div>
               </div>

               <div className={styles.requestActions}>
                  <button
                     className={`${styles.actionButton} ${styles.acceptButton}`}
                     onClick={() => handleAccept(request.id)}
                     disabled={loading.action || processingId === request.id}
                  >
                     {processingId === request.id ? '...' : 'Принять'}
                  </button>
                  <button
                     className={`${styles.actionButton} ${styles.rejectButton}`}
                     onClick={() => handleReject(request.id)}
                     disabled={loading.action || processingId === request.id}
                  >
                     {processingId === request.id ? '...' : 'Отклонить'}
                  </button>
               </div>
            </div>
         );
      });
   };

   const renderOutgoingRequests = () => {
      if (outgoingRequests.length === 0) {
         return (
            <div className={styles.emptySection}>
               <div className={styles.emptyIcon}>📤</div>
               <p>Нет исходящих запросов</p>
            </div>
         );
      }

      return outgoingRequests.map((request) => {
         const user = getUserFromRequest(request);

         // Отладка
         console.log('🔍 Outgoing request detail:', {
            id: request.id,
            direction: request.direction,
            user: user,
            userId: user?.id,
            userName: user?.userName,
            role: user?.role,
            rawRequest: request
         });

         return (
            <div key={request.id} className={styles.requestItem}>
               <div className={styles.requestUserInfo}>
                  <div
                     className={styles.requestAvatar}
                     onClick={() => handleViewProfile(user?.id)}
                  >
                     {user?.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className={styles.requestDetails}>
                     <span
                        className={styles.requestName}
                        onClick={() => handleViewProfile(user?.id)}
                     >
                        {user?.userName || 'Пользователь'}
                     </span>
                     <span className={styles.requestMeta}>
                        <span className={`${styles.roleBadge} ${styles[user?.role]}`}>
                           {getUserRoleLabel(user?.role)}
                        </span>
                        <span className={styles.requestDate}>
                           {formatDate(request.createdAt || request.created_at)}
                        </span>
                     </span>
                     {request.message && (
                        <span className={styles.requestMessage}>
                           {request.message}
                        </span>
                     )}
                  </div>
               </div>

               <div className={styles.requestActions}>
                  <button
                     className={`${styles.actionButton} ${styles.cancelButton}`}
                     onClick={() => handleCancel(request.id)}
                     disabled={loading.action || processingId === request.id}
                  >
                     {processingId === request.id ? '...' : 'Отменить'}
                  </button>
               </div>
            </div>
         );
      });
   };

   return (
      <div className={styles.requestsContainer}>
         <section className={styles.requestsSection}>
            <h3>
               Входящие запросы
               {incomingRequests.length > 0 && (
                  <span className={styles.sectionBadge}>{incomingRequests.length}</span>
               )}
            </h3>
            <div className={styles.requestsList}>
               {renderIncomingRequests()}
            </div>
         </section>

         <section className={styles.requestsSection}>
            <h3>
               Исходящие запросы
               {outgoingRequests.length > 0 && (
                  <span className={styles.sectionBadge}>{outgoingRequests.length}</span>
               )}
            </h3>
            <div className={styles.requestsList}>
               {renderOutgoingRequests()}
            </div>
         </section>

         <div className={styles.hint}>
            Запросы автоматически удаляются через 30 дней без ответа
         </div>
      </div>
   );
};

export default FriendRequests;