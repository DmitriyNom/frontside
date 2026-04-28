// src/UI/Components/UserSelector.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-modal';
import { fetchFriends, selectFriends, selectFriendsLoading } from '../../features/friendsSlice';
import { ensureUserCompatibility } from '../../utils/userHelpers';
import styles from './UserSelector.module.css';

// Настройка модалки для доступности
if (typeof window !== 'undefined') {
   Modal.setAppElement('#root');
}

/**
 * Компонент для выбора друга из списка друзей
 * @param {Object} props
 * @param {boolean} props.isOpen - открыто ли модальное окно
 * @param {Function} props.onClose - функция закрытия
 * @param {Function} props.onSelect - функция выбора пользователя (принимает выбранного пользователя)
 * @param {number} props.selectedUserId - ID предварительно выбранного пользователя
 * @param {string} props.title - заголовок модального окна
 * @param {number[]} props.excludeIds - массив ID пользователей для исключения
 */
const UserSelector = ({
   isOpen,
   onClose,
   onSelect,
   selectedUserId = null,
   title = 'Выберите пользователя',
   excludeIds = []
}) => {
   const dispatch = useDispatch();

   // Состояния
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedUser, setSelectedUser] = useState(null);
   const [filteredUsers, setFilteredUsers] = useState([]);

   // Redux состояния
   const allFriends = useSelector(selectFriends);
   const isLoading = useSelector(selectFriendsLoading);

   // Загружаем друзей при открытии
   useEffect(() => {
      if (isOpen) {
         dispatch(fetchFriends({ limit: 100 }));
      }
   }, [isOpen, dispatch]);

   // Фильтрация пользователей
   useEffect(() => {
      if (!allFriends || allFriends.length === 0) {
         setFilteredUsers([]);
         return;
      }

      // Нормализуем и фильтруем друзей
      let users = allFriends
         .map(user => ensureUserCompatibility(user))
         .filter(user => !excludeIds.includes(user.id));

      // Поиск по имени
      if (searchQuery.trim()) {
         const query = searchQuery.toLowerCase();
         users = users.filter(user =>
            user.userName?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
         );
      }

      setFilteredUsers(users);
   }, [allFriends, searchQuery, excludeIds]);

   // Сброс выбранного пользователя при открытии
   useEffect(() => {
      if (isOpen) {
         const found = filteredUsers.find(u => u.id === selectedUserId);
         setSelectedUser(found || null);
      }
   }, [isOpen, selectedUserId, filteredUsers]);

   // Выбор пользователя
   const handleSelectUser = (user) => {
      setSelectedUser(user);
   };

   // Подтверждение выбора
   const handleConfirm = () => {
      if (selectedUser) {
         onSelect(selectedUser);
         onClose();
      }
   };

   // Отмена
   const handleCancel = () => {
      setSelectedUser(null);
      onClose();
   };

   // Рендер карточки пользователя
   const renderUserCard = (user) => {
      const isSelected = selectedUser?.id === user.id;
      const displayName = user.userName || 'Без имени';
      const avatarUrl = user.userAvatar || '/default-avatar.png';
      const level = user.training_level || 'Не указан';
      const specialization = user.sport_specialization || 'Не указана';

      return (
         <div
            key={user.id}
            className={`${styles.userCard} ${isSelected ? styles.selected : ''}`}
            onClick={() => handleSelectUser(user)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSelectUser(user)}
         >
            <div className={styles.avatarContainer}>
               <img src={avatarUrl} alt={displayName} className={styles.avatar} />
            </div>
            <div className={styles.userInfo}>
               <div className={styles.userName}>{displayName}</div>
               <div className={styles.userDetails}>
                  <span className={styles.detailItem}>Уровень: {level}</span>
                  <span className={styles.detailItem}>Спорт: {specialization}</span>
               </div>
            </div>
            {isSelected && (
               <div className={styles.selectedBadge}>✓</div>
            )}
         </div>
      );
   };

   return (
      <Modal
         isOpen={isOpen}
         onRequestClose={handleCancel}
         className={styles.modal}
         overlayClassName={styles.overlay}
         contentLabel={title}
      >
         <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
               className={styles.closeButton}
               onClick={handleCancel}
               aria-label="Закрыть"
            >
               ×
            </button>
         </div>

         <div className={styles.searchSection}>
            <input
               type="text"
               className={styles.searchInput}
               placeholder="Поиск по имени..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               autoFocus
            />
         </div>

         <div className={styles.usersList}>
            {isLoading.friends && filteredUsers.length === 0 ? (
               <div className={styles.loaderContainer}>
                  <div className={styles.spinner}></div>
                  <p>Загрузка...</p>
               </div>
            ) : filteredUsers.length === 0 ? (
               <div className={styles.emptyContainer}>
                  <p>Нет доступных пользователей</p>
                  {searchQuery && (
                     <button
                        className={styles.clearButton}
                        onClick={() => setSearchQuery('')}
                     >
                        Очистить поиск
                     </button>
                  )}
               </div>
            ) : (
               filteredUsers.map(renderUserCard)
            )}
         </div>

         <div className={styles.footer}>
            <button
               className={styles.cancelButton}
               onClick={handleCancel}
            >
               Отмена
            </button>
            <button
               className={styles.confirmButton}
               onClick={handleConfirm}
               disabled={!selectedUser}
            >
               Выбрать
            </button>
         </div>
      </Modal>
   );
};

UserSelector.propTypes = {
   isOpen: PropTypes.bool.isRequired,
   onClose: PropTypes.func.isRequired,
   onSelect: PropTypes.func.isRequired,
   selectedUserId: PropTypes.number,
   title: PropTypes.string,
   excludeIds: PropTypes.arrayOf(PropTypes.number)
};

export default UserSelector;