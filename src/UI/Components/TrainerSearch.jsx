// // UI/Components/TrainerSearch.jsx
// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { searchTrainers, sendConnectionRequest } from '../../features/connectionsSlice';
// import { getAvatarUrl } from '../../api/api';
// import styles from './TrainerSearch.module.css';

// const TrainerSearch = () => {
//    const dispatch = useDispatch();

//    // Состояния для поиска
//    const [searchQuery, setSearchQuery] = useState('');
//    const [specialization, setSpecialization] = useState('');
//    const [isSearching, setIsSearching] = useState(false);
//    // 🔥 НОВОЕ: состояние для отслеживания отправки конкретному тренеру
//    const [sendingToId, setSendingToId] = useState(null);
//    const formRef = useRef(null);

//    // useRef для таймера
//    const searchTimeoutRef = useRef(null);
//    const isInitialMountRef = useRef(true);

//    // Получаем данные из Redux
//    const searchResults = useSelector(state => state.connections.searchResults.trainers);
//    const isLoading = useSelector(state => state.connections.isLoading.searchTrainers);
//    const error = useSelector(state => state.connections.errors.searchTrainers);

//    // 🔥 НОВОЕ: получаем список ID, для которых уже идет отправка
//    const sendingRequestIds = useSelector(state => state.connections.sendingRequestIds || []);

//    // Данные тренеров
//    const trainers = useMemo(() => searchResults?.rows || [], [searchResults?.rows]);
//    const total = searchResults?.count || 0;

//    // Оптимизированный performSearch
//    const performSearch = useCallback((customQuery = '', customSpecialization = '') => {
//       const searchParams = {
//          query: customQuery,
//          specialization: customSpecialization,
//          limit: 20,
//          offset: 0
//       };

//       setIsSearching(true);

//       dispatch(searchTrainers(searchParams))
//          .finally(() => {
//             setIsSearching(false);
//          });
//    }, [dispatch]);

//    // Загружаем начальный список только один раз при монтировании
//    useEffect(() => {
//       if (isInitialMountRef.current) {
//          performSearch('', '');
//          isInitialMountRef.current = false;
//       }
//    }, [performSearch]);

//    // Очистка таймера при размонтировании
//    useEffect(() => {
//       return () => {
//          if (searchTimeoutRef.current) {
//             clearTimeout(searchTimeoutRef.current);
//          }
//       };
//    }, []);

//    const handleSearch = (e) => {
//       e.preventDefault();
//       performSearch(searchQuery, specialization);
//    };

//    const handleClearSearch = () => {
//       setSearchQuery('');
//       setSpecialization('');
//       performSearch('', '');
//    };

//    const handleSpecializationChange = (e) => {
//       const newSpecialization = e.target.value;
//       setSpecialization(newSpecialization);

//       if (searchTimeoutRef.current) {
//          clearTimeout(searchTimeoutRef.current);
//       }

//       searchTimeoutRef.current = setTimeout(() => {
//          performSearch(searchQuery, newSpecialization);
//       }, 100);
//    };

//    const handleQueryChange = (e) => {
//       const newQuery = e.target.value;
//       setSearchQuery(newQuery);

//       if (searchTimeoutRef.current) {
//          clearTimeout(searchTimeoutRef.current);
//       }

//       if (newQuery.length >= 3 || newQuery.length === 0) {
//          searchTimeoutRef.current = setTimeout(() => {
//             performSearch(newQuery, specialization);
//          }, 500);
//       }
//    };

//    // 🔥 ИСПРАВЛЕНИЕ: Добавлена защита от двойной отправки
//    // const handleSendRequest = async (trainerId, trainerName, currentStatus) => {
//    //    // Проверяем, не отправляем ли уже запрос этому тренеру
//    //    if (sendingToId === trainerId) {
//    //       console.log('⏳ Запрос уже отправляется...');
//    //       return;
//    //    }

//    //    // Проверяем, не отправлен ли запрос через Redux
//    //    if (sendingRequestIds.includes(trainerId)) {
//    //       alert(`⏳ Запрос тренеру ${trainerName} уже отправляется. Пожалуйста, подождите.`);
//    //       return;
//    //    }

