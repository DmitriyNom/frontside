// src/UI/Pages/Profile/Profile.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
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
import NoteForm from '../../Forms/NoteForm';
import { getUserRoleLabel } from '../../../constants/userRoles';
import styles from './Profile.module.css';

import ProfileOverview from './ProfileOverview';
import ProfileNotes from './ProfileNotes';
import ProfileTraining from './ProfileTraining';
import ProfileSettings from './ProfileSettings';
import ProfileMedia from './ProfileMedia';
import ProfileFriends from './ProfileFriends';

const Profile = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();
   const location = useLocation();

   const [activeTab, setActiveTab] = useState('overview');
   const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);

   // Селекторы
   const user = useSelector(selectUser);
   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);
   const isProfileFetched = useSelector(selectIsProfileFetched);
   const isTrainer = useSelector(selectIsTrainer);
   const isTrainee = useSelector(selectIsTrainee);

   // Мемоизированный ключ компонента
   const componentKey = useMemo(() => {
      return `${user?.id || 'no-user'}-${location.pathname}`;
   }, [user?.id, location.pathname]);

   // Мемоизированная информация о пользователе для логов
   const userInfo = useMemo(() => ({
      email: user?.email,
      role: user?.role,
      id: user?.id
   }), [user?.email, user?.role, user?.id]);

   // Лог монтирования - исправлен!
   useEffect(() => {
      console.log('🟢 Profile МОНТИРУЕТСЯ');
      console.log('🟢 Key:', componentKey);
      console.log('🟢 User:', userInfo.email);
      console.log('🟢 Роль:', userInfo.role);

      return () => {
         console.log('🔴 Profile РАЗМОНТИРУЕТСЯ с key:', componentKey);
      };
      // ✅ Добавляем зависимости, но эффект сработает только при монтировании/размонтировании
      // потому что в массиве нет изменяющихся значений
   }, []); // eslint-disable-line react-hooks/exhaustive-deps
   // ⬆️ Отключаем правило для этого эффекта, так как нам нужен только mount/unmount

   // Лог изменения user - теперь с правильными зависимостями
   useEffect(() => {
      console.log('🟡 user ИЗМЕНИЛСЯ:', userInfo.email, 'роль:', userInfo.role);
   }, [userInfo]);

   // Лог изменения location
   useEffect(() => {
      console.log('🟡 location ИЗМЕНИЛСЯ:', location.pathname);
   }, [location.pathname]);

   // Обработчик логаута
   const handleLogout = useCallback(async () => {
      console.log('🚪 Логаут пользователя:', userInfo.email);
      await dispatch(logoutUser());
      console.log('✅ Логаут выполнен, редирект на /login');
      navigate('/login', { replace: true });
   }, [dispatch, navigate, userInfo.email]);

   // Открыть/закрыть форму заметки
   const openNoteForm = useCallback(() => setIsNoteFormOpen(true), []);
   const closeNoteForm = useCallback(() => setIsNoteFormOpen(false), []);

   // Скролл при смене вкладки
   useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }, [activeTab]);

   // Загрузка профиля - исправлено!
   useEffect(() => {
      console.log('📡 Проверка загрузки профиля:', {
         hasUser: !!user,
         isProfileFetched,
         loading,
         key: componentKey
      });

      if (!user && !isProfileFetched && !loading) {
         console.log('📡 Загружаем профиль...');
         dispatch(fetchUserProfile());
      }
   }, [dispatch, user, isProfileFetched, loading, componentKey]);

   // Проверка редиректа - исправлено!
   useEffect(() => {
      console.log('🚦 Проверка редиректа:', {
         loading,
         hasUser: !!user,
         isProfileFetched,
         key: componentKey
      });

      if (!loading && !user && isProfileFetched) {
         console.log('🚦 Редирект на /login');
         navigate('/login', { replace: true });
      }
   }, [navigate, user, loading, isProfileFetched, componentKey]);

   // Рендер контента вкладок - мемоизирован
   const renderContent = useCallback(() => {
      console.log('🎨 Рендер контента для user:', userInfo.email);

      switch (activeTab) {
         case 'overview':
            return (
               <ProfileOverview
                  user={user}
                  onSwitchToMedia={() => setActiveTab('media')}
               />
            );
         case 'notes':
            return <ProfileNotes onOpenNoteForm={openNoteForm} />;
         case 'settings':
            return <ProfileSettings />;
         case 'training':
            return <ProfileTraining user={user} />;
         case 'media':
            return <ProfileMedia />;
         case 'friends': // 👈 НОВЫЙ CASE
            return <ProfileFriends />;
         default:
            return (
               <ProfileOverview
                  user={user}
                  onSwitchToMedia={() => setActiveTab('media')}
               />
            );
      }
   }, [activeTab, user, userInfo.email, openNoteForm]);
   // Загрузка
   if (loading) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   // Ошибка
   if (error) {
      return (
         <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Ошибка загрузки</h2>
            <p>{error}</p>
            <button
               className={styles.retryButton}
               onClick={() => dispatch(fetchUserProfile())}
               type="button"
            >
               Попробовать снова
            </button>
         </div>
      );
   }

   // Успешная загрузка с пользователем
   if (user) {
      return (
         <div key={componentKey} className={styles.profileContainer}>
            <div className={styles.profileLayout}>
               {/* Сайдбар */}
               <aside className={styles.sidebar}>
                  <div className={styles.userCard}>
                     <div className={styles.avatar}>
                        {user.userName?.charAt(0).toUpperCase() || 'U'}
                     </div>
                     <div className={styles.userInfo}>
                        <h3>{user.userName}</h3>
                        <span className={styles.userEmail}>{user.email}</span>
                        <span className={`${styles.userRole} ${styles[user.role]}`}>
                           {getUserRoleLabel(user.role)}
                        </span>
                     </div>
                  </div>

                  {/* Навигация */}
                  <nav className={styles.navigation}>
                     <button
                        className={`${styles.navLink} ${activeTab === 'overview' ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab('overview')}
                        type="button"
                     >
                        📊 Обзор
                     </button>
                     <button
                        className={`${styles.navLink} ${activeTab === 'notes' ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab('notes')}
                        type="button"
                     >
                        📝 Заметки
                     </button>
                     <button
                        className={`${styles.navLink} ${activeTab === 'media' ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab('media')}
                        type="button"
                     >
                        🖼️ Медиа
                     </button>
                     {(isTrainee || isTrainer) && (
                        <button
                           className={`${styles.navLink} ${activeTab === 'training' ? styles.navLinkActive : ''}`}
                           onClick={() => setActiveTab('training')}
                           type="button"
                        >
                           {isTrainer ? '👥 Мои подопечные' : '💪 Тренировки'}
                        </button>
                     )}
                     <button
                        className={`${styles.navLink} ${activeTab === 'connections' ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab('connections')}
                        type="button"
                     >
                        🤝 Связи
                     </button>
                     {/* 👇 НОВЫЙ ПУНКТ - ДРУЗЬЯ */}
                     <button
                        className={`${styles.navLink} ${activeTab === 'friends' ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab('friends')}
                        type="button"
                     >
                        👥 Друзья
                        {/* Можно добавить бейдж с количеством запросов позже */}
                        {/* {requestsCount > 0 && (
         <span className={styles.badge}>{requestsCount}</span>
      )} */}
                     </button>
                     <button
                        className={`${styles.navLink} ${activeTab === 'settings' ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab('settings')}
                        type="button"
                     >
                        ⚙️ Настройки профиля
                     </button>
                  </nav>

                  <button
                     className={styles.logoutButton}
                     onClick={handleLogout}
                     type="button"
                  >
                     🚪 Выйти
                  </button>
               </aside>

               {/* Основной контент */}
               <main className={styles.mainContent}>
                  {renderContent()}
               </main>
            </div>

            {/* Модальное окно для заметки */}
            {isNoteFormOpen && (
               <NoteForm
                  isOpen={isNoteFormOpen}
                  onClose={closeNoteForm}
                  isEdit={false}
               />
            )}
         </div>
      );
   }

   // Проверка профиля
   return <div className={styles.checking}>Проверяем профиль...</div>;
};

export default Profile;