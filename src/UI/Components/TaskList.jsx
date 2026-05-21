// frontend/src/UI/Components/TaskList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TaskCard from './TaskCard';
import {
   fetchTasks,
   fetchTaskStats,
   setTasksRoleFilter,
   setTasksStatusFilter,
   setTasksSort,
   resetFilters,
   selectAllTasks,
   selectTasksLoading,
   selectTasksError,
   selectTasksFilters,
   selectTasksPagination,
   selectTaskStats,
   selectUnreadIncomingTaskIds,
   markTasksAsRead,
   deleteTask,
   updateTask
} from '../../features/taskSlice';
import styles from './TaskList.module.css';

const STATUS_FILTERS = [
   { value: null, label: 'Все', icon: '📋' },
   { value: 'active', label: 'Активные', icon: '🎯' },
   { value: 'completed', label: 'Выполненные', icon: '✅' },
   { value: 'archived', label: 'Архив', icon: '📦' }
];

const ROLE_FILTERS = [
   { value: 'assignee', label: 'Я выполняю', icon: '🏃' },
   { value: 'assigner', label: 'Я создал', icon: '✏️' }
];

// Конфиг для сортировки - 4 кнопки
const SORT_OPTIONS = [
   { value: 'created_at', label: 'По дате создания', icon: '🆕' },
   { value: 'due_date', label: 'По дедлайну', icon: '⏰' },
   { value: 'title', label: 'По названию', icon: '📝' },
   { value: 'priority', label: 'По приоритету', icon: '🎯' }
];

