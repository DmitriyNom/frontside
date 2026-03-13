// // src/UI/Pages/Profile/ProfileConnections.jsx
// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import {
//    selectUser,
//    selectUserRole
// } from '../../../features/authSlice';
// import {
//    fetchMyTrainees,
//    fetchMyTrainers,
//    fetchIncomingRequests,
//    fetchOutgoingRequests,
//    fetchTrainerRecommendations,
//    fetchConnectionStats,
//    removeConnection,
//    selectTrainees,
//    selectTrainers,
//    selectConnectionStats,
//    selectTraineesLoading,
//    selectTrainersLoading,
//    selectTraineesError,
//    selectTrainersError,
// } from '../../../features/connectionsSlice';
// import ConnectionsList from '../../Components/ConnectionsList';
// import ConnectionRequests from '../../Components/ConnectionRequests';
// import TrainerSearch from '../../Components/TrainerSearch';
// import TraineeSearch from '../../Components/TraineeSearch';
// import styles from './ProfileConnections.module.css';

// const ProfileConnections = () => {
//    const dispatch = useDispatch();
//    const user = useSelector(selectUser);
//    const userRole = useSelector(selectUserRole);

//    // Состояния из connectionsSlice
//    const trainees = useSelector(selectTrainees);
//    const trainers = useSelector(selectTrainers);
//    const stats = useSelector(selectConnectionStats);

//    // Ошибки
//    const traineesError = useSelector(selectTraineesError);
//    const trainersError = useSelector(selectTrainersError);

//    // Состояния загрузки
//    const loadingTrainees = useSelector(selectTraineesLoading);
//    const loadingTrainers = useSelector(selectTrainersLoading);

//    const [activeTab, setActiveTab] = useState('connections');
//    const [isRoleReady, setIsRoleReady] = useState(false);

//    // ✅ ИСПРАВЛЕНИЕ: Ждем определения роли перед загрузкой данных
//    useEffect(() => {
//       // Проверяем, определена ли роль
//       if (!userRole || userRole === 'skipped') {
//          console.log('⏳ ProfileConnections: Ожидание определения роли...');
//          setIsRoleReady(false);
//          return;
//       }

//       console.log('🟢 ProfileConnections: Роль определена как', userRole);
//       setIsRoleReady(true);

//       // Загружаем данные в зависимости от роли
//       const loadData = () => {
//          if (userRole === 'trainer') {
//             console.log('🟡 Загрузка данных для тренера');
//             dispatch(fetchMyTrainees());
//             dispatch(fetchIncomingRequests({ status: 'pending' }));
//          }

//          if (userRole === 'trainee') {
//             console.log('🟡 Загрузка данных для спортсмена');
//             dispatch(fetchMyTrainers());
//             dispatch(fetchOutgoingRequests({ status: 'pending' }));
//             dispatch(fetchTrainerRecommendations({ limit: 5 }));
//          }

//          // Статистика загружается для всех
//          dispatch(fetchConnectionStats());
//       };

//       loadData();
//    }, [dispatch, userRole]);

//    // Функция для обновления данных
//    const refreshData = () => {
//       if (!isRoleReady) return;

//       if (userRole === 'trainer') {
//          dispatch(fetchMyTrainees());
//          dispatch(fetchIncomingRequests({ status: 'pending' }));
//       }

//       if (userRole === 'trainee') {
//          dispatch(fetchMyTrainers());
//          dispatch(fetchOutgoingRequests({ status: 'pending' }));
//       }

//       dispatch(fetchConnectionStats());
//    };

//    // Функция для удаления связи
//    const handleRemoveConnection = (userId) => {
//       dispatch(removeConnection(userId))
//          .then(() => refreshData())
//          .catch(error => {
//             console.error('Ошибка при удалении связи:', error);
//             alert('Не удалось удалить связь. Попробуйте снова.');
//          });
//    };