//    //    // Проверяем статус перед отправкой
//    //    if (currentStatus === 'pending') {
//    //       alert(`⏳ Запрос тренеру ${trainerName} уже отправлен. Ожидайте ответа.`);
//    //       return;
//    //    }

//    //    if (currentStatus === 'connected') {
//    //       alert(`✅ Вы уже связаны с тренером ${trainerName}`);
//    //       return;
//    //    }

//    //    if (currentStatus === 'accepted') {
//    //       alert(`✅ Запрос тренеру ${trainerName} уже принят`);
//    //       return;
//    //    }

//    //    if (currentStatus === 'rejected') {
//    //       const userConfirmed = window.confirm(
//    //          `❌ Предыдущий запрос тренеру ${trainerName} был отклонен.\n\nХотите отправить новый запрос?`
//    //       );
//    //       if (!userConfirmed) return;
//    //    }

//    //    if (currentStatus === 'cancelled') {
//    //       const userConfirmed = window.confirm(
//    //          `🚫 Предыдущий запрос тренеру ${trainerName} был отменен.\n\nХотите отправить новый запрос?`
//    //       );
//    //       if (!userConfirmed) return;
//    //    }

//    //    const userConfirmed = window.confirm(`Отправить запрос на подключение к тренеру ${trainerName}?`);
//    //    if (!userConfirmed) return;

//    //    // 🔥 БЛОКИРУЕМ КНОПКУ
//    //    setSendingToId(trainerId);

//    //    try {
//    //       console.log('📤 Отправка запроса:', {
//    //          receiver_id: trainerId,
//    //          message: 'Привет! Хотел бы стать вашим подопечным.'
//    //       });

//    //       await dispatch(sendConnectionRequest({
//    //          receiver_id: trainerId,
//    //          message: 'Привет! Хотел бы стать вашим подопечным.'
//    //       })).unwrap();

//    //       alert(`✅ Запрос отправлен тренеру ${trainerName}!`);

//    //       // 🔥 Обновляем поиск и ждем его завершения
//    //       await performSearch(searchQuery, specialization);

//    //    } catch (error) {
//    //       console.error('❌ Ошибка отправки запроса:', error);

//    //       let errorMessage = 'Неизвестная ошибка';
//    //       if (typeof error === 'string') errorMessage = error;
//    //       else if (error?.message) errorMessage = error.message;
//    //       else if (error?.response?.data?.message) errorMessage = error.response.data.message;

//    //       // Специальная обработка для "запрос уже отправлен"
//    //       if (errorMessage.includes('уже отправлен')) {
//    //          alert(`⏳ Запрос тренеру ${trainerName} уже был отправлен ранее. Пожалуйста, ожидайте ответа.`);
//    //          // Обновляем статус в UI
//    //          await performSearch(searchQuery, specialization);
//    //       } else {
//    //          alert(`❌ Ошибка: ${errorMessage}`);
//    //       }
//    //    } finally {
//    //       // 🔥 РАЗБЛОКИРУЕМ КНОПКУ В ЛЮБОМ СЛУЧАЕ
//    //       setSendingToId(null);
//    //    }
//    // };

//    const handleSendRequest = async (trainerId, trainerName, currentStatus) => {
//       // Проверяем, не отправляем ли уже запрос этому тренеру
//       if (sendingToId === trainerId) {
//          console.log('⏳ Запрос уже отправляется...');
//          return;
//       }

//       // Проверяем, не отправлен ли запрос через Redux
//       if (sendingRequestIds.includes(trainerId)) {
//          alert(`⏳ Запрос тренеру ${trainerName} уже отправляется. Пожалуйста, подождите.`);
//          return;
//       }

//       // 👇 НОВАЯ ПРОВЕРКА
//       if (currentStatus === 'incoming') {
//          alert(`📨 Тренер ${trainerName} уже отправил вам запрос!\n\nПерейдите во вкладку "Запросы", чтобы принять или отклонить его запрос.`);
//          return;
//       }

//       // Проверяем статус перед отправкой
//       if (currentStatus === 'pending') {
//          alert(`⏳ Запрос тренеру ${trainerName} уже отправлен. Ожидайте ответа.`);
//          return;
//       }

