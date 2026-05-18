// import React, { useEffect, useState, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//    fetchFriendStatus,
//    sendFriendRequest,
//    respondToFriendRequest,
//    cancelFriendRequest,
//    removeFriend,
//    blockUser,
//    unblockUser,
//    selectFriendStatuses,
//    selectFriendsLoading
// } from '../../features/friendsSlice';
// import styles from './FriendButton.module.css';

// const FriendButton = ({ userId, userName, onStatusChange, size = 'medium' }) => {
//    const dispatch = useDispatch();
//    const [showConfirm, setShowConfirm] = useState(false);
//    const [localLoading, setLocalLoading] = useState(false);

//    const status = useSelector((state) => selectFriendStatuses(state)[userId]);
//    const loading = useSelector(selectFriendsLoading);

//    // Загружаем статус при монтировании
//    useEffect(() => {
//       if (userId) {
//          dispatch(fetchFriendStatus(userId));
//       }
//    }, [dispatch, userId]);

//    // Общий обработчик с управлением локальным loading
//    const handleAction = useCallback(async (action, ...args) => {
//       setLocalLoading(true);
//       try {
//          await action(...args);
//          if (onStatusChange) onStatusChange();
//       } catch (error) {
//          console.error('Friend action error:', error);
//       } finally {
//          setLocalLoading(false);
//       }
//    }, [onStatusChange]);

//    const handleSendRequest = useCallback(() => {
//       handleAction(() => dispatch(sendFriendRequest({ receiverId: userId })));
//    }, [dispatch, userId, handleAction]);

//    const handleRespondToRequest = useCallback((action) => {
//       if (status?.requestId) {
//          handleAction(() => dispatch(respondToFriendRequest({
//             requestId: status.requestId,
//             action
//          })));
//       }
//    }, [dispatch, status?.requestId, handleAction]);

//    const handleCancelRequest = useCallback(() => {
//       if (status?.requestId) {
//          handleAction(() => dispatch(cancelFriendRequest(status.requestId)));
//       }
//    }, [dispatch, status?.requestId, handleAction]);

//    const handleRemoveFriend = useCallback(() => {
//       handleAction(() => dispatch(removeFriend(userId)))
//          .then(() => setShowConfirm(false));
//    }, [dispatch, userId, handleAction]);

//    const handleBlockUser = useCallback(() => {
//       handleAction(() => dispatch(blockUser(userId)))
//          .then(() => setShowConfirm(false));
//    }, [dispatch, userId, handleAction]);

//    const handleUnblockUser = useCallback(() => {
//       handleAction(() => dispatch(unblockUser(userId)));
//    }, [dispatch, userId, handleAction]);

//    const isLoading = localLoading || loading?.action;

//    // Если статус еще загружается
//    if (!status && isLoading) {
//       return (
//          <button className={`${styles.button} ${styles.loading} ${styles[size]}`} disabled>
//             <span className={styles.spinner}></span>
//             Загрузка...
//          </button>
//       );
//    }

//    // Рендер кнопки в зависимости от статуса
//    const renderButton = () => {
//       if (!status) {
//          // Нет отношений
//          return (
//             <button
//                className={`${styles.button} ${styles.primary} ${styles[size]}`}
//                onClick={handleSendRequest}
//                disabled={isLoading}
//             >
//                <span className={styles.icon}>➕</span>
//                <span className={styles.buttonText}>Добавить в друзья</span>
//             </button>
//          );
//       }

