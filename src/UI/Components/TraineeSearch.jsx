// UI/Components/TraineeSearch.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   searchTrainees,
   sendConnectionRequest,
   clearConnectionStatus
} from '../../features/connectionsSlice';
import { getAvatarUrl } from '../../api/api';
import { getTrainingLevelLabel, TRAINING_LEVELS } from '../../constants/trainingLevels';
import styles from './TraineeSearch.module.css';

const TraineeSearch = () => {
   const dispatch = useDispatch();

   // Состояния для поиска
   const [searchQuery, setSearchQuery] = useState('');
   const [trainingLevel, setTrainingLevel] = useState('');
   const [specialization, setSpecialization] = useState('');
   const [isSearching, setIsSearching] = useState(false);
   const [sendingToId, setSendingToId] = useState(null);
   const formRef = useRef(null);

   const searchTimeoutRef = useRef(null);
   const isInitialMountRef = useRef(true);

   // Получаем данные из Redux
   const searchResults = useSelector(state => state.connections.searchResults.trainees);
   const isLoading = useSelector(state => state.connections.isLoading.searchTrainees);
   const error = useSelector(state => state.connections.errors.searchTrainees);

   // Получаем статусы связей и отправляемые запросы
   const connectionStatuses = useSelector(state => state.connections.connectionStatuses);
   const sendingRequestIds = useSelector(state => state.connections.sendingRequestIds || []);

   // Мемоизация trainees с актуальными статусами
   const trainees = useMemo(() => {
      if (!searchResults?.rows) return [];
      return searchResults.rows.map(trainee => ({
         ...trainee,
         connectionStatus: connectionStatuses[trainee.id] || trainee.connectionStatus
      }));
   }, [searchResults?.rows, connectionStatuses]);

   const total = searchResults?.count || 0;

   // Оптимизированный performSearch
   const performSearch = useCallback((customQuery = '') => {
      const searchParams = {
         query: customQuery,
         training_level: trainingLevel,
         specialization: specialization,
         limit: 20,
         offset: 0
      };

      setIsSearching(true);

      return dispatch(searchTrainees(searchParams))
         .finally(() => {
            setIsSearching(false);
         });
   }, [dispatch, trainingLevel, specialization]);

   // Загружаем начальный список только один раз при монтировании
   useEffect(() => {
      if (isInitialMountRef.current) {
         performSearch('');
         isInitialMountRef.current = false;
      }
   }, [performSearch]);

   // Очищаем статусы при размонтировании компонента
   useEffect(() => {
      return () => {
         dispatch(clearConnectionStatus({ targetUserId: null }));
      };
   }, [dispatch]);

   // Очистка таймера при размонтировании
   useEffect(() => {
      return () => {
         if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
         }
      };
   }, []);

   const handleSearch = (e) => {
      e.preventDefault();
      performSearch(searchQuery);
   };

   const handleClearSearch = () => {
      setSearchQuery('');
      setTrainingLevel('');
      setSpecialization('');
      dispatch(clearConnectionStatus({ targetUserId: null }));
      performSearch('');
   };

   const handleTrainingLevelChange = (e) => {
      const newTrainingLevel = e.target.value;
      setTrainingLevel(newTrainingLevel);

      if (searchTimeoutRef.current) {
         clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
         performSearch(searchQuery);
      }, 100);
   };

   const handleSpecializationChange = (e) => {
      const newSpecialization = e.target.value;
      setSpecialization(newSpecialization);

      if (searchTimeoutRef.current) {
         clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
         performSearch(searchQuery);
      }, 100);
   };

   const handleQueryChange = (e) => {
      const newQuery = e.target.value;
      setSearchQuery(newQuery);

      if (searchTimeoutRef.current) {
         clearTimeout(searchTimeoutRef.current);
      }

      if (newQuery.length >= 3 || newQuery.length === 0) {
         searchTimeoutRef.current = setTimeout(() => {
            performSearch(newQuery);
         }, 500);
      }
   };

   const handleSendRequest = async (traineeId, traineeName, currentStatus) => {
      // Проверяем, не отправляем ли уже запрос этому подопечному
      if (sendingToId === traineeId) {
         console.log('⏳ Запрос уже отправляется...');
         return;
      }

      // Проверяем, не отправлен ли запрос через Redux
      if (sendingRequestIds.includes(traineeId)) {
         alert(`⏳ Запрос подопечному ${traineeName} уже отправляется. Пожалуйста, подождите.`);
         return;
      }

      // Проверка на входящий запрос
      if (currentStatus === 'incoming') {
         alert(`📨 Подопечный ${traineeName} уже отправил вам запрос!\n\nПерейдите во вкладку "Запросы", чтобы принять или отклонить его запрос.`);
         return;
      }

      // Проверяем статус перед отправкой
      if (currentStatus === 'pending') {
         alert(`⏳ Запрос подопечному ${traineeName} уже отправлен. Ожидайте ответа.`);
         return;
      }

      if (currentStatus === 'connected') {
         alert(`✅ Вы уже связаны с подопечным ${traineeName}`);
         return;
      }

      if (currentStatus === 'accepted') {
         alert(`✅ Запрос подопечному ${traineeName} уже принят`);
         return;
      }

      if (currentStatus === 'rejected') {
         const userConfirmed = window.confirm(
            `❌ Предыдущий запрос подопечному ${traineeName} был отклонен.\n\nХотите отправить новый запрос?`
         );
         if (!userConfirmed) return;
      }

      if (currentStatus === 'cancelled') {
         const userConfirmed = window.confirm(
            `🚫 Предыдущий запрос подопечному ${traineeName} был отменен.\n\nХотите отправить новый запрос?`
         );
         if (!userConfirmed) return;
      }

      const userConfirmed = window.confirm(`Отправить запрос на подключение к подопечному ${traineeName}?`);
      if (!userConfirmed) return;

      // БЛОКИРУЕМ КНОПКУ
      setSendingToId(traineeId);

      try {
         console.log('📤 Отправка запроса:', {
            receiver_id: traineeId,
            message: 'Привет! Хотел бы стать вашим тренером.'
         });

         await dispatch(sendConnectionRequest({
            receiver_id: traineeId,
            message: 'Привет! Хотел бы стать вашим тренером.'
         })).unwrap();

         alert(`✅ Запрос отправлен подопечному ${traineeName}!`);

         // Обновляем поиск
         await performSearch(searchQuery);

      } catch (error) {
         console.error('❌ Ошибка отправки запроса:', error);

         let errorMessage = 'Неизвестная ошибка';
         if (typeof error === 'string') errorMessage = error;
         else if (error?.message) errorMessage = error.message;
         else if (error?.response?.data?.message) errorMessage = error.response.data.message;

         if (errorMessage.includes('уже отправлен')) {
            alert(`⏳ Запрос подопечному ${traineeName} уже был отправлен ранее. Пожалуйста, ожидайте ответа.`);
            await performSearch(searchQuery);
         } else {
            alert(`❌ Ошибка: ${errorMessage}`);
         }
      } finally {
         // РАЗБЛОКИРУЕМ КНОПКУ В ЛЮБОМ СЛУЧАЕ
         setSendingToId(null);
      }
   };

   const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
         e.preventDefault();
         performSearch(searchQuery);
      }
   };

   // Функция для определения текста кнопки
   const getButtonText = (connectionStatus, isSending, traineeId) => {
      if (isSending || sendingRequestIds.includes(traineeId)) {
         return '⏳ Отправка...';
      }

      switch (connectionStatus) {
         case 'connected':
            return '✔️ Ваш подопечный';
         case 'pending':
            return '⏳ Запрос отправлен';
         case 'incoming':
            return '📨 Входящий запрос';
         case 'accepted':
            return '✅ Запрос принят';
         case 'rejected':
            return '❌ Запрос отклонен';
         case 'cancelled':
            return '🚫 Запрос отменен';
         default:
            return 'Отправить запрос';
      }
   };

   // Функция для определения стиля кнопки
   const getButtonClass = (connectionStatus, isSending, traineeId) => {
      if (isSending || sendingRequestIds.includes(traineeId)) {
         return `${styles.requestButton} ${styles.sendingButton}`;
      }

      switch (connectionStatus) {
         case 'connected':
            return `${styles.requestButton} ${styles.connectedButton} ${styles.disabledButton}`;
         case 'pending':
            return `${styles.requestButton} ${styles.pendingButton} ${styles.disabledButton}`;
         case 'incoming':
            return `${styles.requestButton} ${styles.incomingButton} ${styles.disabledButton}`;
         case 'accepted':
            return `${styles.requestButton} ${styles.acceptedButton} ${styles.disabledButton}`;
         case 'rejected':
            return `${styles.requestButton} ${styles.rejectedButton}`;
         case 'cancelled':
            return `${styles.requestButton} ${styles.rejectedButton}`;
         default:
            return styles.requestButton;
      }
   };

   // Проверка, можно ли нажать кнопку
   const isButtonDisabled = (connectionStatus, isSending, traineeId) => {
      // Если отправляем сейчас - блокируем
      if (isSending || sendingRequestIds.includes(traineeId)) return true;

      // Для rejected и cancelled - можно отправить снова
      if (connectionStatus === 'rejected' || connectionStatus === 'cancelled') {
         return false;
      }

      // Для incoming - запрос от подопечного, нельзя отправить свой
      if (connectionStatus === 'incoming') {
         return true;
      }

      // Для остальных статусов - блокируем
      return ['connected', 'pending', 'accepted'].includes(connectionStatus);
   };

   return (
      <div className={styles.container}>
         <header className={styles.header}>
            <h1 className={styles.title}>🔍 Поиск подопечных</h1>
            <p className={styles.subtitle}>
               Найдите спортсменов и отправьте им запрос на подключение
            </p>
         </header>

         <form
            ref={formRef}
            onSubmit={handleSearch}
            className={styles.searchForm}
            onKeyPress={handleKeyPress}
         >
            <div className={styles.searchControls}>
               <div className={styles.inputGroup}>
                  <div className={styles.inputContainer}>
                     <input
                        type="text"
                        value={searchQuery}
                        onChange={handleQueryChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Поиск по имени или email..."
                        className={styles.searchInput}
                     />
                  </div>
                  <small className={styles.helperText}>
                     Начните вводить для поиска (минимум 3 символа)
                  </small>
               </div>

               <div className={styles.inputGroup}>
                  <div className={styles.inputContainer}>
                     <select
                        value={trainingLevel}
                        onChange={handleTrainingLevelChange}
                        className={styles.trainingLevelSelect}
                     >
                        <option value="">Все уровни подготовки</option>
                        {TRAINING_LEVELS.map(level => (
                           <option key={level.value} value={level.value}>
                              {level.label}
                           </option>
                        ))}
                     </select>
                  </div>
                  <small className={styles.helperText}>
                     Фильтр по уровню подготовки
                  </small>
               </div>

               <div className={styles.inputGroup}>
                  <div className={styles.inputContainer}>
                     <select
                        value={specialization}
                        onChange={handleSpecializationChange}
                        className={styles.specializationSelect}
                     >
                        <option value="">Все специализации</option>
                        <option value="Хоккей">Хоккей</option>
                        <option value="Фитнес">Фитнес</option>
                        <option value="Бег">Бег</option>
                        <option value="Плавание">Плавание</option>
                        <option value="Бокс">Бокс</option>
                        <option value="Йога">Йога</option>
                        <option value="Велоспорт">Велоспорт</option>
                     </select>
                  </div>
                  <small className={styles.helperText}>
                     Фильтр по специализации
                  </small>
               </div>

               <div className={styles.buttonGroup}>
                  <button
                     type="button"
                     onClick={handleSearch}
                     className={styles.searchButton}
                     disabled={isLoading || isSearching}
                  >
                     {isSearching ? (
                        <>
                           <span className={styles.spinnerSmall}></span>
                           Поиск...
                        </>
                     ) : 'Найти'}
                  </button>

                  <button
                     type="button"
                     onClick={handleClearSearch}
                     className={`${styles.clearButton} ${(!searchQuery && !trainingLevel && !specialization) ? styles.hidden : ''}`}
                     disabled={isLoading || isSearching}
                  >
                     Очистить
                  </button>
               </div>
            </div>
         </form>

         <div className={styles.resultsInfo}>
            <p>Найдено подопечных: <strong>{total}</strong></p>
            {trainingLevel && (
               <p className={styles.filterInfo}>
                  Уровень: <strong>{getTrainingLevelLabel(trainingLevel)}</strong>
               </p>
            )}
            {specialization && (
               <p className={styles.filterInfo}>
                  Специализация: <strong>{specialization}</strong>
               </p>
            )}
            {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}
         </div>

         {(isLoading || isSearching) ? (
            <div className={styles.loadingState}>
               <div className={styles.spinner}></div>
               <p>Идет поиск подопечных...</p>
            </div>
         ) : trainees.length === 0 ? (
            <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>🔍</div>
               <h3>Подопечные не найдены</h3>
               <p>
                  {trainingLevel || specialization
                     ? 'Попробуйте изменить параметры фильтрации'
                     : 'Попробуйте изменить параметры поиска'}
               </p>
               <button onClick={handleClearSearch} className={styles.emptyButton}>
                  Показать всех подопечных
               </button>
            </div>
         ) : (
            <div className={styles.traineesGrid}>
               {trainees.map(trainee => {
                  const connectionStatus = trainee.connectionStatus;
                  const isSending = sendingToId === trainee.id;

                  const buttonText = getButtonText(connectionStatus, isSending, trainee.id);
                  const buttonClass = getButtonClass(connectionStatus, isSending, trainee.id);
                  const isDisabled = isButtonDisabled(connectionStatus, isSending, trainee.id);

                  return (
                     <div key={trainee.id} className={styles.traineeCard}>
                        <div className={styles.traineeHeader}>
                           <img
                              src={trainee.userAvatar ? getAvatarUrl(trainee.userAvatar) : null}
                              alt={trainee.userName}
                              className={styles.traineeAvatar}
                              onError={(e) => {
                                 e.target.src = 'https://via.placeholder.com/60x60?text=Avatar';
                              }}
                           />
                           <div className={styles.traineeInfo}>
                              <h3 className={styles.traineeName}>{trainee.userName}</h3>
                              <p className={styles.traineeEmail}>{trainee.email}</p>
                              {connectionStatus && connectionStatus !== 'null' && !isSending && (
                                 <span className={`${styles.statusBadge} ${styles[connectionStatus]}`}>
                                    {connectionStatus === 'pending' && '⏳ Запрос отправлен'}
                                    {connectionStatus === 'connected' && '✔️ Ваш подопечный'}
                                    {connectionStatus === 'accepted' && '✅ Запрос принят'}
                                    {connectionStatus === 'incoming' && '📨 Входящий запрос'}
                                    {connectionStatus === 'rejected' && '❌ Запрос отклонен'}
                                    {connectionStatus === 'cancelled' && '🚫 Запрос отменен'}
                                 </span>
                              )}
                              {isSending && (
                                 <span className={`${styles.statusBadge} ${styles.sending}`}>
                                    ⏳ Отправка...
                                 </span>
                              )}
                           </div>
                        </div>

                        <div className={styles.traineeDetails}>
                           {trainee.training_level && (
                              <div className={styles.detailItem}>
                                 <span className={styles.detailLabel}>Уровень:</span>
                                 <span className={styles.detailValue}>
                                    {getTrainingLevelLabel(trainee.training_level)}
                                 </span>
                                 {trainingLevel && trainee.training_level === trainingLevel && (
                                    <span className={styles.matchBadge}>✓ Совпадает</span>
                                 )}
                              </div>
                           )}

                           {trainee.sport_specialization && (
                              <div className={styles.detailItem}>
                                 <span className={styles.detailLabel}>Спорт:</span>
                                 <span className={styles.detailValue}>{trainee.sport_specialization}</span>
                                 {specialization && trainee.sport_specialization === specialization && (
                                    <span className={styles.matchBadge}>✓ Совпадает</span>
                                 )}
                              </div>
                           )}

                           {trainee.createdAt && (
                              <div className={styles.detailItem}>
                                 <span className={styles.detailLabel}>В системе с:</span>
                                 <span className={styles.detailValue}>
                                    {new Date(trainee.createdAt).toLocaleDateString('ru-RU')}
                                 </span>
                              </div>
                           )}
                        </div>

                        <div className={styles.traineeActions}>
                           <button
                              onClick={() => handleSendRequest(trainee.id, trainee.userName, connectionStatus)}
                              className={buttonClass}
                              disabled={isDisabled}
                              title={isDisabled ? buttonText : 'Отправить запрос подопечному'}
                           >
                              {buttonText}
                           </button>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         {/* Debug info */}
         <div className={styles.debugInfo}>
            <p><strong>Debug Info:</strong></p>
            <p>Подопечных: {trainees.length}, Запрос: "{searchQuery}"</p>
            <p>Уровень: "{trainingLevel || 'все'}", Специализация: "{specialization || 'все'}"</p>
            <p>Отправка к ID: {sendingToId || 'нет'}</p>
            <p>Статусы: {JSON.stringify(connectionStatuses)}</p>
         </div>
      </div>
   );
};

export default TraineeSearch;