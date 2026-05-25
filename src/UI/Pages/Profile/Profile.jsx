// frontend/src/UI/Pages/Profile/Profile.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
   fetchUserProfile,
   selectUser,
   selectLoading,
   selectError,
   selectIsProfileFetched,
   selectIsTrainer,
   selectIsTrainee
} from '../../../features/authSlice';
import { logoutUser } from '../../../store/rootActions';
import { getUserRoleLabel } from '../../../constants/userRoles';
import { getAvatarUrl, tasksAPI } from '../../../api/api';
import { getTrainingLevelLabel } from '../../../constants/trainingLevels';
import { friendsAPI } from '../../../api/api';
import commonStyles from '../../../styles/friends-common.module.css';
import styles from './Profile.module.css';

import ProfileOverview from './ProfileOverview';
import ProfileNotes from './ProfileNotes';
import ProfileTraining from './ProfileTraining';
import ProfileSettings from './ProfileSettings';
import ProfileMedia from './ProfileMedia';
import ProfileFriends from './ProfileFriends';
import ProfileTasks from './ProfileTasks';
import UserProfileModal from '../../Components/UserProfileModal';
import NoteForm from '../../Forms/NoteForm';  // ← ИСПРАВЛЕНО

import {
   selectTaskStats,
   fetchTaskStats,
   selectHasNewIncomingTask,
   selectUnreadTasksCount,
   setCurrentUserId
} from '../../../features/taskSlice';