//       switch (status.status) {
//          case 'pending':
//             if (status.direction === 'outgoing') {
//                // Исходящий запрос
//                return (
//                   <button
//                      className={`${styles.button} ${styles.cancel} ${styles[size]}`}
//                      onClick={handleCancelRequest}
//                      disabled={isLoading}
//                   >
//                      <span className={styles.icon}>⏳</span>
//                      <span className={styles.buttonText}>Отменить запрос</span>
//                   </button>
//                );
//             } else {
//                // Входящий запрос
//                return (
//                   <div className={styles.buttonGroup}>
//                      <button
//                         className={`${styles.button} ${styles.accept} ${styles[size]}`}
//                         onClick={() => handleRespondToRequest('accept')}
//                         disabled={isLoading}
//                      >
//                         <span className={styles.icon}>✓</span>
//                         <span className={styles.buttonText}>Принять</span>
//                      </button>
//                      <button
//                         className={`${styles.button} ${styles.reject} ${styles[size]}`}
//                         onClick={() => handleRespondToRequest('reject')}
//                         disabled={isLoading}
//                      >
//                         <span className={styles.icon}>✗</span>
//                         <span className={styles.buttonText}>Отклонить</span>
//                      </button>
//                   </div>
//                );
//             }

//          case 'accepted':
//             // Уже друзья
//             return (
//                <>
//                   {showConfirm ? (
//                      <div className={styles.confirmGroup}>
//                         <span className={styles.confirmText}>
//                            Удалить {userName || 'пользователя'} из друзей?
//                         </span>
//                         <button
//                            className={`${styles.button} ${styles.confirmYes} ${styles.small}`}
//                            onClick={handleRemoveFriend}
//                            disabled={isLoading}
//                         >
//                            {isLoading ? <span className={styles.spinner}></span> : 'Да'}
//                         </button>
//                         <button
//                            className={`${styles.button} ${styles.confirmNo} ${styles.small}`}
//                            onClick={() => setShowConfirm(false)}
//                            disabled={isLoading}
//                         >
//                            Нет
//                         </button>
//                      </div>
//                   ) : (
//                      <button
//                         className={`${styles.button} ${styles.remove} ${styles[size]}`}
//                         onClick={() => setShowConfirm(true)}
//                         disabled={isLoading}
//                      >
//                         <span className={styles.icon}>👥</span>
//                         <span className={styles.buttonText}>Удалить из друзей</span>
//                      </button>
//                   )}
//                </>
//             );

//          case 'blocked':
//             // Заблокирован
//             return (
//                <button
//                   className={`${styles.button} ${styles.unblock} ${styles[size]}`}
//                   onClick={handleUnblockUser}
//                   disabled={isLoading}
//                >
//                   <span className={styles.icon}>🔓</span>
//                   <span className={styles.buttonText}>Разблокировать</span>
//                </button>
//             );

//          default:
//             return null;
//       }
//    };

//    // Проверяем, нужно ли показывать кнопку блокировки
//    const shouldShowBlockButton = () => {
//       if (!status) return true; // Нет отношений - можно заблокировать
//       if (status.status === 'blocked') return false; // Уже заблокирован
//       if (status.status === 'pending' && status.direction === 'incoming') return false; // Входящий запрос
//       return true;
//    };

//    return (
//       <div className={styles.container}>
//          {renderButton()}

//          {/* Кнопка блокировки */}
//          {shouldShowBlockButton() && (
//             <button
//                className={`${styles.iconButton} ${styles.blockIcon} ${styles[size]}`}
//                onClick={handleBlockUser}
//                title="Заблокировать пользователя"
//                disabled={isLoading}
//             >
//                <span className={styles.icon}>🔨</span>
//                {size === 'large' && <span className={styles.buttonText}>Заблокировать</span>}
//             </button>
//          )}
//       </div>
//    );
// };

// export default FriendButton;



// frontend/src/UI/Components/FriendButton.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   fetchFriendStatus,
   sendFriendRequest,
   respondToFriendRequest,
   cancelFriendRequest,
   removeFriend,
   selectFriendStatuses,
   selectFriendsLoading
} from '../../features/friendsSlice';
import commonStyles from '../../styles/friends-common.module.css';

