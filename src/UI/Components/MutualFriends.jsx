import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
   fetchMutualFriends,
   selectMutualFriends,
   selectFriendsLoading
} from '../../features/friendsSlice';
import styles from './MutualFriends.module.css';

const MutualFriends = ({ userId }) => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const mutualFriends = useSelector((state) => selectMutualFriends(state)[userId] || []);
   const loading = useSelector(selectFriendsLoading);

   useEffect(() => {
      if (userId) {
         dispatch(fetchMutualFriends(userId));
      }
   }, [dispatch, userId]);

   if (loading.friends) {
      return (
         <div className={styles.loading}>
            <div className={styles.spinner}></div>
         </div>
      );
   }

   if (!mutualFriends || mutualFriends.length === 0) {
      return null;
   }

   return (
      <div className={styles.mutualFriends}>
         <h3>Общие друзья ({mutualFriends.length})</h3>
         <div className={styles.friendsList}>
            {mutualFriends.slice(0, 6).map((friend) => (
               <div
                  key={friend.id}
                  className={styles.friendItem}
                  onClick={() => navigate(`/user/${friend.id}`)}
               >
                  <div className={styles.friendAvatar}>
                     {friend.userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className={styles.friendName}>{friend.userName}</span>
               </div>
            ))}
            {mutualFriends.length > 6 && (
               <div className={styles.moreFriends}>
                  +{mutualFriends.length - 6}
               </div>
            )}
         </div>
      </div>
   );
};

export default MutualFriends;