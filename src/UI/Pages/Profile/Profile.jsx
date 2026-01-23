// src/UI/Pages/Profile/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
   fetchUserProfile,
   logoutUser,
   selectUser,
   selectLoading,
   selectError,
   selectIsProfileFetched,
   selectIsTrainer,
   selectIsTrainee
} from '../../../features/authSlice';
// import { selectNotes } from '../../../features/notesSlice';
import NoteForm from '../../Forms/NoteForm';
import { getUserRoleLabel } from '../../../constants/userRoles';
import styles from './Profile.module.css';

// Импортируем новые компоненты вкладок
import ProfileOverview from './ProfileOverview';
import ProfileNotes from './ProfileNotes';
import ProfileTraining from './ProfileTraining';
import ProfileSettings from './ProfileSettings'; // Новая расширенная версия
import ProfileMedia from './ProfileMedia'; // ✅ НОВЫЙ: Импортируем компонент медиа

const Profile = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const [activeTab, setActiveTab] = useState('overview');
   const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);

   const user = useSelector(selectUser);
   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);
   const isProfileFetched = useSelector(selectIsProfileFetched);
   // const notes = useSelector(selectNotes);
   const isTrainer = useSelector(selectIsTrainer);
   const isTrainee = useSelector(selectIsTrainee);

   const handleLogout = async () => {
      await dispatch(logoutUser());
      navigate('/login');
   };

   const openNoteForm = () => setIsNoteFormOpen(true);
   const closeNoteForm = () => setIsNoteFormOpen(false);

   // Сбрасываем скролл при смене вкладки
   useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }, [activeTab]);

   useEffect(() => {
      if (!user && !isProfileFetched && !loading) {
         dispatch(fetchUserProfile());
      }
   }, [dispatch, user, isProfileFetched, loading]);

   useEffect(() => {
      if (!loading && !user && isProfileFetched) {
         navigate('/login');
      }
   }, [navigate, user, loading, isProfileFetched]);

   // Рендер контента в зависимости от активной вкладки
   const renderContent = () => {
      switch (activeTab) {
         case 'overview':
            return <ProfileOverview
               user={user}
               onSwitchToMedia={() => setActiveTab('media')} // ✅ Передаем функцию переключения
            />;
         case 'notes':
            return <ProfileNotes onOpenNoteForm={openNoteForm} />;
         case 'settings':
            return <ProfileSettings />;
         case 'training':
            // Используем один case, но внутри компонент сам решит что показывать
            return <ProfileTraining user={user} />;
         case 'media':
            return <ProfileMedia />;
         default:
            return <ProfileOverview
               user={user}
               onSwitchToMedia={() => setActiveTab('media')}
            />;
      }
   };

   if (loading) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   if (error) {
      return (
         <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Ошибка загрузки</h2>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={() => dispatch(fetchUserProfile())}>
               Попробовать снова
            </button>
         </div>
      );
   }

   if (user) {
      return (
         <div className={styles.profileContainer}>
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

                     {/* ✅ НОВЫЙ: Кнопка для медиа-библиотеки */}
                     <button
                        className={`${styles.navLink} ${activeTab === 'media' ? styles.navLinkActive : ''}`}
                        onClick={() => setActiveTab('media')}
                        type="button"
                     >
                        🖼️ Медиа
                     </button>

                     {/* Объединяем training для обеих ролей в одну кнопку */}
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

            {/* Модальное окно для создания заметки */}
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

   return <div className={styles.checking}>Проверяем профиль...</div>;
};

export default Profile;