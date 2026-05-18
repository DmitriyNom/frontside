import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FriendsList from '../../Components/FriendsList';
import FriendRequests from '../../Components/FriendRequests';
import FriendSearch from '../../Components/FriendSearch';
import {
   fetchFriendRequests,
   fetchFriendRequestsCount,
   selectRequestsCount
} from '../../../features/friendsSlice';
import styles from './ProfileFriends.module.css';

const ProfileFriends = ({ onUserClick }) => {
   const dispatch = useDispatch();
   const [activeSubTab, setActiveSubTab] = useState('friends');
   const requestsCount = useSelector(selectRequestsCount);

   // Функция для обновления данных запросов
   const refreshRequestsData = useCallback(() => {
      dispatch(fetchFriendRequests({ direction: 'all' }));
      dispatch(fetchFriendRequestsCount());
   }, [dispatch]);

   // Загрузка при монтировании
   useEffect(() => {
      refreshRequestsData();
   }, [refreshRequestsData]);

   // Обновляем данные при переключении на вкладку "Запросы"
   useEffect(() => {
      if (activeSubTab === 'requests') {
         refreshRequestsData();
      }
   }, [activeSubTab, refreshRequestsData]);


   useEffect(() => {
      const handleRefresh = () => {
         refreshRequestsData();
      };

      window.addEventListener('refreshFriendRequests', handleRefresh);

      return () => {
         window.removeEventListener('refreshFriendRequests', handleRefresh);
      };
   }, [refreshRequestsData]);

   return (
      <div className={styles.friendsContainer}>
         <header className={styles.pageHeader}>
            <h1>Друзья</h1>
            <p>Управляйте списком друзей и запросами</p>
         </header>

         <div className={styles.subTabs}>
            <button
               className={`${styles.subTab} ${activeSubTab === 'friends' ? styles.subTabActive : ''}`}
               onClick={() => setActiveSubTab('friends')}
            >
               Мои друзья
            </button>
            <button
               className={`${styles.subTab} ${activeSubTab === 'requests' ? styles.subTabActive : ''}`}
               onClick={() => setActiveSubTab('requests')}
            >
               Запросы
               {requestsCount?.total > 0 && (
                  <span className={styles.requestBadge}>{requestsCount.total}</span>
               )}
            </button>
            <button
               className={`${styles.subTab} ${activeSubTab === 'search' ? styles.subTabActive : ''}`}
               onClick={() => setActiveSubTab('search')}
            >
               Поиск друзей
            </button>
         </div>

         <div className={styles.subTabContent}>
            {activeSubTab === 'friends' && (
               <FriendsList isOwnProfile={true} onUserClick={onUserClick} />
            )}

            {activeSubTab === 'requests' && (
               <FriendRequests onUserClick={onUserClick} />
            )}

            {activeSubTab === 'search' && (
               <FriendSearch onUserClick={onUserClick} />
            )}
         </div>
      </div>
   );
};

export default ProfileFriends;