const FriendButton = ({ userId, userName, onStatusChange, size = 'medium' }) => {
   const dispatch = useDispatch();
   const [showConfirm, setShowConfirm] = useState(false);
   const [localLoading, setLocalLoading] = useState(false);

   const status = useSelector((state) => selectFriendStatuses(state)[userId]);
   const loading = useSelector(selectFriendsLoading);

   useEffect(() => {
      if (userId) {
         dispatch(fetchFriendStatus(userId));
      }
   }, [dispatch, userId]);

   const handleAction = useCallback(async (action, ...args) => {
      setLocalLoading(true);
      try {
         await action(...args);
         if (onStatusChange) onStatusChange();
      } catch (error) {
         console.error('Friend action error:', error);
      } finally {
         setLocalLoading(false);
      }
   }, [onStatusChange]);

   const handleSendRequest = useCallback(() => {
      handleAction(() => dispatch(sendFriendRequest({ receiverId: userId })));
   }, [dispatch, userId, handleAction]);

   const handleRespondToRequest = useCallback((action) => {
      if (status?.requestId) {
         handleAction(() => dispatch(respondToFriendRequest({
            requestId: status.requestId,
            action
         })));
      }
   }, [dispatch, status?.requestId, handleAction]);

   const handleCancelRequest = useCallback(() => {
      if (status?.requestId) {
         handleAction(() => dispatch(cancelFriendRequest(status.requestId)));
      }
   }, [dispatch, status?.requestId, handleAction]);

   const handleRemoveFriend = useCallback(() => {
      handleAction(() => dispatch(removeFriend(userId)))
         .then(() => setShowConfirm(false));
   }, [dispatch, userId, handleAction]);

   const isLoading = localLoading || loading?.action;

   // Если статус еще загружается
   if (!status && isLoading) {
      return (
         <button className={`${commonStyles.textButton} ${commonStyles.secondary}`} disabled>
            <span className={commonStyles.spinner}></span>
         </button>
      );
   }

   // Если нет статуса — кнопка "Добавить в друзья"
   if (!status) {
      return (
         <button
            className={commonStyles.textButton}
            onClick={handleSendRequest}
            disabled={isLoading}
         >
            {isLoading ? <span className={commonStyles.spinner}></span> : '➕ Добавить'}
         </button>
      );
   }

   // В зависимости от статуса
   switch (status.status) {
      case 'pending':
         if (status.direction === 'outgoing') {
            // Исходящий запрос
            return (
               <button
                  className={`${commonStyles.textButton} ${commonStyles.secondary}`}
                  onClick={handleCancelRequest}
                  disabled={isLoading}
               >
                  {isLoading ? <span className={commonStyles.spinner}></span> : '⏳ Отменить'}
               </button>
            );
         } else {
            // Входящий запрос — две кнопки
            return (
               <div className={commonStyles.actions}>
                  <button
                     className={`${commonStyles.iconButton} ${commonStyles.success}`}
                     onClick={() => handleRespondToRequest('accept')}
                     disabled={isLoading}
                     title="Принять"
                  >
                     ✓
                  </button>
                  <button
                     className={`${commonStyles.iconButton} ${commonStyles.danger}`}
                     onClick={() => handleRespondToRequest('reject')}
                     disabled={isLoading}
                     title="Отклонить"
                  >
                     ✗
                  </button>
               </div>
            );
         }

      case 'accepted':
         // Уже друзья
         if (showConfirm) {
            return (
               <div className={commonStyles.confirmGroup}>
                  <button
                     className={`${commonStyles.confirmButton} ${commonStyles.yes}`}
                     onClick={handleRemoveFriend}
                     disabled={isLoading}
                  >
                     ✓
                  </button>
                  <button
                     className={`${commonStyles.confirmButton} ${commonStyles.no}`}
                     onClick={() => setShowConfirm(false)}
                     disabled={isLoading}
                  >
                     ✗
                  </button>
               </div>
            );
         }
         return (
            <button
               className={`${commonStyles.textButton} ${commonStyles.secondary}`}
               onClick={() => setShowConfirm(true)}
               disabled={isLoading}
            >
               {isLoading ? <span className={commonStyles.spinner}></span> : '👥 Друзья'}
            </button>
         );

      case 'blocked':
         return (
            <button
               className={`${commonStyles.textButton} ${commonStyles.secondary}`}
               disabled
            >
               🔨 Заблокирован
            </button>
         );

      default:
         return null;
   }
};

export default FriendButton;