//       if (currentStatus === 'connected') {
//          alert(`✅ Вы уже связаны с тренером ${trainerName}`);
//          return;
//       }

//       if (currentStatus === 'accepted') {
//          alert(`✅ Запрос тренеру ${trainerName} уже принят`);
//          return;
//       }

//       if (currentStatus === 'rejected') {
//          const userConfirmed = window.confirm(
//             `❌ Предыдущий запрос тренеру ${trainerName} был отклонен.\n\nХотите отправить новый запрос?`
//          );
//          if (!userConfirmed) return;
//       }

//       if (currentStatus === 'cancelled') {
//          const userConfirmed = window.confirm(
//             `🚫 Предыдущий запрос тренеру ${trainerName} был отменен.\n\nХотите отправить новый запрос?`
//          );
//          if (!userConfirmed) return;
//       }

//       const userConfirmed = window.confirm(`Отправить запрос на подключение к тренеру ${trainerName}?`);
//       if (!userConfirmed) return;

//       // БЛОКИРУЕМ КНОПКУ
//       setSendingToId(trainerId);

//       try {
//          console.log('📤 Отправка запроса:', {
//             receiver_id: trainerId,
//             message: 'Привет! Хотел бы стать вашим подопечным.'
//          });

//          await dispatch(sendConnectionRequest({
//             receiver_id: trainerId,
//             message: 'Привет! Хотел бы стать вашим подопечным.'
//          })).unwrap();

//          alert(`✅ Запрос отправлен тренеру ${trainerName}!`);

//          // Обновляем поиск
//          await performSearch(searchQuery, specialization);

//       } catch (error) {
//          console.error('❌ Ошибка отправки запроса:', error);

//          let errorMessage = 'Неизвестная ошибка';
//          if (typeof error === 'string') errorMessage = error;
//          else if (error?.message) errorMessage = error.message;
//          else if (error?.response?.data?.message) errorMessage = error.response.data.message;

//          if (errorMessage.includes('уже отправлен')) {
//             alert(`⏳ Запрос тренеру ${trainerName} уже был отправлен ранее. Пожалуйста, ожидайте ответа.`);
//             await performSearch(searchQuery, specialization);
//          } else {
//             alert(`❌ Ошибка: ${errorMessage}`);
//          }
//       } finally {
//          setSendingToId(null);
//       }
//    };


//    const handleKeyPress = (e) => {
//       if (e.key === 'Enter') {
//          e.preventDefault();
//          performSearch(searchQuery, specialization);
//       }
//    };

//    // Функция для определения текста кнопки
//    const getButtonText = (connectionStatus, isSending, trainerId) => {
//       if (isSending || sendingRequestIds.includes(trainerId)) {
//          return '⏳ Отправка...';
//       }

//       switch (connectionStatus) {
//          case 'connected': return '✔️ Ваш тренер';
//          case 'pending': return '⏳ Запрос отправлен';
//          case 'incoming': return '📨 Входящий запрос'; // 👈 НОВЫЙ СТАТУС
//          case 'accepted': return '✅ Запрос принят';
//          case 'rejected': return '❌ Запрос отклонен';
//          case 'cancelled': return '🚫 Запрос отменен';
//          default: return 'Отправить запрос';
//       }
//    };
//    // Функция для определения стиля кнопки
//    const getButtonClass = (connectionStatus, isSending, trainerId) => {
//       if (isSending || sendingRequestIds.includes(trainerId)) {
//          return `${styles.requestButton} ${styles.sendingButton}`;
//       }

//       switch (connectionStatus) {
//          case 'connected':
//             return `${styles.requestButton} ${styles.connectedButton} ${styles.disabledButton}`;
//          case 'pending':
//             return `${styles.requestButton} ${styles.pendingButton} ${styles.disabledButton}`;
//          case 'incoming': // 👈 НОВЫЙ СТАТУС
//             return `${styles.requestButton} ${styles.incomingButton} ${styles.disabledButton}`;
//          case 'accepted':
//             return `${styles.requestButton} ${styles.acceptedButton} ${styles.disabledButton}`;
//          case 'rejected':
//             return `${styles.requestButton} ${styles.rejectedButton}`;
//          case 'cancelled':
//             return `${styles.requestButton} ${styles.rejectedButton}`;
//          default:
//             return styles.requestButton;
//       }
//    };

