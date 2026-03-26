import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FriendsList from '../../Components/FriendsList';
import FriendRequests from '../../Components/FriendRequests';
import FriendSearch from '../../Components/FriendSearch'; // 👈 ИМПОРТИРУЕМ
import {
   fetchFriendRequests,
   fetchFriendRequestsCount,
   selectRequestsCount
} from '../../../features/friendsSlice';
import styles from './ProfileFriends.module.css';

const ProfileFriends = () => {
   const dispatch = useDispatch();
   const [activeSubTab, setActiveSubTab] = useState('friends');

   const requestsCount = useSelector(selectRequestsCount);

   useEffect(() => {
      dispatch(fetchFriendRequests({ direction: 'all' }));
      dispatch(fetchFriendRequestsCount());
   }, [dispatch]);

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
               <FriendsList isOwnProfile={true} />
            )}

            {activeSubTab === 'requests' && (
               <FriendRequests />
            )}

            {activeSubTab === 'search' && (
               <FriendSearch /> // 👈 ИСПОЛЬЗУЕМ НОВЫЙ КОМПОНЕНТ
            )}
         </div>
      </div>
   );
};

export default ProfileFriends;