const TaskList = ({
   onViewTask,
   onCompleteTask,
   onEditTask,
   limit = 50,
   showRoleSwitch = true,
   showStats = true,
   emptyMessage = 'Заданий пока нет'
}) => {
   const dispatch = useDispatch();

   const tasks = useSelector(selectAllTasks);
   const loading = useSelector(selectTasksLoading);
   const error = useSelector(selectTasksError);
   const filters = useSelector(selectTasksFilters);
   const pagination = useSelector(selectTasksPagination);
   const stats = useSelector(selectTaskStats);
   const unreadTaskIds = useSelector(selectUnreadIncomingTaskIds);

   const [localStatus, setLocalStatus] = useState(filters.status);
   const [localRole, setLocalRole] = useState(filters.role);
   const [localSortBy, setLocalSortBy] = useState(filters.sortBy || 'created_at');
   const [localSortOrder, setLocalSortOrder] = useState(filters.sortOrder || 'desc');
   const [offset, setOffset] = useState(0);

   // Загрузка заданий с сортировкой
   const loadTasks = useCallback(async () => {
      await dispatch(fetchTasks({
         role: localRole,
         status: localStatus,
         sortBy: localSortBy,
         sortOrder: localSortOrder,
         limit,
         offset
      }));
   }, [dispatch, localRole, localStatus, localSortBy, localSortOrder, limit, offset]);

   // Загрузка статистики
   const loadStats = useCallback(() => {
      if (showStats) {
         dispatch(fetchTaskStats());
      }
   }, [dispatch, showStats]);

   useEffect(() => {
      loadTasks();
      loadStats();
   }, [loadTasks, loadStats]);

   // Обработчики фильтров
   const handleRoleChange = (role) => {
      setLocalRole(role);
      setOffset(0);
      dispatch(setTasksRoleFilter(role));
   };

   const handleStatusChange = (status) => {
      setLocalStatus(status);
      setOffset(0);
      dispatch(setTasksStatusFilter(status));
   };

   // Обработчик сортировки
   const handleSortChange = (sortBy) => {
      let newSortOrder = localSortOrder;

      if (localSortBy === sortBy) {
         // Если та же кнопка - меняем направление
         newSortOrder = localSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
         // Если другая кнопка - сбрасываем на desc (новые сверху)
         newSortOrder = 'desc';
      }

      setLocalSortBy(sortBy);
      setLocalSortOrder(newSortOrder);
      setOffset(0);
      dispatch(setTasksSort({ sortBy, sortOrder: newSortOrder }));
   };

   // Получение иконки для кнопки сортировки
   const getSortIcon = (sortBy) => {
      if (localSortBy !== sortBy) return '↕️';
      return localSortOrder === 'asc' ? '⬆️' : '⬇️';
   };

   const handleResetFilters = () => {
      setLocalRole('assignee');
      setLocalStatus(null);
      setLocalSortBy('created_at');
      setLocalSortOrder('desc');
      setOffset(0);
      dispatch(resetFilters());
   };

   // Пагинация
   const handleNextPage = () => {
      if (offset + limit < pagination.total) {
         setOffset(offset + limit);
      }
   };

   const handlePrevPage = () => {
      if (offset - limit >= 0) {
         setOffset(offset - limit);
      }
   };

   // Отметить задание как прочитанное при просмотре
   const handleViewTask = (task) => {
      if (unreadTaskIds.includes(task.id)) {
         dispatch(markTasksAsRead({ taskIds: [task.id] }));
      }
      onViewTask?.(task);
   };

   // Действия с заданием
   const handleDeleteTask = async (task) => {
      if (window.confirm(`Удалить задание "${task.exercise?.title || task.custom_title}"?`)) {
         await dispatch(deleteTask(task.id));
         loadTasks();
         loadStats();
         if (window.refreshTasksCount) window.refreshTasksCount();
         window.dispatchEvent(new CustomEvent('tasks-updated'));
      }
   };

   const handleArchiveTask = async (task) => {
      if (window.confirm(`Отправить задание "${task.exercise?.title || task.custom_title}" в архив?`)) {
         await dispatch(updateTask({
            taskId: task.id,
            data: { status: 'archived' }
         }));
         loadTasks();
         loadStats();
         if (window.refreshTasksCount) window.refreshTasksCount();
         window.dispatchEvent(new CustomEvent('tasks-updated'));
      }
   };

   // Рендер статистики
   const renderStats = () => {
      if (!showStats || !stats) return null;

      const total = (stats.active || 0) + (stats.completed || 0) + (stats.archived || 0);
      const completionRate = total > 0
         ? Math.round((stats.completed / total) * 100)
         : 0;

      return (
         <div className={styles.statsContainer}>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>🎯</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.active || 0}</span>
                  <span className={styles.statLabel}>Активных</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>✅</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.completed || 0}</span>
                  <span className={styles.statLabel}>Выполнено</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>📦</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats.archived || 0}</span>
                  <span className={styles.statLabel}>В архиве</span>
               </div>
            </div>
            <div className={styles.statCard}>
               <span className={styles.statIcon}>📊</span>
               <div className={styles.statInfo}>
                  <span className={styles.statValue}>{completionRate}%</span>
                  <span className={styles.statLabel}>Успеваемость</span>
               </div>
            </div>
         </div>
      );
   };

   // Рендер фильтров и сортировки
   const renderFilters = () => {
      return (
         <div className={styles.filtersContainer}>
            {/* Верхняя строка: переключатели ролей */}
            {showRoleSwitch && (
               <div className={styles.roleFilters}>
                  {ROLE_FILTERS.map(filter => (
                     <button
                        key={filter.value}
                        className={`${styles.roleButton} ${localRole === filter.value ? styles.active : ''}`}
                        onClick={() => handleRoleChange(filter.value)}
                     >
                        {filter.icon} {filter.label}
                     </button>
                  ))}
               </div>
            )}

            {/* Нижняя строка: фильтры статусов + сортировка */}
            <div className={styles.bottomBar}>
               <div className={styles.statusFilters}>
                  {STATUS_FILTERS.map(filter => (
                     <button
                        key={filter.value || 'all'}
                        className={`${styles.statusButton} ${localStatus === filter.value ? styles.active : ''}`}
                        onClick={() => handleStatusChange(filter.value)}
                     >
                        {filter.icon} {filter.label}
                     </button>
                  ))}

                  {(localStatus !== null || localRole !== 'assignee') && (
                     <button className={styles.resetButton} onClick={handleResetFilters}>
                        🔄 Сбросить
                     </button>
                  )}
               </div>

               {/* Блок сортировки - 4 кнопки */}
               <div className={styles.sortGroup}>
                  <span className={styles.sortLabel}>Сортировка:</span>
                  {SORT_OPTIONS.map(option => (
                     <button
                        key={option.value}
                        className={`${styles.sortButton} ${localSortBy === option.value ? styles.active : ''}`}
                        onClick={() => handleSortChange(option.value)}
                     >
                        {option.icon} {option.label} {getSortIcon(option.value)}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      );
   };

   // Рендер списка заданий
   const renderTaskList = () => {
      if (loading && tasks.length === 0) {
         return (
            <div className={styles.loadingContainer}>
               <div className={styles.spinner} />
               <p>Загрузка заданий...</p>
            </div>
         );
      }

      if (error) {
         return (
            <div className={styles.errorContainer}>
               <span className={styles.errorIcon}>⚠️</span>
               <p>{error}</p>
               <button onClick={loadTasks} className={styles.retryButton}>
                  Повторить
               </button>
            </div>
         );
      }

      if (tasks.length === 0) {
         return (
            <div className={styles.emptyContainer}>
               <span className={styles.emptyIcon}>📭</span>
               <p>{emptyMessage}</p>
               {localStatus === 'active' && localRole === 'assignee' && (
                  <p className={styles.emptyHint}>
                     Тренер ещё не назначил вам задания
                  </p>
               )}
               {localStatus === 'active' && localRole === 'assigner' && (
                  <p className={styles.emptyHint}>
                     Создайте задание для своих спортсменов
                  </p>
               )}
            </div>
         );
      }

      return (
         <div className={styles.taskList}>
            {tasks.map((task, index) => (
               <TaskCard
                  key={task.id}
                  task={task}
                  onView={handleViewTask}
                  onComplete={onCompleteTask}
                  onEdit={onEditTask}
                  onDelete={handleDeleteTask}
                  onArchive={handleArchiveTask}
                  isAssignee={localRole === 'assignee'}
                  isAssigner={localRole === 'assigner'}
                  isUnread={unreadTaskIds.includes(task.id)}
                  rowIndex={index}
               />
            ))}
         </div>
      );
   };

   // Рендер пагинации
   const renderPagination = () => {
      if (pagination.total <= limit) return null;

      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(pagination.total / limit);

      return (
         <div className={styles.pagination}>
            <button
               onClick={handlePrevPage}
               disabled={offset === 0}
               className={styles.pageButton}
            >
               ◀ Назад
            </button>
            <span className={styles.pageInfo}>
               Страница {currentPage} из {totalPages}
            </span>
            <button
               onClick={handleNextPage}
               disabled={offset + limit >= pagination.total}
               className={styles.pageButton}
            >
               Вперед ▶
            </button>
         </div>
      );
   };

   return (
      <div className={styles.container}>
         {renderStats()}
         {renderFilters()}
         {renderTaskList()}
         {renderPagination()}
      </div>
   );
};

export default TaskList;