//    // Проверка, можно ли нажать кнопку
//    const isButtonDisabled = (connectionStatus, isSending, trainerId) => {
//       // Если отправляем сейчас - блокируем
//       if (isSending || sendingRequestIds.includes(trainerId)) return true;

//       // Для rejected и cancelled - можно отправить снова
//       if (connectionStatus === 'rejected' || connectionStatus === 'cancelled') {
//          return false;
//       }

//       // Для incoming - запрос от тренера, нельзя отправить свой
//       if (connectionStatus === 'incoming') {
//          return true; // 👈 БЛОКИРУЕМ
//       }

//       // Для остальных статусов - блокируем
//       return ['connected', 'pending', 'accepted'].includes(connectionStatus);
//    };

//    return (
//       <div className={styles.container}>
//          <header className={styles.header}>
//             <h1 className={styles.title}>🔍 Поиск тренеров</h1>
//             <p className={styles.subtitle}>
//                Найдите подходящего тренера и отправьте запрос на подключение
//             </p>
//          </header>

//          <form
//             ref={formRef}
//             onSubmit={handleSearch}
//             className={styles.searchForm}
//             onKeyPress={handleKeyPress}
//          >
//             <div className={styles.searchControls}>
//                <div className={styles.inputGroup}>
//                   <div className={styles.inputContainer}>
//                      <input
//                         type="text"
//                         value={searchQuery}
//                         onChange={handleQueryChange}
//                         onKeyPress={handleKeyPress}
//                         placeholder="Поиск по имени или email..."
//                         className={styles.searchInput}
//                      />
//                   </div>
//                   <small className={styles.helperText}>
//                      Начните вводить для поиска (минимум 3 символа)
//                   </small>
//                </div>

//                <div className={styles.inputGroup}>
//                   <div className={styles.inputContainer}>
//                      <select
//                         value={specialization}
//                         onChange={handleSpecializationChange}
//                         className={styles.specializationSelect}
//                      >
//                         <option value="">Все специализации</option>
//                         <option value="Хоккей">Хоккей</option>
//                         <option value="Фитнес">Фитнес</option>
//                         <option value="Бег">Бег</option>
//                         <option value="Плавание">Плавание</option>
//                         <option value="Бокс">Бокс</option>
//                         <option value="Йога">Йога</option>
//                         <option value="Велоспорт">Велоспорт</option>
//                      </select>
//                   </div>
//                   <small className={styles.helperText}>
//                      Выбор запускает поиск автоматически
//                   </small>
//                </div>

//                <div className={styles.buttonGroup}>
//                   <button
//                      type="button"
//                      onClick={handleSearch}
//                      className={styles.searchButton}
//                      disabled={isLoading || isSearching}
//                   >
//                      {isSearching ? (
//                         <>
//                            <span className={styles.spinnerSmall}></span>
//                            Поиск...
//                         </>
//                      ) : 'Найти'}
//                   </button>

//                   <button
//                      type="button"
//                      onClick={handleClearSearch}
//                      className={`${styles.clearButton} ${(!searchQuery && !specialization) ? styles.hidden : ''}`}
//                      disabled={isLoading || isSearching}
//                   >
//                      Очистить
//                   </button>
//                </div>
//             </div>
//          </form>

//          <div className={styles.resultsInfo}>
//             <p>Найдено тренеров: <strong>{total}</strong></p>
//             {specialization && (
//                <p className={styles.filterInfo}>
//                   Фильтр: <strong>{specialization}</strong>
//                </p>
//             )}
//             {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}
//          </div>

