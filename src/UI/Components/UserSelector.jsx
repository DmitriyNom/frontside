// src/UI/Components/UserSelector.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-modal';
import { searchTrainees, clearSearchResults } from '../../features/connectionsSlice';
import { ensureUserCompatibility } from '../../utils/userHelpers';
import styles from './UserSelector.module.css';

// Настройка модалки для доступности
if (typeof window !== 'undefined') {
   Modal.setAppElement('#root');
}

/**
 * Компонент для выбора подопечного из списка connected пользователей
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
   title = 'Выберите спортсмена',
   excludeIds = []
}) => {
   const dispatch = useDispatch();

   // Состояния
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedUser, setSelectedUser] = useState(null);
   const [offset, setOffset] = useState(0);
   const [hasMore, setHasMore] = useState(true);
   const [users, setUsers] = useState([]);
   const [filterTrainingLevel, setFilterTrainingLevel] = useState('');
   const [filterSpecialization, setFilterSpecialization] = useState('');

   // Refs для debounce
   const searchTimeoutRef = useRef(null);
   const isInitialMount = useRef(true);

   // Redux состояния
   const isLoading = useSelector(state => state.connections.isLoading.searchTrainees);
   const error = useSelector(state => state.connections.errors.searchTrainees);

   // Поиск пользователя по ID
   const findUserById = useCallback((id) => {
      return users.find(u => u.id === id) || null;
   }, [users]);

   // Сброс выбранного пользователя при открытии
   useEffect(() => {
      if (isOpen) {
         setSelectedUser(selectedUserId ? findUserById(selectedUserId) : null);
      }
   }, [isOpen, selectedUserId, findUserById]); // ИСПРАВЛЕНО: добавлена зависимость

   // Загрузка пользователей
   // const loadUsers = useCallback(async (search = searchQuery, level = filterTrainingLevel, spec = filterSpecialization, pageOffset = 0, append = false) => {
   //    try {
   //       const result = await dispatch(searchTrainees({
   //          query: search,
   //          limit: 10,
   //          offset: pageOffset
   //       })).unwrap();

   //       // Фильтруем только connected пользователей
   //       const connectedUsers = result.rows
   //          .map(user => ensureUserCompatibility(user))
   //          .filter(user => {
   //             const isConnected = user.connectionStatus === 'accepted' || user.connectionStatus === 'connected';
   //             return isConnected && !excludeIds.includes(user.id);
   //          });

   //       // Применяем фильтры (если нужна дополнительная фильтрация на клиенте)
   //       let filteredUsers = connectedUsers;
   //       if (level) {
   //          filteredUsers = filteredUsers.filter(u => u.training_level === level);
   //       }
   //       if (spec) {
   //          filteredUsers = filteredUsers.filter(u =>
   //             u.sport_specialization?.toLowerCase().includes(spec.toLowerCase())
   //          );
   //       }

   //       setUsers(prev => append ? [...prev, ...filteredUsers] : filteredUsers);
   //       setHasMore(result.rows.length === 10 && connectedUsers.length > 0);
   //       setOffset(pageOffset + (append ? 10 : 0));

   //    } catch (err) {
   //       console.error('Ошибка загрузки пользователей:', err);
   //    }
   // }, [dispatch, searchQuery, filterTrainingLevel, filterSpecialization, excludeIds]); // ИСПРАВЛЕНО: убраны лишние зависимости

   // Загрузка пользователей
   const loadUsers = useCallback(async (search = searchQuery, level = filterTrainingLevel, spec = filterSpecialization, pageOffset = 0, append = false) => {
      try {
         console.log('📡 1. Запрос к API:', { search, limit: 10, offset: pageOffset });

         const result = await dispatch(searchTrainees({
            query: search,
            limit: 10,
            offset: pageOffset
         })).unwrap();

         console.log('📦 2. Ответ от сервера:', result);
         console.log('📦 3. rows из ответа:', result.rows);

         // Проверим каждый пользователь перед фильтрацией
         result.rows.forEach((user, index) => {
            console.log(`👤 4. Пользователь ${index + 1}:`, {
               id: user.id,
               userName: user.userName,
               connectionStatus: user.connectionStatus,
               training_level: user.training_level,
               sport_specialization: user.sport_specialization
            });
         });

         // Фильтруем только connected пользователей
         const connectedUsers = result.rows
            .map(user => {
               const normalized = ensureUserCompatibility(user);
               console.log(`🔄 5. После нормализации пользователь ${user.userName}:`, {
                  id: normalized.id,
                  connectionStatus: normalized.connectionStatus,
                  training_level: normalized.training_level
               });
               return normalized;
            })
            .filter(user => {
               const isConnected = user.connectionStatus === 'accepted' || user.connectionStatus === 'connected';
               const notExcluded = !excludeIds.includes(user.id);

               console.log(`🔍 6. Фильтрация ${user.userName}:`, {
                  connectionStatus: user.connectionStatus,
                  isConnected,
                  excludeIds,
                  notExcluded,
                  passed: isConnected && notExcluded
               });

               return isConnected && notExcluded;
            });

         console.log('✅ 7. Отфильтрованные connectedUsers:', connectedUsers);
         console.log('✅ 8. Количество connectedUsers:', connectedUsers.length);

         // Применяем фильтры (если нужна дополнительная фильтрация на клиенте)
         let filteredUsers = connectedUsers;
         if (level) {
            console.log('🎯 9. Применяем фильтр по уровню:', level);
            filteredUsers = filteredUsers.filter(u => {
               const match = u.training_level === level;
               console.log(`   ${u.userName}: training_level=${u.training_level}, match=${match}`);
               return match;
            });
         }
         if (spec) {
            console.log('🎯 10. Применяем фильтр по специализации:', spec);
            filteredUsers = filteredUsers.filter(u => {
               const match = u.sport_specialization?.toLowerCase().includes(spec.toLowerCase());
               console.log(`   ${u.userName}: sport_specialization=${u.sport_specialization}, match=${match}`);
               return match;
            });
         }

         console.log('📊 11. Итоговые пользователи для отображения:', filteredUsers);

         setUsers(prev => {
            const newUsers = append ? [...prev, ...filteredUsers] : filteredUsers;
            console.log('📝 12. Обновляем state users:', newUsers);
            return newUsers;
         });

         setHasMore(result.rows.length === 10 && connectedUsers.length > 0);
         setOffset(pageOffset + (append ? 10 : 0));

      } catch (err) {
         console.error('❌ Ошибка загрузки пользователей:', err);
      }
   }, [dispatch, searchQuery, filterTrainingLevel, filterSpecialization, excludeIds]);

   // Debounced поиск
   const debouncedSearch = useCallback((query, level, spec) => {
      if (searchTimeoutRef.current) {
         clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
         setOffset(0);
         loadUsers(query, level, spec, 0, false);
      }, 500);
   }, [loadUsers]);

   // Обработчики изменений фильтров
   useEffect(() => {
      if (isOpen && !isInitialMount.current) {
         debouncedSearch(searchQuery, filterTrainingLevel, filterSpecialization);
      }
   }, [searchQuery, filterTrainingLevel, filterSpecialization, isOpen, debouncedSearch]);

   // Первоначальная загрузка при открытии
   useEffect(() => {
      if (isOpen && isInitialMount.current) {
         isInitialMount.current = false;
         setOffset(0);
         loadUsers('', '', '', 0, false);
      }

      return () => {
         if (!isOpen) {
            // Очистка при закрытии
            setSearchQuery('');
            setFilterTrainingLevel('');
            setFilterSpecialization('');
            setUsers([]);
            setOffset(0);
            setHasMore(true);
            isInitialMount.current = true;
            dispatch(clearSearchResults());
         }
      };
   }, [isOpen, dispatch, loadUsers]);

   // Загрузка еще
   const handleLoadMore = () => {
      if (hasMore && !isLoading) {
         loadUsers(searchQuery, filterTrainingLevel, filterSpecialization, offset, true);
      }
   };

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

   // Рендер фильтров
   const renderFilters = () => {
      return (
         <div className={styles.filters}>
            <select
               className={styles.filterSelect}
               value={filterTrainingLevel}
               onChange={(e) => setFilterTrainingLevel(e.target.value)}
            >
               <option value="">Все уровни</option>
               <option value="beginner">Новичок</option>
               <option value="amateur">Любитель</option>
               <option value="pro">Профи</option>
               <option value="semi_pro">Полупрофи</option>
            </select>

            <select
               className={styles.filterSelect}
               value={filterSpecialization}
               onChange={(e) => setFilterSpecialization(e.target.value)}
            >
               <option value="">Все виды спорта</option>
               <option value="hockey">Хоккей</option>
               <option value="fitness">Фитнес</option>
               <option value="football">Футбол</option>
               <option value="basketball">Баскетбол</option>
               <option value="swimming">Плавание</option>
               <option value="other">Другое</option>
            </select>
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
            {renderFilters()}
         </div>

         <div className={styles.usersList}>
            {isLoading && users.length === 0 ? (
               <div className={styles.loaderContainer}>
                  <div className={styles.spinner}></div>
                  <p>Загрузка...</p>
               </div>
            ) : error ? (
               <div className={styles.errorContainer}>
                  <p className={styles.error}>Ошибка: {error}</p>
                  <button
                     className={styles.retryButton}
                     onClick={() => loadUsers()}
                  >
                     Повторить
                  </button>
               </div>
            ) : users.length === 0 ? (
               <div className={styles.emptyContainer}>
                  <p>Нет доступных спортсменов</p>
               </div>
            ) : (
               <>
                  {users.map(renderUserCard)}

                  {hasMore && (
                     <div className={styles.loadMoreContainer}>
                        <button
                           className={styles.loadMoreButton}
                           onClick={handleLoadMore}
                           disabled={isLoading}
                        >
                           {isLoading ? 'Загрузка...' : 'Загрузить еще'}
                        </button>
                     </div>
                  )}
               </>
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