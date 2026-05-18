// frontend/src/UI/Components/TaskCard.jsx
import React, { useState } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './TaskCard.module.css';

// Конфиг приоритета с текстом и CSS классом
const PRIORITY_CONFIG = {
   1: { icon: '🔵', label: 'Низкий', class: 'priorityLow' },
   2: { icon: '🟡', label: 'Средний', class: 'priorityMedium' },
   3: { icon: '🔴', label: 'Высокий', class: 'priorityHigh' }
};

const STATUS_CONFIG = {
   active: { label: 'Активно', className: 'statusActive', icon: '🎯' },
   completed: { label: 'Выполнено', className: 'statusCompleted', icon: '✅' },
   archived: { label: 'В архиве', className: 'statusArchived', icon: '📦' }
};

const TaskCard = ({
   task,
   onView,
   onComplete,
   onEdit,
   onDelete,
   onArchive,
   isAssignee = true,
   isAssigner = false,
   compact = false,
   isUnread = false      // 👈 НОВЫЙ ПРОПС
}) => {

   const [isExpanded, setIsExpanded] = useState(false);

   if (!task) return null;

   const {
      status,
      priority,
      due_date,
      exercise,
      custom_title,
      custom_description,
      metrics,
      completion_percentage,
      assignee,
      assigner,
      created_at,
   } = task;

   const taskTitle = exercise?.title || custom_title || 'Без названия';
   const taskDescription = exercise?.description || custom_description || '';

   // Форматирование метрик
   const formatMetrics = (metrics) => {
      if (!metrics) return '';
      switch (metrics.type) {
         case 'sets_reps':
            return `${metrics.sets}×${metrics.reps} повторов${metrics.weight_kg ? `, ${metrics.weight_kg}кг` : ''}`;
         case 'duration':
            const minutes = Math.floor((metrics.duration_seconds || 0) / 60);
            return `${minutes} минут`;
         case 'weight':
            return `${metrics.weight_kg}кг, ${metrics.sets}×${metrics.reps}`;
         case 'interval':
            return `${metrics.intervals} интервалов по ${metrics.work_seconds}с`;
         default:
            return '';
      }
   };

   // Форматирование даты
   const formatDueDate = (date) => {
      if (!date) return null;
      const dueDate = new Date(date);
      const isOverdue = isPast(dueDate) && status === 'active';

      return {
         formatted: format(dueDate, 'dd MMM yyyy', { locale: ru }),
         fromNow: formatDistanceToNow(dueDate, { locale: ru, addSuffix: true }),
         isOverdue
      };
   };

   const dueDateInfo = due_date ? formatDueDate(due_date) : null;
   const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;
   const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[1];

   // Обработчики
   const handleView = () => onView?.(task);
   const handleComplete = () => onComplete?.(task);
   const handleEdit = () => onEdit?.(task);
   const handleDelete = () => onDelete?.(task);
   const handleArchive = () => onArchive?.(task);

   // Компактный режим (для виджета)
   if (compact) {
      return (
         <div className={`${styles.card} ${styles.compact} ${styles[statusConfig.className]}`}>
            <div className={styles.compactHeader}>
               <span className={`${styles.priorityBadge} ${styles[priorityConfig.class]}`}>
                  {priorityConfig.icon} {priorityConfig.label}
               </span>
               <span className={styles.compactTitle}>{taskTitle}</span>
               <span className={styles.statusBadgeSmall}>
                  {statusConfig.icon} {statusConfig.label}
               </span>
            </div>
            {due_date && status === 'active' && (
               <div className={`${styles.dueDateCompact} ${dueDateInfo?.isOverdue ? styles.overdue : ''}`}>
                  📅 {dueDateInfo.fromNow}
               </div>
            )}
            {completion_percentage > 0 && status === 'completed' && (
               <div className={styles.completionCompact}>🏆 {completion_percentage}%</div>
            )}
         </div>
      );
   }

   return (
      <div className={`${styles.card} ${styles[statusConfig.className]} ${isUnread ? styles.unreadCard : ''}`}>
         {/* 👆 ДОБАВЛЕН КЛАСС unreadCard */}

         {/* Шапка карточки */}
         <div className={styles.header}>
            <div className={styles.leftSection}>
               <span className={`${styles.priorityBadge} ${styles[priorityConfig.class]}`}>
                  {priorityConfig.icon} {priorityConfig.label}
               </span>
               <span className={styles.statusBadge}>
                  {statusConfig.icon} {statusConfig.label}
               </span>
               {completion_percentage > 0 && status === 'completed' && (
                  <span className={styles.completionBadge}>
                     🏆 {completion_percentage}%
                  </span>
               )}
            </div>
            <div className={styles.rightSection}>
               {due_date && status === 'active' && (
                  <div className={`${styles.dueDate} ${dueDateInfo?.isOverdue ? styles.overdue : ''}`}>
                     ⏰ {dueDateInfo.formatted} ({dueDateInfo.fromNow})
                  </div>
               )}
            </div>
         </div>

         {/* Контент */}
         <div className={styles.content} onClick={() => setIsExpanded(!isExpanded)}>
            <h3 className={styles.title}>{taskTitle}</h3>

            {taskDescription && (
               <p className={`${styles.description} ${isExpanded ? styles.expanded : ''}`}>
                  {taskDescription}
               </p>
            )}

            <div className={styles.metrics}>
               🎯 {formatMetrics(metrics)}
            </div>

            <div className={styles.meta}>
               {assigner && (
                  <span className={styles.metaItem}>
                     👤 Создал: {assigner.userName}
                  </span>
               )}
               {assignee && isAssigner && (
                  <span className={styles.metaItem}>
                     🏃 Исполнитель: {assignee.userName}
                  </span>
               )}
               {created_at && (
                  <span className={styles.metaItem}>
                     📅 Создано: {format(new Date(created_at), 'dd MMM yyyy', { locale: ru })}
                  </span>
               )}
            </div>

            {status === 'active' && completion_percentage > 0 && (
               <div className={styles.progressContainer}>
                  <div
                     className={styles.progressBar}
                     style={{ width: `${completion_percentage}%` }}
                  />
                  <span className={styles.progressText}>{completion_percentage}%</span>
               </div>
            )}
         </div>

         {/* Кнопки действий */}
         <div className={styles.actions}>
            <button className={styles.btnView} onClick={handleView}>
               📖 Подробнее
            </button>

            {status === 'active' && isAssignee && (
               <button className={styles.btnComplete} onClick={handleComplete}>
                  ✅ Выполнить
               </button>
            )}

            {status === 'active' && isAssigner && (
               <button className={styles.btnEdit} onClick={handleEdit}>
                  ✏️ Редактировать
               </button>
            )}

            {status === 'active' && isAssigner && (
               <button className={styles.btnArchive} onClick={handleArchive}>
                  📦 В архив
               </button>
            )}

            {isAssigner && (
               <button className={styles.btnDelete} onClick={handleDelete}>
                  🗑️ Удалить
               </button>
            )}
         </div>
      </div>
   );
};

export default TaskCard;