//          {(isLoading || isSearching) ? (
//             <div className={styles.loadingState}>
//                <div className={styles.spinner}></div>
//                <p>Идет поиск тренеров...</p>
//             </div>
//          ) : trainers.length === 0 ? (
//             <div className={styles.emptyState}>
//                <div className={styles.emptyIcon}>🔍</div>
//                <h3>Тренеры не найдены</h3>
//                <p>
//                   {specialization
//                      ? `По специализации "${specialization}" тренеры не найдены`
//                      : 'Попробуйте изменить параметры поиска'
//                   }
//                </p>
//                <button
//                   onClick={handleClearSearch}
//                   className={styles.emptyButton}
//                >
//                   {specialization ? 'Показать всех тренеров' : 'Обновить поиск'}
//                </button>
//             </div>
//          ) : (
//             <div className={styles.trainersGrid}>
//                {trainers.map(trainer => {
//                   const connectionStatus = trainer.connectionStatus;
//                   const isSending = sendingToId === trainer.id;

//                   // 🔥 Используем обновленные функции с учетом отправки
//                   const buttonText = getButtonText(connectionStatus, isSending, trainer.id);
//                   const buttonClass = getButtonClass(connectionStatus, isSending, trainer.id);
//                   const isDisabled = isButtonDisabled(connectionStatus, isSending, trainer.id);

//                   return (
//                      <div key={trainer.id} className={styles.trainerCard}>
//                         <div className={styles.trainerHeader}>
//                            <img
//                               src={getAvatarUrl(trainer.userAvatar)}
//                               alt={trainer.userName}
//                               className={styles.trainerAvatar}
//                               onError={(e) => {
//                                  e.target.src = 'https://via.placeholder.com/60x60?text=Avatar';
//                               }}
//                            />
//                            <div className={styles.trainerInfo}>
//                               <h3 className={styles.trainerName}>{trainer.userName}</h3>
//                               <p className={styles.trainerEmail}>{trainer.email}</p>
//                               {connectionStatus && connectionStatus !== 'null' && !isSending && (
//                                  <span className={`${styles.statusBadge} ${styles[connectionStatus]}`}>
//                                     {connectionStatus === 'pending' && '⏳ Запрос отправлен'}
//                                     {connectionStatus === 'connected' && '✔️ Ваш тренер'}
//                                     {connectionStatus === 'accepted' && '✅ Запрос принят'}
//                                     {connectionStatus === 'incoming' && '📨 Входящий запрос'}
//                                     {connectionStatus === 'rejected' && '❌ Запрос отклонен'}
//                                     {connectionStatus === 'cancelled' && '🚫 Запрос отменен'}
//                                  </span>
//                               )}
//                               {isSending && (
//                                  <span className={`${styles.statusBadge} ${styles.sending}`}>
//                                     ⏳ Отправка...
//                                  </span>
//                               )}
//                            </div>
//                         </div>

//                         <div className={styles.trainerDetails}>
//                            {trainer.sport_specialization && (
//                               <div className={styles.detailItem}>
//                                  <span className={styles.detailLabel}>Специализация:</span>
//                                  <span className={styles.detailValue}>{trainer.sport_specialization}</span>
//                                  {specialization && trainer.sport_specialization === specialization && (
//                                     <span className={styles.matchBadge}>✓ Совпадает</span>
//                                  )}
//                               </div>
//                            )}

//                            {trainer.createdAt && (
//                               <div className={styles.detailItem}>
//                                  <span className={styles.detailLabel}>В системе с:</span>
//                                  <span className={styles.detailValue}>
//                                     {new Date(trainer.createdAt).toLocaleDateString('ru-RU')}
//                                  </span>
//                               </div>
//                            )}
//                         </div>

//                         <div className={styles.trainerActions}>
//                            <button
//                               onClick={() => handleSendRequest(trainer.id, trainer.userName, connectionStatus)}
//                               className={buttonClass}
//                               disabled={isDisabled}
//                               title={isDisabled ? buttonText : 'Отправить запрос'}
//                            >
//                               {buttonText}
//                            </button>
//                         </div>
//                      </div>
//                   );
//                })}
//             </div>
//          )}

//          {/* Debug info */}
//          <div className={styles.debugInfo}>
//             <p><strong>Debug Info:</strong></p>
//             <p>Тренеров: {trainers.length}, Запрос: "{searchQuery}", Специализация: "{specialization}"</p>
//             <p>Отправка к ID: {sendingToId || 'нет'}</p>
//          </div>
//       </div>
//    );
// };

