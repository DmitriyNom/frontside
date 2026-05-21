// frontend/src/UI/Components/TaskCard.jsx
import React from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './TaskCard.module.css';

// Конфиг приоритета с текстом и CSS классом
const PRIORITY_CONFIG = {
   1: { icon: '🔵', label: 'Низкий приоритет', class: 'priorityLow' },
   2: { icon: '🟡', label: 'Средний приоритет', class: 'priorityMedium' },
   3: { icon: '🔴', label: 'Высокий приоритет', class: 'priorityHigh' }
};

const STATUS_CONFIG = {
   active: { label: 'Активно', className: 'statusActive', icon: '🎯' },
   completed: { label: 'Выполнено', className: 'statusCompleted', icon: '✅' },
   archived: { label: 'В архиве', className: 'statusArchived', icon: '📦' }
};

// Конфиг ленточек - ТОЛЬКО ИКОНКИ (минимализм)
const RIBBON_CONFIG = {
   critical: { icon: '🚨', class: 'ribbonCritical' },
   overdue: { icon: '⏰', class: 'ribbonOverdue' },
   high: { icon: '🔥', class: 'ribbonHigh' },
   soon: { icon: '⏳', class: 'ribbonSoon' },
   medium: { icon: '💧', class: 'ribbonMedium' },
   low: { icon: '❄️', class: 'ribbonLow' }
};

// Функция определения типа ленточки на основе данных задания
const getRibbonType = (task) => {
   const { priority, due_date, status } = task;

   // Только для активных заданий показываем ленточки
   if (status !== 'active') return null;

   const dueDate = due_date ? new Date(due_date) : null;
   const today = new Date();
   today.setHours(0, 0, 0, 0);

   const isOverdue = dueDate && dueDate < today;
   const daysUntilDue = dueDate ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
   const isSoonDue = daysUntilDue !== null && daysUntilDue <= 2 && daysUntilDue >= 0;

   // Приоритет критичности (от самого важного к менее важному)
   // 1. Просрочка + высокий приоритет — критично
   if (isOverdue && priority === 3) {
      return 'critical';
   }
   // 2. Просто просрочка
   if (isOverdue) {
      return 'overdue';
   }
   // 3. Высокий приоритет
   if (priority === 3) {
      return 'high';
   }
   // 4. Скоро дедлайн (2 дня или меньше)
   if (isSoonDue) {
      return 'soon';
   }
   // 5. Средний приоритет
   if (priority === 2) {
      return 'medium';
   }
   // 6. Низкий приоритет
   if (priority === 1) {
      return 'low';
   }

   return null;
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
   isUnread = false,
   rowIndex = 0
}) => {

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

   // Определяем четность строки для шахматного фона
   const isEvenRow = rowIndex % 2 === 0;

   // Определяем тип ленточки
   const ribbonType = getRibbonType(task);
   const ribbonConfig = ribbonType ? RIBBON_CONFIG[ribbonType] : null;

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

   // Компактный режим (для виджета) с ленточкой
   if (compact) {
      return (
         <div className={`${styles.card} ${styles.compact} ${styles[statusConfig.className]} ${styles[priorityConfig.class]} ${isEvenRow ? styles.evenRow : styles.oddRow}`}>
            {/* Ленточка-иконка в компактном режиме */}
            {ribbonConfig && (
               <div className={`${styles.ribbon} ${styles.ribbonCompact} ${styles[ribbonConfig.class]}`}>
                  {ribbonConfig.icon}
               </div>
            )}
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
      <div className={`${styles.card} ${styles[statusConfig.className]} ${styles[priorityConfig.class]} ${isUnread ? styles.unreadCard : ''} ${isEvenRow ? styles.evenRow : styles.oddRow}`}>
         {/* Ленточка-иконка срочности (основной режим) */}
         {ribbonConfig && (
            <div className={`${styles.ribbon} ${styles[ribbonConfig.class]}`}>
               {ribbonConfig.icon}
            </div>
         )}

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

         {/* Контент - убран onClick, карточка больше не расширяется */}
         <div className={styles.content}>
            <h3 className={styles.title}>{taskTitle}</h3>

            {taskDescription && (
               <p className={styles.description}>
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