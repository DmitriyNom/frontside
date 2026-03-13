// UI/Components/ConnectionRequests.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   fetchIncomingRequests,
   fetchOutgoingRequests,
   fetchAllRequests,
   respondToRequest,
   cancelRequest,
   selectIncomingRequests,
   selectOutgoingRequests,
   selectAllRequests,
   selectIncomingRequestsLoading,
   selectOutgoingRequestsLoading,
   selectAllRequestsLoading,
   selectIncomingRequestsError,
   selectOutgoingRequestsError,
   selectAllRequestsError
} from '../../features/connectionsSlice';
import ConfirmationModal from './ConfirmationModal';
import { getAvatarUrl } from '../../api/api';
import styles from './ConnectionRequests.module.css';

const ConnectionRequests = ({ userRole }) => {
   const dispatch = useDispatch();
   const [showConfirmModal, setShowConfirmModal] = useState(false);
   const [modalData, setModalData] = useState({ type: '', requestId: null, action: '' });
   const [statusFilter, setStatusFilter] = useState('pending');
   const [viewMode, setViewMode] = useState('all'); // 'incoming', 'outgoing', 'all' - по умолчанию 'all'

   const isTrainer = userRole === 'тренер';

   // 🔍 ЛОГ 1: Проверяем роль пользователя при загрузке компонента
   console.log('🔍 [ConnectionRequests] Инициализация:', {
      userRole,
      isTrainer,
      viewMode,
      statusFilter,
      timestamp: new Date().toISOString()
   });

   // Получаем данные из Redux
   const incomingRequests = useSelector(selectIncomingRequests);
   const outgoingRequests = useSelector(selectOutgoingRequests);
   const allRequests = useSelector(selectAllRequests);

   const allIncoming = allRequests?.incoming || [];
   const allOutgoing = allRequests?.outgoing || [];

   // 🔍 ЛОГ 2: Проверяем полученные данные
   console.log('🔍 [ConnectionRequests] Данные из Redux:', {
      incomingRequestsCount: incomingRequests?.length || 0,
      outgoingRequestsCount: outgoingRequests?.length || 0,
      allIncomingCount: allIncoming.length,
      allOutgoingCount: allOutgoing.length,
      firstIncomingRequest: allIncoming[0] ? {
         id: allIncoming[0].id,
         status: allIncoming[0].status,
         sender_id: allIncoming[0].sender_id,
         receiver_id: allIncoming[0].receiver_id,
         sender: allIncoming[0].sender,
         receiver: allIncoming[0].receiver
      } : null,
      firstOutgoingRequest: allOutgoing[0] ? {
         id: allOutgoing[0].id,
         status: allOutgoing[0].status,
         sender_id: allOutgoing[0].sender_id,
         receiver_id: allOutgoing[0].receiver_id,
         sender: allOutgoing[0].sender,
         receiver: allOutgoing[0].receiver
      } : null
   });

   const isLoadingIncoming = useSelector(selectIncomingRequestsLoading);
   const isLoadingOutgoing = useSelector(selectOutgoingRequestsLoading);
   const isLoadingAll = useSelector(selectAllRequestsLoading);

   const errorIncoming = useSelector(selectIncomingRequestsError);
   const errorOutgoing = useSelector(selectOutgoingRequestsError);
   const errorAll = useSelector(selectAllRequestsError);

   // Определяем, какие данные показывать в зависимости от режима
   const getRequestsByMode = () => {
      switch (viewMode) {
         case 'incoming':
            return incomingRequests;
         case 'outgoing':
            return outgoingRequests;
         case 'all':
         default:
            return isTrainer ? allIncoming : allOutgoing;
      }
   };

   const getLoadingByMode = () => {
      switch (viewMode) {
         case 'incoming':
            return isLoadingIncoming;
         case 'outgoing':
            return isLoadingOutgoing;
         case 'all':
         default:
            return isLoadingAll;
      }
   };

   const getErrorByMode = () => {
      switch (viewMode) {
         case 'incoming':
            return errorIncoming;
         case 'outgoing':
            return errorOutgoing;
         case 'all':
         default:
            return errorAll;
      }
   };

   const requests = getRequestsByMode();
   const isLoading = getLoadingByMode();
   const error = getErrorByMode();

   // Загружаем запросы в зависимости от режима
   const loadRequests = useCallback(() => {
      console.log(`🔄 [loadRequests] Загрузка ${viewMode} запросов, статус: ${statusFilter}, isTrainer: ${isTrainer}`);

      switch (viewMode) {
         case 'incoming':
            console.log('📥 Загрузка входящих запросов');
            dispatch(fetchIncomingRequests({ status: statusFilter }));
            break;
         case 'outgoing':
            console.log('📤 Загрузка исходящих запросов');
            dispatch(fetchOutgoingRequests({ status: statusFilter }));
            break;
         case 'all':
         default:
            console.log('📋 Загрузка ВСЕХ запросов');
            dispatch(fetchAllRequests({ status: statusFilter }));
            break;
      }
   }, [viewMode, statusFilter, dispatch, isTrainer]);

   useEffect(() => {
      loadRequests();
   }, [loadRequests]);

   // Обработчики действий
   const handleRespondToRequest = (requestId, action) => {
      console.log(`🎯 [handleRespondToRequest] ${action} запрос ${requestId}`);

      // Определяем текст сообщения в зависимости от роли
      let message = '';
      if (action === 'accept') {
         message = isTrainer
            ? 'Вы примете этого подопечного в свои ученики.'
            : 'Вы начнете тренировки с этим тренером.';
      } else {
         message = 'Вы отклоните запрос на подключение. Это действие нельзя отменить.';
      }

      setModalData({
         type: 'respond',
         requestId,
         action,
         title: action === 'accept' ? 'Принять запрос?' : 'Отклонить запрос?',
         message
      });
      setShowConfirmModal(true);
   };

   const handleCancelRequest = (requestId) => {
      console.log(`🚫 [handleCancelRequest] Отмена запроса ${requestId}`);

      // Определяем текст сообщения в зависимости от роли
      const message = isTrainer
         ? 'Вы отмените приглашение, отправленное подопечному.'
         : 'Вы отмените запрос на подключение к тренеру.';

      setModalData({
         type: 'cancel',
         requestId,
         title: 'Отменить запрос?',
         message
      });
      setShowConfirmModal(true);
   };

   const confirmAction = async () => {
      console.log(`✅ [confirmAction] Подтверждение действия:`, modalData);
      try {
         if (modalData.type === 'respond') {
            await dispatch(respondToRequest({
               requestId: modalData.requestId,
               action: modalData.action
            })).unwrap();
            console.log(`✅ Запрос ${modalData.requestId} успешно ${modalData.action === 'accept' ? 'принят' : 'отклонен'}`);
         } else if (modalData.type === 'cancel') {
            await dispatch(cancelRequest(modalData.requestId)).unwrap();
            console.log(`✅ Запрос ${modalData.requestId} успешно отменен`);
         }
         loadRequests();
      } catch (error) {
         console.error('❌ Ошибка:', error);
         alert(`❌ Ошибка: ${error.message || 'Не удалось выполнить действие'}`);
      } finally {
         setShowConfirmModal(false);
         setModalData({ type: '', requestId: null, action: '' });
      }
   };

   // Вспомогательные функции
   const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
         day: 'numeric',
         month: 'short',
         year: 'numeric'
      });
   };

   const getStatusText = (status) => {
      const statusMap = {
         pending: 'Ожидает',
         accepted: 'Принят',
         rejected: 'Отклонен',
         cancelled: 'Отменен'
      };
      return statusMap[status] || status;
   };

   const getStatusClass = (status) => {
      const statusClassMap = {
         pending: styles.statusPending,
         accepted: styles.statusAccepted,
         rejected: styles.statusRejected,
         cancelled: styles.statusCancelled
      };
      return statusClassMap[status] || '';
   };

   // Рендер карточки запроса
   const renderRequestCard = (request, direction) => {
      const isIncoming = direction === 'incoming';

      // 🔍 ЛОГ 3: Детальный лог для каждой карточки
      console.log(`🎴 [renderRequestCard] Карточка запроса ${request.id}:`, {
         requestId: request.id,
         direction,
         isIncoming,
         // Текущий пользователь
         currentUser: {
            role: userRole,
            isTrainer
         },
         // Данные запроса
         requestData: {
            status: request.status,
            sender_id: request.sender_id,
            receiver_id: request.receiver_id,
            sender: request.sender ? {
               id: request.sender.id,
               userName: request.sender.userName,
               role: request.sender.role
            } : null,
            receiver: request.receiver ? {
               id: request.receiver.id,
               userName: request.receiver.userName,
               role: request.receiver.role
            } : null
         },
         // Проверка условий для отображения кнопок (новая логика)
         conditions: {
            isIncoming,
            isPending: request.status === 'pending',
            // Новая логика: любой входящий запрос показывает кнопки принять/отклонить
            showAcceptReject: isIncoming && request.status === 'pending',
            // Новая логика: любой исходящий запрос показывает кнопку отмены
            showCancel: !isIncoming && request.status === 'pending'
         },
         // Итоговый пользователь для отображения
         displayUser: isIncoming ? {
            type: 'sender',
            id: request.sender_id,
            name: request.sender?.userName,
            role: request.sender?.role
         } : {
            type: 'receiver',
            id: request.receiver_id,
            name: request.receiver?.userName,
            role: request.receiver?.role
         }
      });

      let user = null;
      if (isIncoming) {
         user = {
            id: request.sender_id,
            userName: request.sender?.userName || 'Пользователь',
            email: request.sender?.email || '',
            userAvatar: request.sender?.userAvatar,
            training_level: request.sender?.training_level,
            role: request.sender?.role
         };
      } else {
         user = {
            id: request.receiver_id,
            userName: request.receiver?.userName || 'Пользователь',
            email: request.receiver?.email || '',
            userAvatar: request.receiver?.userAvatar,
            sport_specialization: request.receiver?.sport_specialization,
            role: request.receiver?.role
         };
      }

      return (
         <div key={request.id} className={styles.requestCard}>
            <div className={styles.userInfo}>
               <img
                  src={getAvatarUrl(user?.userAvatar)}
                  alt="Аватар"
                  className={styles.avatar}
                  onError={(e) => {
                     e.target.src = '/default-avatar.png';
                  }}
               />
               <div className={styles.userDetails}>
                  <h4 className={styles.userName}>
                     {user?.userName || 'Неизвестный пользователь'}
                  </h4>
                  <p className={styles.userEmail}>{user?.email}</p>

                  {user?.training_level && (
                     <p className={styles.userLevel}>
                        Уровень: <span>{user.training_level}</span>
                     </p>
                  )}

                  {user?.sport_specialization && (
                     <p className={styles.userSpecialization}>
                        Специализация: <span>{user.sport_specialization}</span>
                     </p>
                  )}

                  {/* 🔍 Отображаем роли для отладки (можно удалить после тестирования) */}
                  <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
                     {isIncoming ? '👤 От:' : '👤 Кому:'} {user?.role || 'не указана'}
                     {!isIncoming && request.sender?.role && ` (отправитель: ${request.sender.role})`}
                  </div>
               </div>
            </div>

            <div className={styles.requestDetails}>
               {request.message && (
                  <div className={styles.message}>
                     <strong>Сообщение:</strong>
                     <p>"{request.message}"</p>
                  </div>
               )}
               <div className={styles.metaInfo}>
                  <span className={styles.date}>
                     {isIncoming ? 'Получен:' : 'Отправлен:'} {formatDate(request.created_at)}
                  </span>
                  <span className={`${styles.status} ${getStatusClass(request.status)}`}>
                     {getStatusText(request.status)}
                  </span>
               </div>
            </div>

            <div className={styles.actions}>
               {/* 🔴 ИСПРАВЛЕНО: Любой входящий запрос показывает кнопки принять/отклонить */}
               {isIncoming && request.status === 'pending' && (
                  <>
                     <button
                        onClick={() => handleRespondToRequest(request.id, 'accept')}
                        className={`${styles.actionButton} ${styles.acceptButton}`}
                        type="button"
                     >
                        ✅ {isTrainer ? 'Принять в ученики' : 'Принять тренера'}
                     </button>
                     <button
                        onClick={() => handleRespondToRequest(request.id, 'reject')}
                        className={`${styles.actionButton} ${styles.rejectButton}`}
                        type="button"
                     >
                        ❌ Отклонить
                     </button>
                  </>
               )}

               {/* 🔴 ИСПРАВЛЕНО: Любой исходящий запрос показывает кнопку отмены */}
               {!isIncoming && request.status === 'pending' && (
                  <button
                     onClick={() => handleCancelRequest(request.id)}
                     className={`${styles.actionButton} ${styles.cancelButton}`}
                     type="button"
                  >
                     🚫 {isTrainer ? 'Отменить приглашение' : 'Отменить запрос'}
                  </button>
               )}

               {/* Кнопка просмотра профиля (всегда) */}
               <button
                  onClick={() => {
                     console.log('Переход к профилю:', user?.id);
                     // Здесь будет навигация на страницу профиля
                  }}
                  className={`${styles.actionButton} ${styles.viewButton}`}
                  type="button"
               >
                  👤 Профиль
               </button>
            </div>
         </div>
      );
   };

   // Рендер контента в зависимости от режима
   const renderContent = () => {
      if (viewMode === 'all') {
         // Режим "Все запросы" - две секции
         return (
            <div className={styles.requestsContainer}>
               {allIncoming.length > 0 && (
                  <div className={styles.section}>
                     <h3 className={styles.sectionTitle}>
                        📥 Входящие запросы <span className={styles.sectionCount}>({allIncoming.length})</span>
                     </h3>
                     <div className={styles.requestsList}>
                        {allIncoming.map(request => renderRequestCard(request, 'incoming'))}
                     </div>
                  </div>
               )}

               {allOutgoing.length > 0 && (
                  <div className={styles.section}>
                     <h3 className={styles.sectionTitle}>
                        📤 Исходящие запросы <span className={styles.sectionCount}>({allOutgoing.length})</span>
                     </h3>
                     <div className={styles.requestsList}>
                        {allOutgoing.map(request => renderRequestCard(request, 'outgoing'))}
                     </div>
                  </div>
               )}

               {allIncoming.length === 0 && allOutgoing.length === 0 && (
                  <div className={styles.emptyState}>
                     <div className={styles.emptyIcon}>📭</div>
                     <h3>Нет запросов</h3>
                     <p>У вас нет запросов на подключение.</p>
                  </div>
               )}
            </div>
         );
      } else {
         // Режим "Входящие" или "Исходящие"
         return requests.length > 0 ? (
            <div className={styles.requestsList}>
               {requests.map(request => renderRequestCard(
                  request,
                  viewMode === 'incoming' ? 'incoming' : 'outgoing'
               ))}
            </div>
         ) : (
            <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>📭</div>
               <h3>Нет запросов</h3>
               <p>
                  {viewMode === 'incoming'
                     ? 'У вас нет входящих запросов на подключение.'
                     : 'У вас нет исходящих запросов.'}
               </p>
               {statusFilter !== 'pending' && (
                  <button
                     onClick={() => setStatusFilter('pending')}
                     className={styles.emptyButton}
                     type="button"
                  >
                     Показать ожидающие запросы
                  </button>
               )}
            </div>
         );
      }
   };

   return (
      <div className={styles.container}>
         {/* Заголовок и переключатель режимов */}
         <div className={styles.header}>
            <div className={styles.headerTop}>
               <h2 className={styles.title}>
                  Запросы на подключение
               </h2>

               {/* ✅ Сегментированный переключатель с тремя кнопками */}
               <div className={styles.viewModeToggle}>
                  <button
                     className={`${styles.viewModeButton} ${viewMode === 'all' ? styles.activeViewMode : ''}`}
                     onClick={() => setViewMode('all')}
                     type="button"
                  >
                     📋 Все
                  </button>
                  <button
                     className={`${styles.viewModeButton} ${viewMode === 'incoming' ? styles.activeViewMode : ''}`}
                     onClick={() => setViewMode('incoming')}
                     type="button"
                  >
                     📥 Входящие
                  </button>
                  <button
                     className={`${styles.viewModeButton} ${viewMode === 'outgoing' ? styles.activeViewMode : ''}`}
                     onClick={() => setViewMode('outgoing')}
                     type="button"
                  >
                     📤 Исходящие
                  </button>
               </div>
            </div>

            {/* Фильтр по статусу */}
            <div className={styles.statusFilter}>
               <label htmlFor="statusFilter">Статус:</label>
               <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.statusSelect}
               >
                  <option value="pending">Ожидающие</option>
                  <option value="accepted">Принятые</option>
                  <option value="rejected">Отклоненные</option>
                  <option value="cancelled">Отмененные</option>
               </select>
            </div>
         </div>

         {/* Основной контент */}
         <div className={styles.content}>
            {/* Загрузка */}
            {isLoading && (
               <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Загружаем запросы...</p>
               </div>
            )}

            {/* Ошибка */}
            {error && !isLoading && (
               <div className={styles.errorState}>
                  <p className={styles.errorMessage}>Ошибка: {error}</p>
                  <button onClick={loadRequests} className={styles.retryButton} type="button">
                     Повторить попытку
                  </button>
               </div>
            )}

            {/* Контент */}
            {!isLoading && !error && renderContent()}
         </div>

         {/* Модальное окно подтверждения */}
         <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmAction}
            title={modalData.title}
            message={modalData.message}
            confirmText={
               modalData.type === 'cancel' ? 'Отменить' :
                  modalData.action === 'accept' ? 'Принять' : 'Отклонить'
            }
            cancelText="Назад"
            confirmVariant={
               modalData.type === 'cancel' ? 'warning' :
                  modalData.action === 'accept' ? 'success' : 'danger'
            }
         />
      </div>
   );
};

export default ConnectionRequests;