//    // Определяем доступные вкладки в зависимости от роли
//    const getAvailableTabs = () => {
//       // Если роль не определена, показываем только базовые вкладки
//       if (!isRoleReady) {
//          return [
//             { id: 'connections', label: 'Мои связи', icon: '🤝' },
//             { id: 'requests', label: 'Запросы', icon: '📨' },
//          ];
//       }

//       const tabs = [
//          { id: 'connections', label: 'Мои связи', icon: '🤝' },
//          { id: 'requests', label: 'Запросы', icon: '📨' },
//       ];

//       // Поиск тренеров только для подопечных
//       if (userRole === 'trainee') {
//          tabs.push({ id: 'search', label: 'Найти тренера', icon: '🔍' });
//       }

//       // Поиск подопечных только для тренеров
//       if (userRole === 'trainer') {
//          tabs.push({ id: 'search', label: 'Найти подопечного', icon: '🔍' });
//       }

//       return tabs;
//    };

//    const availableTabs = getAvailableTabs();

//    // Получаем текст для заголовка в зависимости от вкладки и роли
//    const getHeaderTitle = () => {
//       if (!isRoleReady) {
//          return activeTab === 'connections' ? '🤝 Мои связи' :
//             activeTab === 'requests' ? '📨 Запросы' : 'Связи';
//       }

//       if (activeTab === 'connections') {
//          return userRole === 'trainer' ? '🤝 Мои подопечные' : '🤝 Мои тренеры';
//       } else if (activeTab === 'requests') {
//          return '📨 Запросы на подключение';
//       } else if (activeTab === 'search') {
//          return userRole === 'trainer' ? '🔍 Поиск подопечных' : '🔍 Поиск тренеров';
//       }
//       return 'Связи';
//    };

//    // Проверка, нужно ли показывать кнопку обновления
//    const shouldShowRefreshButton = () => {
//       if (!isRoleReady) return false;
//       return activeTab !== 'connections';
//    };

//    // Рендер контента в зависимости от активной вкладки
//    const renderContent = () => {
//       // Если роль не готова, показываем загрузку
//       if (!isRoleReady) {
//          return (
//             <div className={styles.loadingContent}>
//                <div className={styles.spinner}></div>
//                <p>Определение роли пользователя...</p>
//             </div>
//          );
//       }

//       switch (activeTab) {
//          case 'connections':
//             // Проверяем ошибки для тренера
//             if (userRole === 'trainer' && traineesError) {
//                return (
//                   <div className={styles.errorContainer}>
//                      <p>Ошибка: {traineesError}</p>
//                      <button
//                         onClick={() => dispatch(fetchMyTrainees())}
//                         className={styles.retryButton}
//                      >
//                         Повторить попытку
//                      </button>
//                   </div>
//                );
//             }

//             // Проверяем ошибки для спортсмена
//             if (userRole === 'trainee' && trainersError) {
//                return (
//                   <div className={styles.errorContainer}>
//                      <p>Ошибка: {trainersError}</p>
//                      <button
//                         onClick={() => dispatch(fetchMyTrainers())}
//                         className={styles.retryButton}
//                      >
//                         Повторить попытку
//                      </button>
//                   </div>
//                );
//             }

//             return (
//                <ConnectionsList
//                   trainees={trainees}
//                   trainers={trainers}
//                   loadingTrainees={loadingTrainees}
//                   loadingTrainers={loadingTrainers}
//                   isTrainer={userRole === 'trainer'}
//                   onRemoveConnection={handleRemoveConnection}
//                />
//             );

//          case 'requests':
//             return <ConnectionRequests userRole={userRole === 'trainer' ? 'тренер' : 'подопечный'} />;

//          case 'search':
//             return userRole === 'trainer' ? <TraineeSearch /> : <TrainerSearch />;

//          default:
//             return (
//                <ConnectionsList
//                   trainees={trainees}
//                   trainers={trainers}
//                   loadingTrainees={loadingTrainees}
//                   loadingTrainers={loadingTrainers}
//                   isTrainer={userRole === 'trainer'}
//                   onRemoveConnection={handleRemoveConnection}
//                />
//             );
//       }
//    };