// export default TrainerSearch;

// UI/Components/TrainerSearch.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   searchTrainers,
   sendConnectionRequest,
   clearConnectionStatus  // 🔥 НОВЫЙ ИМПОРТ
} from '../../features/connectionsSlice';
import { getAvatarUrl } from '../../api/api';
import styles from './TrainerSearch.module.css';

const TrainerSearch = () => {
   const dispatch = useDispatch();

   // Состояния для поиска
   const [searchQuery, setSearchQuery] = useState('');
   const [specialization, setSpecialization] = useState('');
   const [isSearching, setIsSearching] = useState(false);
   const [sendingToId, setSendingToId] = useState(null);
   const formRef = useRef(null);

   // useRef для таймера
   const searchTimeoutRef = useRef(null);
   const isInitialMountRef = useRef(true);

   // Получаем данные из Redux
   const searchResults = useSelector(state => state.connections.searchResults.trainers);
   const isLoading = useSelector(state => state.connections.isLoading.searchTrainers);
   const error = useSelector(state => state.connections.errors.searchTrainers);

   // Получаем статусы связей из общего хранилища
   const connectionStatuses = useSelector(state => state.connections.connectionStatuses);
   const sendingRequestIds = useSelector(state => state.connections.sendingRequestIds || []);

   // Данные тренеров
   const trainers = useMemo(() => {
      if (!searchResults?.rows) return [];

      // 🔥 ОБНОВЛЯЕМ статусы из глобального хранилища
      return searchResults.rows.map(trainer => ({
         ...trainer,
         connectionStatus: connectionStatuses[trainer.id] || trainer.connectionStatus
      }));
   }, [searchResults?.rows, connectionStatuses]);

   const total = searchResults?.count || 0;

   // Оптимизированный performSearch
   const performSearch = useCallback((customQuery = '', customSpecialization = '') => {
      const searchParams = {
         query: customQuery,
         specialization: customSpecialization,
         limit: 20,
         offset: 0
      };

      setIsSearching(true);

      return dispatch(searchTrainers(searchParams))
         .finally(() => {
            setIsSearching(false);
         });
   }, [dispatch]);

   // Загружаем начальный список только один раз при монтировании
   useEffect(() => {
      if (isInitialMountRef.current) {
         performSearch('', '');
         isInitialMountRef.current = false;
      }
   }, [performSearch]);

   // 🔥 НОВЫЙ ЭФФЕКТ: Очищаем статусы при размонтировании компонента
   useEffect(() => {
      return () => {
         // Очищаем все статусы при уходе со страницы поиска
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
      performSearch(searchQuery, specialization);
   };

   const handleClearSearch = () => {
      setSearchQuery('');
      setSpecialization('');
      // 🔥 Очищаем статусы при очистке поиска
      dispatch(clearConnectionStatus({ targetUserId: null }));
      performSearch('', '');
   };

   const handleSpecializationChange = (e) => {
      const newSpecialization = e.target.value;
      setSpecialization(newSpecialization);

      if (searchTimeoutRef.current) {
         clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
         performSearch(searchQuery, newSpecialization);
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
            performSearch(newQuery, specialization);
         }, 500);
      }
   };

   const handleSendRequest = async (trainerId, trainerName, currentStatus) => {
      // Проверяем, не отправляем ли уже запрос этому тренеру
      if (sendingToId === trainerId) {
         console.log('⏳ Запрос уже отправляется...');
         return;
      }

      // Проверяем, не отправлен ли запрос через Redux
      if (sendingRequestIds.includes(trainerId)) {
         alert(`⏳ Запрос тренеру ${trainerName} уже отправляется. Пожалуйста, подождите.`);
         return;
      }

      if (currentStatus === 'incoming') {
         alert(`📨 Тренер ${trainerName} уже отправил вам запрос!\n\nПерейдите во вкладку "Запросы", чтобы принять или отклонить его запрос.`);
         return;
      }

      // Проверяем статус перед отправкой
      if (currentStatus === 'pending') {
         alert(`⏳ Запрос тренеру ${trainerName} уже отправлен. Ожидайте ответа.`);
         return;
      }

      if (currentStatus === 'connected') {
         alert(`✅ Вы уже связаны с тренером ${trainerName}`);
         return;
      }

      if (currentStatus === 'accepted') {
         alert(`✅ Запрос тренеру ${trainerName} уже принят`);
         return;
      }

      if (currentStatus === 'rejected') {
         const userConfirmed = window.confirm(
            `❌ Предыдущий запрос тренеру ${trainerName} был отклонен.\n\nХотите отправить новый запрос?`
         );
         if (!userConfirmed) return;
      }

      if (currentStatus === 'cancelled') {
         const userConfirmed = window.confirm(
            `🚫 Предыдущий запрос тренеру ${trainerName} был отменен.\n\nХотите отправить новый запрос?`
         );
         if (!userConfirmed) return;
      }

      const userConfirmed = window.confirm(`Отправить запрос на подключение к тренеру ${trainerName}?`);
      if (!userConfirmed) return;

      // БЛОКИРУЕМ КНОПКУ
      setSendingToId(trainerId);

      try {
         console.log('📤 Отправка запроса:', {
            receiver_id: trainerId,
            message: 'Привет! Хотел бы стать вашим подопечным.'
         });

         await dispatch(sendConnectionRequest({
            receiver_id: trainerId,
            message: 'Привет! Хотел бы стать вашим подопечным.'
         })).unwrap();

         alert(`✅ Запрос отправлен тренеру ${trainerName}!`);

         // Обновляем поиск
         await performSearch(searchQuery, specialization);

      } catch (error) {
         console.error('❌ Ошибка отправки запроса:', error);

         let errorMessage = 'Неизвестная ошибка';
         if (typeof error === 'string') errorMessage = error;
         else if (error?.message) errorMessage = error.message;
         else if (error?.response?.data?.message) errorMessage = error.response.data.message;

         if (errorMessage.includes('уже отправлен')) {
            alert(`⏳ Запрос тренеру ${trainerName} уже был отправлен ранее. Пожалуйста, ожидайте ответа.`);
            await performSearch(searchQuery, specialization);
         } else {
            alert(`❌ Ошибка: ${errorMessage}`);
         }
      } finally {
         setSendingToId(null);
      }
   };

   const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
         e.preventDefault();
         performSearch(searchQuery, specialization);
      }
   };

   // Функция для определения текста кнопки
   const getButtonText = (connectionStatus, isSending, trainerId) => {
      if (isSending || sendingRequestIds.includes(trainerId)) {
         return '⏳ Отправка...';
      }

      switch (connectionStatus) {
         case 'connected': return '✔️ Ваш тренер';
         case 'pending': return '⏳ Запрос отправлен';
         case 'incoming': return '📨 Входящий запрос';
         case 'accepted': return '✅ Запрос принят';
         case 'rejected': return '❌ Запрос отклонен';
         case 'cancelled': return '🚫 Запрос отменен';
         default: return 'Отправить запрос';
      }
   };

   // Функция для определения стиля кнопки
   const getButtonClass = (connectionStatus, isSending, trainerId) => {
      if (isSending || sendingRequestIds.includes(trainerId)) {
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
   const isButtonDisabled = (connectionStatus, isSending, trainerId) => {
      // Если отправляем сейчас - блокируем
      if (isSending || sendingRequestIds.includes(trainerId)) return true;

      // Для rejected и cancelled - можно отправить снова
      if (connectionStatus === 'rejected' || connectionStatus === 'cancelled') {
         return false;
      }

      // Для incoming - запрос от тренера, нельзя отправить свой
      if (connectionStatus === 'incoming') {
         return true;
      }

      // Для остальных статусов - блокируем
      return ['connected', 'pending', 'accepted'].includes(connectionStatus);
   };

   return (
      <div className={styles.container}>
         <header className={styles.header}>
            <h1 className={styles.title}>🔍 Поиск тренеров</h1>
            <p className={styles.subtitle}>
               Найдите подходящего тренера и отправьте запрос на подключение
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
                     Выбор запускает поиск автоматически
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
                     className={`${styles.clearButton} ${(!searchQuery && !specialization) ? styles.hidden : ''}`}
                     disabled={isLoading || isSearching}
                  >
                     Очистить
                  </button>
               </div>
            </div>
         </form>

         <div className={styles.resultsInfo}>
            <p>Найдено тренеров: <strong>{total}</strong></p>
            {specialization && (
               <p className={styles.filterInfo}>
                  Фильтр: <strong>{specialization}</strong>
               </p>
            )}
            {error && <p className={styles.errorMessage}>Ошибка: {error}</p>}
         </div>

         {(isLoading || isSearching) ? (
            <div className={styles.loadingState}>
               <div className={styles.spinner}></div>
               <p>Идет поиск тренеров...</p>
            </div>
         ) : trainers.length === 0 ? (
            <div className={styles.emptyState}>
               <div className={styles.emptyIcon}>🔍</div>
               <h3>Тренеры не найдены</h3>
               <p>
                  {specialization
                     ? `По специализации "${specialization}" тренеры не найдены`
                     : 'Попробуйте изменить параметры поиска'
                  }
               </p>
               <button
                  onClick={handleClearSearch}
                  className={styles.emptyButton}
               >
                  {specialization ? 'Показать всех тренеров' : 'Обновить поиск'}
               </button>
            </div>
         ) : (
            <div className={styles.trainersGrid}>
               {trainers.map(trainer => {
                  const connectionStatus = trainer.connectionStatus;
                  const isSending = sendingToId === trainer.id;

                  const buttonText = getButtonText(connectionStatus, isSending, trainer.id);
                  const buttonClass = getButtonClass(connectionStatus, isSending, trainer.id);
                  const isDisabled = isButtonDisabled(connectionStatus, isSending, trainer.id);

                  return (
                     <div key={trainer.id} className={styles.trainerCard}>
                        <div className={styles.trainerHeader}>
                           <img
                              src={getAvatarUrl(trainer.userAvatar)}
                              alt={trainer.userName}
                              className={styles.trainerAvatar}
                              onError={(e) => {
                                 e.target.src = 'https://via.placeholder.com/60x60?text=Avatar';
                              }}
                           />
                           <div className={styles.trainerInfo}>
                              <h3 className={styles.trainerName}>{trainer.userName}</h3>
                              <p className={styles.trainerEmail}>{trainer.email}</p>
                              {connectionStatus && connectionStatus !== 'null' && !isSending && (
                                 <span className={`${styles.statusBadge} ${styles[connectionStatus]}`}>
                                    {connectionStatus === 'pending' && '⏳ Запрос отправлен'}
                                    {connectionStatus === 'connected' && '✔️ Ваш тренер'}
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

                        <div className={styles.trainerDetails}>
                           {trainer.sport_specialization && (
                              <div className={styles.detailItem}>
                                 <span className={styles.detailLabel}>Специализация:</span>
                                 <span className={styles.detailValue}>{trainer.sport_specialization}</span>
                                 {specialization && trainer.sport_specialization === specialization && (
                                    <span className={styles.matchBadge}>✓ Совпадает</span>
                                 )}
                              </div>
                           )}

                           {trainer.createdAt && (
                              <div className={styles.detailItem}>
                                 <span className={styles.detailLabel}>В системе с:</span>
                                 <span className={styles.detailValue}>
                                    {new Date(trainer.createdAt).toLocaleDateString('ru-RU')}
                                 </span>
                              </div>
                           )}
                        </div>

                        <div className={styles.trainerActions}>
                           <button
                              onClick={() => handleSendRequest(trainer.id, trainer.userName, connectionStatus)}
                              className={buttonClass}
                              disabled={isDisabled}
                              title={isDisabled ? buttonText : 'Отправить запрос'}
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
            <p>Тренеров: {trainers.length}, Запрос: "{searchQuery}", Специализация: "{specialization}"</p>
            <p>Отправка к ID: {sendingToId || 'нет'}</p>
            <p>Статусы: {JSON.stringify(connectionStatuses)}</p>
         </div>
      </div>
   );
};

export default TrainerSearch;