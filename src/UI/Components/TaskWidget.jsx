// frontend/src/UI/Components/TaskWidget.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import {
   fetchActiveTasks,
   fetchExpiringTasks,
   selectActiveTasks,
   selectExpiringTasks,
   selectTasksLoading
} from '../../features/taskSlice';
import styles from './TaskWidget.module.css';

const TaskWidget = ({ limit = 5, showViewAll = true, compact = true }) => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const activeTasks = useSelector(selectActiveTasks);
   const expiringTasks = useSelector(selectExpiringTasks);
   const loading = useSelector(selectTasksLoading);

   useEffect(() => {
      dispatch(fetchActiveTasks(limit));
      dispatch(fetchExpiringTasks(3));
   }, [dispatch, limit]);

   const handleViewAll = () => {
      navigate('/tasks');
   };

   const handleViewTask = (task) => {
      // Открыть модалку просмотра (можно через глобальное событие)
      window.dispatchEvent(new CustomEvent('task-view', { detail: task }));
   };

   const handleCompleteTask = (task) => {
      window.dispatchEvent(new CustomEvent('task-complete', { detail: task }));
   };

   if (loading && activeTasks.length === 0) {
      return (
         <div className={styles.widget}>
            <div className={styles.header}>
               <h3>📋 Активные задания</h3>
            </div>
            <div className={styles.loading}>
               <div className={styles.spinner} />
               <span>Загрузка...</span>
            </div>
         </div>
      );
   }

   const hasExpiring = expiringTasks.length > 0;
   const displayTasks = activeTasks.slice(0, limit);

   return (
      <div className={styles.widget}>
         <div className={styles.header}>
            <div className={styles.headerLeft}>
               <span className={styles.icon}>📋</span>
               <h3>Активные задания</h3>
               {hasExpiring && (
                  <span className={styles.expiringBadge}>
                     ⚠️ {expiringTasks.length} истекают
                  </span>
               )}
            </div>
            {showViewAll && activeTasks.length > 0 && (
               <button onClick={handleViewAll} className={styles.viewAllBtn}>
                  Все задания →
               </button>
            )}
         </div>

         {displayTasks.length === 0 ? (
            <div className={styles.empty}>
               <span className={styles.emptyIcon}>🎯</span>
               <p>Нет активных заданий</p>
               <span className={styles.emptyHint}>
                  Тренер ещё не назначил вам задания
               </span>
            </div>
         ) : (
            <div className={styles.taskList}>
               {displayTasks.map(task => (
                  <TaskCard
                     key={task.id}
                     task={task}
                     onView={handleViewTask}
                     onComplete={handleCompleteTask}
                     compact={compact}
                     isAssignee={true}
                  />
               ))}
            </div>
         )}

         {hasExpiring && expiringTasks.length > 0 && (
            <div className={styles.expiringSection}>
               <div className={styles.expiringHeader}>
                  <span>⚠️ Истекают скоро</span>
               </div>
               <div className={styles.expiringList}>
                  {expiringTasks.slice(0, 3).map(task => (
                     <div key={task.id} className={styles.expiringItem}>
                        <span className={styles.expiringTitle}>
                           {task.exercise?.title || task.custom_title}
                        </span>
                        <span className={styles.expiringDate}>
                           {task.due_date && new Date(task.due_date).toLocaleDateString()}
                        </span>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
};

export default TaskWidget;