//    // Определяем, идет ли загрузка для текущей вкладки
//    const isLoadingCurrentTab = () => {
//       if (!isRoleReady) return true;

//       if (activeTab === 'connections') {
//          return userRole === 'trainer' ? loadingTrainees : loadingTrainers;
//       }
//       return false;
//    };

//    // Если нет пользователя, показываем загрузку
//    if (!user) {
//       return (
//          <div className={styles.loadingContainer}>
//             <div className={styles.spinner}></div>
//             <p>Загрузка данных...</p>
//          </div>
//       );
//    }

//    return (
//       <div className={styles.container}>
//          <header className={styles.header}>
//             <h1 className={styles.title}>
//                {getHeaderTitle()}
//             </h1>
//             {/* Кнопка обновления только для определенных вкладок */}
//             {shouldShowRefreshButton() && (
//                <button
//                   className={styles.refreshButton}
//                   onClick={refreshData}
//                   disabled={isLoadingCurrentTab()}
//                   type="button"
//                >
//                   <span className={styles.buttonIcon}>🔄</span>
//                   {isLoadingCurrentTab() ? 'Обновление...' : 'Обновить'}
//                </button>
//             )}
//          </header>

//          {/* Навигация по вкладкам */}
//          <nav className={styles.tabNavigation}>
//             {availableTabs.map(tab => (
//                <button
//                   key={tab.id}
//                   className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
//                   onClick={() => setActiveTab(tab.id)}
//                   type="button"
//                >
//                   <span className={styles.tabIcon}>{tab.icon}</span>
//                   <span className={styles.tabLabel}>{tab.label}</span>
//                </button>
//             ))}
//          </nav>

//          {/* Основной контент */}
//          <div className={styles.content}>
//             {isLoadingCurrentTab() && activeTab === 'connections' ? (
//                <div className={styles.loadingContent}>
//                   <div className={styles.spinner}></div>
//                   <p>Загрузка данных...</p>
//                </div>
//             ) : (
//                renderContent()
//             )}
//          </div>

//          {/* Статистика в футере */}
//          {stats && isRoleReady && (
//             <footer className={styles.footerStats}>
//                <div className={styles.statItem}>
//                   <span className={styles.statLabel}>
//                      {userRole === 'trainer' ? 'Подопечные:' : 'Тренеры:'}
//                   </span>
//                   <span className={styles.statValue}>
//                      {userRole === 'trainer' ? stats.trainees_count || 0 : stats.trainers_count || 0}
//                   </span>
//                </div>

//                <div className={styles.statItem}>
//                   <span className={styles.statLabel}>
//                      {userRole === 'trainer' ? 'Входящие запросы:' : 'Исходящие запросы:'}
//                   </span>
//                   <span className={styles.statValue}>
//                      {userRole === 'trainer' ? stats.incoming_requests_count || 0 : stats.outgoing_requests_count || 0}
//                   </span>
//                </div>

//                <div className={styles.statItem}>
//                   <span className={styles.statLabel}>Всего связей:</span>
//                   <span className={styles.statValue}>{stats.total_connections || 0}</span>
//                </div>
//             </footer>
//          )}
//       </div>
//    );
// };

// export default ProfileConnections;

// src/UI/Pages/Profile/ProfileConnections.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
   selectUser,
   selectUserRole
} from '../../../features/authSlice';
import {
   fetchMyTrainees,
   fetchMyTrainers,
   fetchIncomingRequests,
   fetchOutgoingRequests,
   fetchTrainerRecommendations,
   fetchConnectionStats,
   selectConnectionStats,
   selectTraineesError,
   selectTrainersError,
   selectTraineesLoading,
   selectTrainersLoading,
} from '../../../features/connectionsSlice';
import ConnectionsList from '../../Components/ConnectionsList';
import ConnectionRequests from '../../Components/ConnectionRequests';
import TrainerSearch from '../../Components/TrainerSearch';
import TraineeSearch from '../../Components/TraineeSearch';
import styles from './ProfileConnections.module.css';

