// frontend/src/UI/Pages/TasksPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TaskList from '../Components/TaskList';
import TaskCreateModal from '../Components/TaskCreateModal';
import TaskDetailModal from '../Components/TaskDetailModal';
import TaskCompleteModal from '../Components/TaskCompleteModal';
import { fetchTaskStats, selectTaskStats } from '../../features/taskSlice';
import { selectUser } from '../../features/authSlice';
import styles from './TasksPage.module.css';

const TasksPage = () => {
   const dispatch = useDispatch();
   const stats = useSelector(selectTaskStats);
   const currentUser = useSelector(selectUser);

   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [selectedTask, setSelectedTask] = useState(null);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

   // Загрузка статистики при монтировании
   useEffect(() => {
      dispatch(fetchTaskStats());
   }, [dispatch]);

   // Обработчики для TaskList
   const handleViewTask = useCallback((task) => {
      setSelectedTask(task);
      setIsDetailModalOpen(true);
   }, []);

   const handleCompleteTask = useCallback((task) => {
      setSelectedTask(task);
      setIsCompleteModalOpen(true);
   }, []);

   const handleEditTask = useCallback((task) => {
      setSelectedTask(task);
      setIsDetailModalOpen(true);
   }, []);

   // Обработчики для модалок
   const handleTaskCreated = useCallback(() => {
      setIsCreateModalOpen(false);
      dispatch(fetchTaskStats());
   }, [dispatch]);

   const handleTaskUpdated = useCallback(() => {
      dispatch(fetchTaskStats());
   }, [dispatch]);

   const handleTaskCompleted = useCallback(() => {
      setIsCompleteModalOpen(false);
      setSelectedTask(null);
      dispatch(fetchTaskStats());
   }, [dispatch]);

   // Обработчик для кнопки "Выполнить" из модалки просмотра
   useEffect(() => {
      window.completeTaskCallback = (task) => {
         setSelectedTask(task);
         setIsCompleteModalOpen(true);
      };

      return () => {
         delete window.completeTaskCallback;
      };
   }, []);

   // Глобальные обработчики для виджета (TaskWidget)
   useEffect(() => {
      const handleTaskView = (e) => {
         setSelectedTask(e.detail);
         setIsDetailModalOpen(true);
      };

      const handleTaskComplete = (e) => {
         setSelectedTask(e.detail);
         setIsCompleteModalOpen(true);
      };

      window.addEventListener('task-view', handleTaskView);
      window.addEventListener('task-complete', handleTaskComplete);

      return () => {
         window.removeEventListener('task-view', handleTaskView);
         window.removeEventListener('task-complete', handleTaskComplete);
      };
   }, []);

   // Форматирование прогресса
   const getCompletionRate = () => {
      const total = (stats?.active || 0) + (stats?.completed || 0) + (stats?.archived || 0);
      if (total === 0) return 0;
      return Math.round(((stats?.completed || 0) / total) * 100);
   };

   return (
      <div className={styles.container}>
         {/* Шапка страницы */}
         <div className={styles.header}>
            <div className={styles.headerLeft}>
               <h1 className={styles.title}>📋 Задания</h1>
               <p className={styles.subtitle}>Управление тренировочными заданиями</p>
            </div>
            <button
               className={styles.createButton}
               onClick={() => setIsCreateModalOpen(true)}
            >
               ➕ Создать задание
            </button>
         </div>

         {/* Карточки статистики */}
         <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.activeCard}`}>
               <div className={styles.statIcon}>🎯</div>
               <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats?.active || 0}</div>
                  <div className={styles.statLabel}>Активных</div>
               </div>
            </div>
            <div className={`${styles.statCard} ${styles.completedCard}`}>
               <div className={styles.statIcon}>✅</div>
               <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats?.completed || 0}</div>
                  <div className={styles.statLabel}>Выполнено</div>
               </div>
            </div>
            <div className={`${styles.statCard} ${styles.archivedCard}`}>
               <div className={styles.statIcon}>📦</div>
               <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats?.archived || 0}</div>
                  <div className={styles.statLabel}>В архиве</div>
               </div>
            </div>
            <div className={`${styles.statCard} ${styles.rateCard}`}>
               <div className={styles.statIcon}>📊</div>
               <div className={styles.statInfo}>
                  <div className={styles.statValue}>{getCompletionRate()}%</div>
                  <div className={styles.statLabel}>Успеваемость</div>
               </div>
            </div>
         </div>

         {/* Список заданий */}
         <div className={styles.listContainer}>
            <TaskList
               onViewTask={handleViewTask}
               onCompleteTask={handleCompleteTask}
               onEditTask={handleEditTask}
               limit={20}
               showRoleSwitch={true}
               showStats={false}
               emptyMessage="У вас пока нет заданий"
            />
         </div>

         {/* Модалки */}
         <TaskCreateModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleTaskCreated}
         />

         <TaskDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
               setIsDetailModalOpen(false);
               setSelectedTask(null);
            }}
            taskId={selectedTask?.id}
            onTaskUpdated={handleTaskUpdated}
            currentUserId={currentUser?.id}
         />

         <TaskCompleteModal
            isOpen={isCompleteModalOpen}
            onClose={() => {
               setIsCompleteModalOpen(false);
               setSelectedTask(null);
            }}
            task={selectedTask}
            onSuccess={handleTaskCompleted}
         />
      </div>
   );
};

export default TasksPage;