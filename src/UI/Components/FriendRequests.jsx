import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
   respondToFriendRequest,
   cancelFriendRequest,
   selectIncomingRequests,
   selectOutgoingRequests,
   selectFriendsLoading
} from '../../features/friendsSlice';
import { getUserRoleLabel } from '../../constants/userRoles';
import styles from './FriendRequests.module.css';

const FriendRequests = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const [processingId, setProcessingId] = useState(null);

   const incomingRequests = useSelector(selectIncomingRequests);
   const outgoingRequests = useSelector(selectOutgoingRequests);
   const loading = useSelector(selectFriendsLoading);

   const handleAccept = async (requestId) => {
      setProcessingId(requestId);
      await dispatch(respondToFriendRequest({ requestId, action: 'accept' }));
      setProcessingId(null);
   };

   const handleReject = async (requestId) => {
      setProcessingId(requestId);
      await dispatch(respondToFriendRequest({ requestId, action: 'reject' }));
      setProcessingId(null);
   };

   const handleCancel = async (requestId) => {
      setProcessingId(requestId);
      await dispatch(cancelFriendRequest(requestId));
      setProcessingId(null);
   };

   const handleViewProfile = (userId) => {
      navigate(`/user/${userId}`);
   };

   const formatDate = (dateString) => {
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

      return incomingRequests.map((request) => (
         <div key={request.id} className={styles.requestItem}>
            <div className={styles.requestUserInfo}>
               <div
                  className={styles.requestAvatar}
                  onClick={() => handleViewProfile(request.user?.id)}
               >
                  {request.user?.userName?.charAt(0).toUpperCase() || 'U'}
               </div>
               <div className={styles.requestDetails}>
                  <span
                     className={styles.requestName}
                     onClick={() => handleViewProfile(request.user?.id)}
                  >
                     {request.user?.userName || 'Пользователь'}
                  </span>
                  <span className={styles.requestMeta}>
                     <span className={`${styles.roleBadge} ${styles[request.user?.role]}`}>
                        {getUserRoleLabel(request.user?.role)}
                     </span>
                     <span className={styles.requestDate}>
                        {formatDate(request.createdAt)}
                     </span>
                  </span>
                  {request.message && (
                     <span className={styles.requestMessage}>
                        💬 {request.message}
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
                  {processingId === request.id ? '...' : '✓ Принять'}
               </button>
               <button
                  className={`${styles.actionButton} ${styles.rejectButton}`}
                  onClick={() => handleReject(request.id)}
                  disabled={loading.action || processingId === request.id}
               >
                  {processingId === request.id ? '...' : '✗ Отклонить'}
               </button>
            </div>
         </div>
      ));
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

      return outgoingRequests.map((request) => (
         <div key={request.id} className={styles.requestItem}>
            <div className={styles.requestUserInfo}>
               <div
                  className={styles.requestAvatar}
                  onClick={() => handleViewProfile(request.user?.id)}
               >
                  {request.user?.userName?.charAt(0).toUpperCase() || 'U'}
               </div>
               <div className={styles.requestDetails}>
                  <span
                     className={styles.requestName}
                     onClick={() => handleViewProfile(request.user?.id)}
                  >
                     {request.user?.userName || 'Пользователь'}
                  </span>
                  <span className={styles.requestMeta}>
                     <span className={`${styles.roleBadge} ${styles[request.user?.role]}`}>
                        {getUserRoleLabel(request.user?.role)}
                     </span>
                     <span className={styles.requestDate}>
                        {formatDate(request.createdAt)}
                     </span>
                  </span>
                  {request.message && (
                     <span className={styles.requestMessage}>
                        💬 {request.message}
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
                  {processingId === request.id ? '...' : '✕ Отменить'}
               </button>
            </div>
         </div>
      ));
   };

   return (
      <div className={styles.requestsContainer}>
         {/* Входящие запросы */}
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

         {/* Исходящие запросы */}
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

         {/* Подсказка */}
         <div className={styles.hint}>
            💡 Запросы автоматически удаляются через 30 дней без ответа
         </div>
      </div>
   );
};

export default FriendRequests;