const ProfileConnections = () => {
   const dispatch = useDispatch();
   const user = useSelector(selectUser);
   const userRole = useSelector(selectUserRole);

   // Только нужные данные для родительского компонента
   const stats = useSelector(selectConnectionStats);
   const traineesError = useSelector(selectTraineesError);
   const trainersError = useSelector(selectTrainersError);
   const loadingTrainees = useSelector(selectTraineesLoading);
   const loadingTrainers = useSelector(selectTrainersLoading);

   const [activeTab, setActiveTab] = useState('connections');
   const [isRoleReady, setIsRoleReady] = useState(false);

   // Загрузка данных при изменении роли
   useEffect(() => {
      if (!userRole || userRole === 'skipped') {
         console.log('⏳ ProfileConnections: Ожидание определения роли...');
         setIsRoleReady(false);
         return;
      }

      console.log('🟢 ProfileConnections: Роль определена как', userRole);
      setIsRoleReady(true);

      const loadData = () => {
         if (userRole === 'trainer') {
            console.log('🟡 Загрузка данных для тренера');
            dispatch(fetchMyTrainees());
            dispatch(fetchIncomingRequests({ status: 'pending' }));
         }

         if (userRole === 'trainee') {
            console.log('🟡 Загрузка данных для спортсмена');
            dispatch(fetchMyTrainers());
            dispatch(fetchOutgoingRequests({ status: 'pending' }));
            dispatch(fetchTrainerRecommendations({ limit: 5 }));
         }

         dispatch(fetchConnectionStats());
      };

      loadData();
   }, [dispatch, userRole]);

   // Функция для ручного обновления данных
   const refreshData = () => {
      if (!isRoleReady) return;

      if (userRole === 'trainer') {
         dispatch(fetchMyTrainees());
         dispatch(fetchIncomingRequests({ status: 'pending' }));
      }

      if (userRole === 'trainee') {
         dispatch(fetchMyTrainers());
         dispatch(fetchOutgoingRequests({ status: 'pending' }));
      }

      dispatch(fetchConnectionStats());
   };

   // Определяем доступные вкладки
   const getAvailableTabs = () => {
      if (!isRoleReady) {
         return [
            { id: 'connections', label: 'Мои связи', icon: '🤝' },
            { id: 'requests', label: 'Запросы', icon: '📨' },
         ];
      }

      const tabs = [
         { id: 'connections', label: 'Мои связи', icon: '🤝' },
         { id: 'requests', label: 'Запросы', icon: '📨' },
      ];

      if (userRole === 'trainee') {
         tabs.push({ id: 'search', label: 'Найти тренера', icon: '🔍' });
      }

      if (userRole === 'trainer') {
         tabs.push({ id: 'search', label: 'Найти подопечного', icon: '🔍' });
      }

      return tabs;
   };

   const availableTabs = getAvailableTabs();

   // Заголовок в зависимости от вкладки
   const getHeaderTitle = () => {
      if (!isRoleReady) {
         return activeTab === 'connections' ? '🤝 Мои связи' :
            activeTab === 'requests' ? '📨 Запросы' : 'Связи';
      }

      if (activeTab === 'connections') {
         return userRole === 'trainer' ? '🤝 Мои подопечные' : '🤝 Мои тренеры';
      } else if (activeTab === 'requests') {
         return '📨 Запросы на подключение';
      } else if (activeTab === 'search') {
         return userRole === 'trainer' ? '🔍 Поиск подопечных' : '🔍 Поиск тренеров';
      }
      return 'Связи';
   };

   // Показывать кнопку обновления только для вкладок с запросами
   const shouldShowRefreshButton = () => {
      if (!isRoleReady) return false;
      return activeTab === 'requests';
   };

   // Загрузка текущей вкладки
   const isLoadingCurrentTab = () => {
      if (!isRoleReady) return true;

      if (activeTab === 'connections') {
         return userRole === 'trainer' ? loadingTrainees : loadingTrainers;
      }
      return false;
   };

   // Рендер контента
   const renderContent = () => {
      if (!isRoleReady) {
         return (
            <div className={styles.loadingContent}>
               <div className={styles.spinner}></div>
               <p>Определение роли пользователя...</p>
            </div>
         );
      }

      switch (activeTab) {
         case 'connections':
            // Проверяем ошибки
            if (userRole === 'trainer' && traineesError) {
               return (
                  <div className={styles.errorContainer}>
                     <p>Ошибка: {traineesError}</p>
                     <button
                        onClick={() => dispatch(fetchMyTrainees())}
                        className={styles.retryButton}
                     >
                        Повторить попытку
                     </button>
                  </div>
               );
            }

            if (userRole === 'trainee' && trainersError) {
               return (
                  <div className={styles.errorContainer}>
                     <p>Ошибка: {trainersError}</p>
                     <button
                        onClick={() => dispatch(fetchMyTrainers())}
                        className={styles.retryButton}
                     >
                        Повторить попытку
                     </button>
                  </div>
               );
            }

            // Упрощенный вызов - передаем только роль
            return <ConnectionsList userRole={userRole} />;

         case 'requests':
            return <ConnectionRequests userRole={userRole === 'trainer' ? 'тренер' : 'подопечный'} />;

         case 'search':
            return userRole === 'trainer' ? <TraineeSearch /> : <TrainerSearch />;

         default:
            return <ConnectionsList userRole={userRole} />;
      }
   };

   if (!user) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка данных...</p>
         </div>
      );
   }

   return (
      <div className={styles.container}>
         <header className={styles.header}>
            <h1 className={styles.title}>
               {getHeaderTitle()}
            </h1>
            {shouldShowRefreshButton() && (
               <button
                  className={styles.refreshButton}
                  onClick={refreshData}
                  disabled={isLoadingCurrentTab()}
                  type="button"
               >
                  <span className={styles.buttonIcon}>🔄</span>
                  {isLoadingCurrentTab() ? 'Обновление...' : 'Обновить'}
               </button>
            )}
         </header>

         <nav className={styles.tabNavigation}>
            {availableTabs.map(tab => (
               <button
                  key={tab.id}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
               >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span className={styles.tabLabel}>{tab.label}</span>
               </button>
            ))}
         </nav>

         <div className={styles.content}>
            {isLoadingCurrentTab() && activeTab === 'connections' ? (
               <div className={styles.loadingContent}>
                  <div className={styles.spinner}></div>
                  <p>Загрузка данных...</p>
               </div>
            ) : (
               renderContent()
            )}
         </div>

         {stats && isRoleReady && (
            <footer className={styles.footerStats}>
               <div className={styles.statItem}>
                  <span className={styles.statLabel}>
                     {userRole === 'trainer' ? 'Подопечные:' : 'Тренеры:'}
                  </span>
                  <span className={styles.statValue}>
                     {userRole === 'trainer' ? stats.trainees_count || 0 : stats.trainers_count || 0}
                  </span>
               </div>

               <div className={styles.statItem}>
                  <span className={styles.statLabel}>
                     {userRole === 'trainer' ? 'Входящие запросы:' : 'Исходящие запросы:'}
                  </span>
                  <span className={styles.statValue}>
                     {userRole === 'trainer' ? stats.incoming_requests_count || 0 : stats.outgoing_requests_count || 0}
                  </span>
               </div>

               <div className={styles.statItem}>
                  <span className={styles.statLabel}>Всего связей:</span>
                  <span className={styles.statValue}>{stats.total_connections || 0}</span>
               </div>
            </footer>
         )}
      </div>
   );
};

export default ProfileConnections;