const Profile = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const [activeTab, setActiveTab] = useState('overview');
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [selectedUserId, setSelectedUserId] = useState(null);
   const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
   const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);

   const user = useSelector(selectUser);
   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);
   const isProfileFetched = useSelector(selectIsProfileFetched);
   const isTrainer = useSelector(selectIsTrainer);
   const isTrainee = useSelector(selectIsTrainee);

   const stats = useSelector(selectTaskStats);
   const hasNewIncomingTask = useSelector(selectHasNewIncomingTask);
   const unreadTasksCount = useSelector(selectUnreadTasksCount);
   const activeTasksCount = stats?.active || 0;

   // 🐛 ЛОГ ДЛЯ ОТЛАДКИ
   useEffect(() => {
      console.log('🔍 Profile Debug:', {
         userId: user?.id,
         activeTasksCount,
         unreadTasksCount,
         hasNewIncomingTask,
         stats,
         timestamp: new Date().toISOString()
      });
   }, [user?.id, activeTasksCount, unreadTasksCount, hasNewIncomingTask, stats]);

   // Загрузка количества запросов в друзья
   const loadPendingRequestsCount = useCallback(async () => {
      if (!user) return;
      try {
         const response = await friendsAPI.getRequestsCount();
         const count = response.data?.data?.incoming || 0;
         setPendingRequestsCount(count);
      } catch (err) {
         console.error('Ошибка загрузки количества запросов:', err);
      }
   }, [user]);

   // Загрузка статистики заданий (обновляем Redux)
   const loadTasksStats = useCallback(async () => {
      if (!user) return;
      try {
         await tasksAPI.getTaskStats();
         setTimeout(() => {
            dispatch(fetchTaskStats());
         }, 0);
      } catch (err) {
         console.error('Ошибка загрузки статистики заданий:', err);
      }
   }, [user, dispatch]);

   const refreshTasksCount = useCallback(() => {
      setTimeout(() => {
         dispatch(fetchTaskStats());
      }, 0);
   }, [dispatch]);

   // Установка currentUserId в taskSlice
   useEffect(() => {
      if (user?.id) {
         console.log('🔑 Setting currentUserId in taskSlice:', user.id);
         dispatch(setCurrentUserId(user.id));
      }
   }, [dispatch, user]);

   // Слушаем событие обновления запросов
   useEffect(() => {
      const handleRefresh = () => {
         loadPendingRequestsCount();
      };

      window.addEventListener('refreshFriendRequests', handleRefresh);

      return () => {
         window.removeEventListener('refreshFriendRequests', handleRefresh);
      };
   }, [loadPendingRequestsCount]);

   // Слушаем событие обновления заданий (для обновления бейджа)
   useEffect(() => {
      const handleTasksUpdate = () => {
         console.log('📡 tasks-updated event received');
         setTimeout(() => {
            dispatch(fetchTaskStats());
         }, 0);
      };

      window.addEventListener('tasks-updated', handleTasksUpdate);

      return () => {
         window.removeEventListener('tasks-updated', handleTasksUpdate);
      };
   }, [dispatch]);

   // Слушаем тост-события
   useEffect(() => {
      const handleNewTaskToast = (event) => {
         const { taskTitle, assignerName, taskId } = event.detail;
         console.log('🔔 new-task-toast event received:', { taskId, taskTitle, assignerName });

         toast.info(`📋 Новое задание от ${assignerName}: "${taskTitle}"`, {
            position: "top-right",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClick: () => {
               setActiveTab('tasks');
            }
         });
      };

      window.addEventListener('new-task-toast', handleNewTaskToast);
      return () => {
         window.removeEventListener('new-task-toast', handleNewTaskToast);
      };
   }, []);

   // Загружаем при монтировании
   useEffect(() => {
      if (user) {
         loadPendingRequestsCount();
         loadTasksStats();
      }
   }, [user, loadPendingRequestsCount, loadTasksStats]);

   useEffect(() => {
      if (user) {
         setTimeout(() => {
            dispatch(fetchTaskStats());
         }, 0);
      }
   }, [dispatch, user]);

   useEffect(() => {
      if (!user && !isProfileFetched && !loading) {
         dispatch(fetchUserProfile());
      }
   }, [dispatch, user, isProfileFetched, loading]);

   useEffect(() => {
      if (!loading && !user && isProfileFetched) {
         navigate('/login', { replace: true });
      }
   }, [navigate, user, loading, isProfileFetched]);

   const handleLogout = useCallback(async () => {
      await dispatch(logoutUser());
      navigate('/login', { replace: true });
   }, [dispatch, navigate]);

   useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }, [activeTab]);

   const handleUserClick = useCallback((userId) => {
      setSelectedUserId(userId);
   }, []);

   // Экспортируем refreshTasksCount для использования в других компонентах
   useEffect(() => {
      window.refreshTasksCount = refreshTasksCount;
      return () => {
         delete window.refreshTasksCount;
      };
   }, [refreshTasksCount]);

   const renderContent = useMemo(() => {
      switch (activeTab) {
         case 'overview':
            return <ProfileOverview onSwitchToMedia={() => setActiveTab('media')} />;
         case 'notes':
            return <ProfileNotes onOpenNoteForm={() => setIsNoteFormOpen(true)} />;
         case 'training':
            return <ProfileTraining user={user} />;
         case 'media':
            return <ProfileMedia />;
         case 'tasks':
            return <ProfileTasks />;
         case 'friends':
            return <ProfileFriends onUserClick={handleUserClick} />;
         case 'settings':
            return <ProfileSettings />;
         default:
            return <ProfileOverview onSwitchToMedia={() => setActiveTab('media')} />;
      }
   }, [activeTab, user, handleUserClick]);

   // Пункты навигации
   const navItems = useMemo(() => {
      console.log('📋 Building navItems:', {
         unreadTasksCount,
         activeTasksCount,
         hasNewIncomingTask,
         willShowUnreadBadge: unreadTasksCount > 0,
         willShowRegularBadge: (activeTasksCount > 0 && unreadTasksCount === 0)
      });

      const items = [
         { id: 'overview', label: 'Обзор', icon: '📊' },
         { id: 'notes', label: 'Заметки', icon: '📝' },
         { id: 'media', label: 'Медиа', icon: '🖼️' },
         {
            id: 'tasks',
            label: 'Задания',
            icon: '📋',
            unreadBadge: unreadTasksCount > 0 ? unreadTasksCount : null,
            badge: (activeTasksCount > 0 && unreadTasksCount === 0) ? activeTasksCount : null,
            hasNew: hasNewIncomingTask
         },
         ...((isTrainee || isTrainer) ? [{ id: 'training', label: isTrainer ? 'Подопечные' : 'Тренировки', icon: isTrainer ? '👥' : '💪' }] : []),
         {
            id: 'friends',
            label: 'Друзья',
            icon: '👥',
            badge: pendingRequestsCount > 0 ? pendingRequestsCount : null
         },
         { id: 'settings', label: 'Настройки', icon: '⚙️' }
      ];
      return items;
   }, [isTrainee, isTrainer, pendingRequestsCount, activeTasksCount, unreadTasksCount, hasNewIncomingTask]);

   if (loading && !user) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   if (error) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.emptyIcon}>⚠️</div>
            <h4>Ошибка загрузки</h4>
            <p>{error}</p>
            <button
               className={commonStyles.textButton}
               onClick={() => dispatch(fetchUserProfile())}
            >
               Попробовать снова
            </button>
         </div>
      );
   }

   if (!user) {
      return (
         <div className={commonStyles.emptyState}>
            <div className={commonStyles.spinner}></div>
            <p>Проверка профиля...</p>
         </div>
      );
   }

   return (
      <div className={styles.profileContainer}>
         <button
            className={styles.menuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
         >
            {mobileMenuOpen ? '✕' : '☰'}
         </button>

         <div className={styles.profileLayout}>
            <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
               <div className={styles.sidebarHeader}>
                  <div className={`${commonStyles.avatar} ${styles.avatarLarge}`}>
                     {user.userAvatar ? (
                        <img src={getAvatarUrl(user.userAvatar)} alt={user.userName} />
                     ) : (
                        user.userName?.charAt(0).toUpperCase() || 'U'
                     )}
                  </div>
                  <h3 className={styles.userName}>{user.userName}</h3>
                  <div className={`${styles.userRole} ${styles[user.role]}`}>
                     {getUserRoleLabel(user.role)}
                  </div>
                  {user.training_level && (
                     <div className={styles.userLevel}>
                        Уровень: {getTrainingLevelLabel(user.training_level)}
                     </div>
                  )}
               </div>

               <nav className={styles.navigation}>
                  {navItems.map((item) => (
                     <button
                        key={item.id}
                        className={`${styles.navLink} ${activeTab === item.id ? styles.navLinkActive : ''}`}
                        onClick={() => {
                           setActiveTab(item.id);
                           setMobileMenuOpen(false);
                        }}
                     >
                        <span className={styles.navIcon}>{item.icon}</span>
                        {item.label}
                        {item.unreadBadge && (
                           <span className={`${styles.unreadBadge} ${item.hasNew ? styles.hasNew : ''}`}>
                              {item.unreadBadge}
                           </span>
                        )}
                        {item.badge && !item.unreadBadge && (
                           <span className={styles.badge}>{item.badge}</span>
                        )}
                     </button>
                  ))}
               </nav>

               <button className={styles.logoutButton} onClick={handleLogout}>
                  🚪 Выйти
               </button>
            </aside>

            <main className={styles.mainContent}>
               {renderContent}
            </main>
         </div>

         <UserProfileModal
            isOpen={!!selectedUserId}
            onClose={() => setSelectedUserId(null)}
            userId={selectedUserId}
            currentUserId={user?.id}
            onUserClick={handleUserClick}
         />

         {/* Модалка создания заметки */}
         {isNoteFormOpen && (
            <NoteForm
               isOpen={isNoteFormOpen}
               onClose={() => setIsNoteFormOpen(false)}
               isEdit={false}
            />
         )}
      </div>
   );
};

export default Profile;