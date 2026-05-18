// frontend/src/UI/Components/TaskDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { ru } from 'date-fns/locale';
import {
   fetchTaskById,
   updateTask,
   deleteTask,
   saveTaskToLibrary,
   selectCurrentTask,
   selectUpdateTaskLoading,
   selectCompleteTaskLoading,
   selectDeleteTaskLoading
} from '../../features/taskSlice';
import styles from './TaskDetailModal.module.css';

const PRIORITY_CONFIG = {
   1: { label: 'Низкий', icon: '🔵', class: 'priorityLow' },
   2: { label: 'Средний', icon: '🟡', class: 'priorityMedium' },
   3: { label: 'Высокий', icon: '🔴', class: 'priorityHigh' }
};

const STATUS_CONFIG = {
   active: { label: 'Активное', icon: '🎯', class: 'statusActive' },
   completed: { label: 'Выполнено', icon: '✅', class: 'statusCompleted' },
   archived: { label: 'В архиве', icon: '📦', class: 'statusArchived' }
};

const METRIC_TYPES = [
   { value: 'sets_reps', label: 'Подходы и повторения', icon: '🏋️' },
   { value: 'duration', label: 'Длительность', icon: '⏱️' },
   { value: 'weight', label: 'Вес', icon: '🏋️‍♂️' },
   { value: 'interval', label: 'Интервалы', icon: '🔄' }
];

const PRIORITY_OPTIONS = [
   { value: 1, label: 'Низкий', icon: '🔵' },
   { value: 2, label: 'Средний', icon: '🟡' },
   { value: 3, label: 'Высокий', icon: '🔴' }
];

const TaskDetailModal = ({ isOpen, onClose, taskId, onTaskUpdated, currentUserId }) => {
   const dispatch = useDispatch();
   const task = useSelector(selectCurrentTask);
   const isUpdating = useSelector(selectUpdateTaskLoading);
   const isCompleting = useSelector(selectCompleteTaskLoading);
   const isDeleting = useSelector(selectDeleteTaskLoading);

   const [isEditing, setIsEditing] = useState(false);
   const [formData, setFormData] = useState({});
   const [errors, setErrors] = useState({});
   const [showConfirmDelete, setShowConfirmDelete] = useState(false);
   const [showConfirmArchive, setShowConfirmArchive] = useState(false);
   const [hasChanges, setHasChanges] = useState(false);

   // Определяем права
   const isAssignee = task?.user_id === currentUserId;
   const isAssigner = task?.assigned_by_user_id === currentUserId;
   const isAdmin = false; // TODO: взять из auth slice

   const canEdit = (isAssigner || isAdmin) && task?.status === 'active';
   const canComplete = isAssignee && task?.status === 'active';
   const canArchive = (isAssigner || isAdmin) && task?.status === 'active';
   const canSaveToLibrary = isAssigner && !task?.exercise_id && task?.status !== 'archived';

   // Загрузка задания при открытии
   useEffect(() => {
      if (isOpen && taskId) {
         dispatch(fetchTaskById(taskId));
      }
   }, [isOpen, taskId, dispatch]);

   // Сброс состояния при закрытии
   useEffect(() => {
      if (!isOpen) {
         setIsEditing(false);
         setShowConfirmDelete(false);
         setShowConfirmArchive(false);
         setHasChanges(false);
         setErrors({});
      }
   }, [isOpen]);

   // Инициализация формы при открытии редактирования
   useEffect(() => {
      if (task && isEditing) {
         // Преобразуем метрики из формата БД в формат формы
         let metrics = { ...task.metrics };

         // Преобразуем duration_seconds в минуты для формы
         if (metrics.type === 'duration' && metrics.duration_seconds) {
            metrics.duration_minutes = Math.floor(metrics.duration_seconds / 60);
         }

         setFormData({
            custom_title: task.custom_title || task.exercise?.title || '',
            custom_description: task.custom_description || task.exercise?.description || '',
            priority: task.priority,
            due_date: task.due_date ? task.due_date.slice(0, 16) : '',
            points_earned: task.points_earned || 0,
            metric_type: task.metrics?.type || 'sets_reps',
            metrics: metrics
         });
         setHasChanges(false);
         setErrors({});
      }
   }, [task, isEditing]);

   // Отслеживание изменений в форме
   useEffect(() => {
      if (isEditing && task) {
         const hasAnyChanges =
            formData.custom_title !== (task.custom_title || task.exercise?.title || '') ||
            formData.custom_description !== (task.custom_description || task.exercise?.description || '') ||
            formData.priority !== task.priority ||
            formData.due_date !== (task.due_date ? task.due_date.slice(0, 16) : '') ||
            formData.points_earned !== (task.points_earned || 0);
         setHasChanges(hasAnyChanges);
      }
   }, [formData, task, isEditing]);

   // Обновление метрик при изменении типа
   const handleMetricTypeChange = (type) => {
      let newMetrics = { type };
      switch (type) {
         case 'sets_reps':
            newMetrics = { type, sets: 3, reps: 10, weight_kg: null };
            break;
         case 'duration':
            newMetrics = { type, duration_seconds: 1800, duration_minutes: 30 };
            break;
         case 'weight':
            newMetrics = { type, weight_kg: 50, sets: 5, reps: 5 };
            break;
         case 'interval':
            newMetrics = { type, intervals: 5, work_seconds: 30, rest_seconds: 15 };
            break;
         default:
            newMetrics = { type };
            break;
      }
      setFormData(prev => ({ ...prev, metric_type: type, metrics: newMetrics }));
      setHasChanges(true);
   };

   // Обновление полей метрик
   const updateMetricField = (field, value) => {
      setFormData(prev => ({
         ...prev,
         metrics: { ...prev.metrics, [field]: value }
      }));
      setHasChanges(true);
   };

   // Валидация формы
   const validateForm = () => {
      const newErrors = {};

      if (!formData.custom_title?.trim()) {
         newErrors.custom_title = 'Введите название задания';
      }

      const { metrics } = formData;
      switch (metrics.type) {
         case 'sets_reps':
            if (!metrics.sets || metrics.sets < 1) newErrors.sets = 'Количество подходов должно быть больше 0';
            if (!metrics.reps || metrics.reps < 1) newErrors.reps = 'Количество повторений должно быть больше 0';
            break;
         case 'duration':
            if (!metrics.duration_minutes || metrics.duration_minutes < 1) {
               newErrors.duration = 'Длительность должна быть больше 0';
            }
            break;
         case 'weight':
            if (!metrics.weight_kg || metrics.weight_kg < 1) newErrors.weight = 'Вес должен быть больше 0';
            if (!metrics.sets || metrics.sets < 1) newErrors.sets = 'Количество подходов должно быть больше 0';
            if (!metrics.reps || metrics.reps < 1) newErrors.reps = 'Количество повторений должно быть больше 0';
            break;
         case 'interval':
            if (!metrics.intervals || metrics.intervals < 1) newErrors.intervals = 'Количество интервалов должно быть больше 0';
            if (!metrics.work_seconds || metrics.work_seconds < 1) newErrors.work = 'Время работы должно быть больше 0';
            break;
         default:
            break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   // Форматирование метрик для отправки
   const formatMetricsForSubmit = (metrics) => {
      const formatted = { ...metrics };

      if (formatted.type === 'duration' && formatted.duration_minutes) {
         formatted.duration_seconds = formatted.duration_minutes * 60;
         delete formatted.duration_minutes;
      }

      return formatted;
   };

   // Сохранение изменений
   const handleSaveEdit = async () => {
      if (!validateForm()) return;

      const submitMetrics = formatMetricsForSubmit(formData.metrics);

      const result = await dispatch(updateTask({
         taskId: task.id,
         data: {
            custom_title: formData.custom_title,
            custom_description: formData.custom_description,
            priority: formData.priority,
            due_date: formData.due_date || null,
            points_earned: formData.points_earned,
            metrics: submitMetrics
         }
      }));

      if (result.meta.requestStatus === 'fulfilled') {
         toast.success(`✏️ Задание "${formData.custom_title || task.custom_title || 'Задание'}" обновлено`, {
            position: "top-right",
            autoClose: 3000,
         });
         setIsEditing(false);
         setHasChanges(false);
         onTaskUpdated?.();
      } else {
         const errorMsg = result.payload?.message || 'Не удалось обновить задание';
         toast.error(`❌ Ошибка: ${errorMsg}`, {
            position: "top-right",
            autoClose: 5000,
         });
      }
   };

   const handleCancelEdit = () => {
      if (hasChanges) {
         if (window.confirm('Отменить изменения?')) {
            setIsEditing(false);
            setHasChanges(false);
         }
      } else {
         setIsEditing(false);
      }
   };

   const handleComplete = () => {
      onClose();
      if (window.completeTaskCallback) {
         window.completeTaskCallback(task);
      }
   };

   const handleArchive = async () => {
      const result = await dispatch(updateTask({
         taskId: task.id,
         data: { status: 'archived' }
      }));

      if (result.meta.requestStatus === 'fulfilled') {
         const taskTitle = task.exercise?.title || task.custom_title || 'Задание';
         toast.info(`📦 Задание "${taskTitle}" отправлено в архив`, {
            position: "top-right",
            autoClose: 3000,
         });

         if (window.refreshTasksCount) window.refreshTasksCount();
         window.dispatchEvent(new CustomEvent('tasks-updated'));

         setShowConfirmArchive(false);
         onTaskUpdated?.();
         onClose();
      } else {
         const errorMsg = result.payload?.message || 'Не удалось архивировать задание';
         toast.error(`❌ Ошибка: ${errorMsg}`, {
            position: "top-right",
            autoClose: 5000,
         });
      }
   };

   const handleDelete = async () => {
      const result = await dispatch(deleteTask(task.id));

      if (result.meta.requestStatus === 'fulfilled') {
         const taskTitle = task.exercise?.title || task.custom_title || 'Задание';
         toast.warning(`🗑️ Задание "${taskTitle}" удалено`, {
            position: "top-right",
            autoClose: 3000,
         });

         if (window.refreshTasksCount) window.refreshTasksCount();
         window.dispatchEvent(new CustomEvent('tasks-updated'));

         setShowConfirmDelete(false);
         onTaskUpdated?.();
         onClose();
      } else {
         const errorMsg = result.payload?.message || 'Не удалось удалить задание';
         toast.error(`❌ Ошибка: ${errorMsg}`, {
            position: "top-right",
            autoClose: 5000,
         });
      }
   };

   const handleSaveToLibrary = async () => {
      if (window.confirm('Сохранить это задание в библиотеку упражнений?')) {
         const result = await dispatch(saveTaskToLibrary(task.id));

         if (result.meta.requestStatus === 'fulfilled') {
            toast.success(`📚 Задание "${task.exercise?.title || task.custom_title || 'Задание'}" сохранено в библиотеку`, {
               position: "top-right",
               autoClose: 3000,
            });
            onTaskUpdated?.();
            dispatch(fetchTaskById(task.id));
         } else {
            const errorMsg = result.payload?.message || 'Не удалось сохранить в библиотеку';
            toast.error(`❌ Ошибка: ${errorMsg}`, {
               position: "top-right",
               autoClose: 5000,
            });
         }
      }
   };

   const handleSafeClose = () => {
      if (isEditing && hasChanges) {
         if (window.confirm('Есть несохраненные изменения. Закрыть без сохранения?')) {
            setIsEditing(false);
            setHasChanges(false);
            onClose();
         }
      } else {
         onClose();
      }
   };

   // Форматирование метрик для отображения
   const formatMetricValue = (metrics) => {
      if (!metrics) return '—';

      switch (metrics.type) {
         case 'sets_reps':
            return `${metrics.sets} × ${metrics.reps} повторов${metrics.weight_kg ? `, ${metrics.weight_kg} кг` : ''}`;
         case 'duration':
            const minutes = Math.floor((metrics.duration_seconds || 0) / 60);
            const seconds = (metrics.duration_seconds || 0) % 60;
            return seconds > 0 ? `${minutes} мин ${seconds} сек` : `${minutes} минут`;
         case 'weight':
            return `${metrics.weight_kg} кг, ${metrics.sets} × ${metrics.reps}`;
         case 'interval':
            return `${metrics.intervals} интервалов по ${metrics.work_seconds} сек${metrics.rest_seconds ? `, отдых ${metrics.rest_seconds} сек` : ''}`;
         default:
            return '—';
      }
   };

   // Форматирование фактических метрик
   const formatActualMetrics = (actualMetrics) => {
      if (!actualMetrics || Object.keys(actualMetrics).length === 0) return '—';

      switch (actualMetrics.type) {
         case 'sets_reps':
            const repsText = actualMetrics.reps?.length
               ? actualMetrics.reps.join(', ')
               : actualMetrics.reps_total || actualMetrics.reps;
            return `${actualMetrics.sets || '?'} × ${repsText}${actualMetrics.weight_kg ? `, ${actualMetrics.weight_kg} кг` : ''}`;
         case 'duration':
            const minutes = Math.floor((actualMetrics.duration_seconds || 0) / 60);
            const seconds = (actualMetrics.duration_seconds || 0) % 60;
            return seconds > 0 ? `${minutes} мин ${seconds} сек` : `${minutes} минут`;
         case 'weight':
            return `${actualMetrics.weight_kg} кг, ${actualMetrics.sets} × ${actualMetrics.reps}`;
         case 'interval':
            return `${actualMetrics.intervals_completed || actualMetrics.sets || '?'} из ${actualMetrics.intervals} интервалов`;
         default:
            return actualMetrics.completed ? 'Выполнено' : '—';
      }
   };

   if (!isOpen) return null;

   if (!task) {
      return (
         <div className={styles.overlay} onClick={handleSafeClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
               <div className={styles.loadingContainer}>
                  <div className={styles.spinner} />
                  <p>Загрузка задания...</p>
               </div>
            </div>
         </div>
      );
   }

   const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[2];
   const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.active;

   return (
      <div className={styles.overlay} onClick={isEditing ? undefined : handleSafeClose}>
         <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
               <div className={styles.headerLeft}>
                  <h2>{task.exercise?.title || task.custom_title || 'Задание'}</h2>
                  <div className={styles.badges}>
                     <span className={`${styles.priorityBadge} ${styles[priorityConfig.class]}`}>
                        {priorityConfig.icon} {priorityConfig.label}
                     </span>
                     <span className={`${styles.statusBadge} ${styles[statusConfig.class]}`}>
                        {statusConfig.icon} {statusConfig.label}
                     </span>
                  </div>
               </div>
               <button className={styles.closeBtn} onClick={handleSafeClose}>✕</button>
            </div>

            <div className={styles.content}>
               {isEditing ? (
                  <form className={styles.editForm}>
                     {/* Название */}
                     <div className={styles.formGroup}>
                        <label>Название *</label>
                        <input
                           type="text"
                           value={formData.custom_title}
                           onChange={(e) => {
                              setFormData(prev => ({ ...prev, custom_title: e.target.value }));
                              setErrors(prev => ({ ...prev, custom_title: null }));
                              setHasChanges(true);
                           }}
                           placeholder="Например: Утренняя зарядка"
                           className={errors.custom_title ? styles.error : ''}
                        />
                        {errors.custom_title && <span className={styles.errorText}>{errors.custom_title}</span>}
                     </div>

                     {/* Описание */}
                     <div className={styles.formGroup}>
                        <label>Описание</label>
                        <textarea
                           value={formData.custom_description}
                           onChange={(e) => {
                              setFormData(prev => ({ ...prev, custom_description: e.target.value }));
                              setHasChanges(true);
                           }}
                           placeholder="Подробное описание задания..."
                           rows={6}
                        />
                     </div>

                     {/* Тип метрик */}
                     <div className={styles.formGroup}>
                        <label>Тип метрик</label>
                        <div className={styles.metricTypes}>
                           {METRIC_TYPES.map(type => (
                              <button
                                 key={type.value}
                                 type="button"
                                 className={`${styles.metricTypeBtn} ${formData.metric_type === type.value ? styles.active : ''}`}
                                 onClick={() => handleMetricTypeChange(type.value)}
                              >
                                 {type.icon} {type.label}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Поля метрик */}
                     <div className={styles.metricsFields}>
                        {formData.metrics?.type === 'sets_reps' && (
                           <div className={styles.metricRow}>
                              <div className={styles.formGroupSmall}>
                                 <label>Подходы</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.sets || ''}
                                    onChange={(e) => updateMetricField('sets', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.sets && <span className={styles.errorText}>{errors.sets}</span>}
                              </div>
                              <div className={styles.formGroupSmall}>
                                 <label>Повторения</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.reps || ''}
                                    onChange={(e) => updateMetricField('reps', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.reps && <span className={styles.errorText}>{errors.reps}</span>}
                              </div>
                              <div className={styles.formGroupSmall}>
                                 <label>Вес (кг)</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.weight_kg || ''}
                                    onChange={(e) => updateMetricField('weight_kg', parseInt(e.target.value) || null)}
                                    placeholder="опционально"
                                 />
                              </div>
                           </div>
                        )}

                        {formData.metrics?.type === 'duration' && (
                           <div className={styles.metricRow}>
                              <div className={styles.formGroupSmall}>
                                 <label>Длительность (минуты)</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.duration_minutes || ''}
                                    onChange={(e) => updateMetricField('duration_minutes', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.duration && <span className={styles.errorText}>{errors.duration}</span>}
                              </div>
                           </div>
                        )}

                        {formData.metrics?.type === 'weight' && (
                           <div className={styles.metricRow}>
                              <div className={styles.formGroupSmall}>
                                 <label>Вес (кг)</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.weight_kg || ''}
                                    onChange={(e) => updateMetricField('weight_kg', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.weight && <span className={styles.errorText}>{errors.weight}</span>}
                              </div>
                              <div className={styles.formGroupSmall}>
                                 <label>Подходы</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.sets || ''}
                                    onChange={(e) => updateMetricField('sets', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.sets && <span className={styles.errorText}>{errors.sets}</span>}
                              </div>
                              <div className={styles.formGroupSmall}>
                                 <label>Повторения</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.reps || ''}
                                    onChange={(e) => updateMetricField('reps', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.reps && <span className={styles.errorText}>{errors.reps}</span>}
                              </div>
                           </div>
                        )}

                        {formData.metrics?.type === 'interval' && (
                           <div className={styles.metricRow}>
                              <div className={styles.formGroupSmall}>
                                 <label>Интервалов</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.intervals || ''}
                                    onChange={(e) => updateMetricField('intervals', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.intervals && <span className={styles.errorText}>{errors.intervals}</span>}
                              </div>
                              <div className={styles.formGroupSmall}>
                                 <label>Работа (сек)</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.work_seconds || ''}
                                    onChange={(e) => updateMetricField('work_seconds', parseInt(e.target.value) || 0)}
                                    min="1"
                                 />
                                 {errors.work && <span className={styles.errorText}>{errors.work}</span>}
                              </div>
                              <div className={styles.formGroupSmall}>
                                 <label>Отдых (сек)</label>
                                 <input
                                    type="number"
                                    value={formData.metrics.rest_seconds || ''}
                                    onChange={(e) => updateMetricField('rest_seconds', parseInt(e.target.value) || null)}
                                    placeholder="опционально"
                                 />
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Приоритет */}
                     <div className={styles.formGroup}>
                        <label>Приоритет</label>
                        <div className={styles.priorityGroup}>
                           {PRIORITY_OPTIONS.map(opt => (
                              <button
                                 key={opt.value}
                                 type="button"
                                 className={`${styles.priorityBtn} ${formData.priority === opt.value ? styles.active : ''}`}
                                 onClick={() => {
                                    setFormData(prev => ({ ...prev, priority: opt.value }));
                                    setHasChanges(true);
                                 }}
                              >
                                 {opt.icon} {opt.label}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Срок выполнения */}
                     <div className={styles.formGroup}>
                        <label>Срок выполнения</label>
                        <input
                           type="datetime-local"
                           value={formData.due_date}
                           onChange={(e) => {
                              setFormData(prev => ({ ...prev, due_date: e.target.value }));
                              setHasChanges(true);
                           }}
                        />
                     </div>

                     {/* Баллы */}
                     <div className={styles.formGroup}>
                        <label>Базовые баллы (опционально)</label>
                        <input
                           type="number"
                           value={formData.points_earned}
                           onChange={(e) => {
                              setFormData(prev => ({ ...prev, points_earned: parseInt(e.target.value) || 0 }));
                              setHasChanges(true);
                           }}
                           min="0"
                           placeholder="0"
                        />
                     </div>

                     {/* Кнопки */}
                     <div className={styles.editActions}>
                        <button type="button" onClick={handleCancelEdit} className={styles.cancelBtn}>
                           Отмена
                        </button>
                        <button type="button" onClick={handleSaveEdit} disabled={isUpdating} className={styles.saveBtn}>
                           {isUpdating ? 'Сохранение...' : '💾 Сохранить изменения'}
                        </button>
                     </div>
                  </form>
               ) : (
                  <>
                     {(task.custom_description || task.exercise?.description) && (
                        <div className={styles.section}>
                           <h3>📝 Описание</h3>
                           <p className={styles.descriptionText}>{task.custom_description || task.exercise?.description}</p>
                        </div>
                     )}

                     <div className={styles.section}>
                        <h3>🎯 Задача</h3>
                        <div className={styles.metricsCard}>
                           {formatMetricValue(task.metrics)}
                        </div>
                     </div>

                     {task.status === 'completed' && task.actual_metrics && (
                        <div className={styles.section}>
                           <h3>✅ Фактическое выполнение</h3>
                           <div className={styles.actualMetricsCard}>
                              {formatActualMetrics(task.actual_metrics)}
                              {task.felt_difficulty && (
                                 <div className={styles.difficulty}>
                                    Сложность: {'😊'.repeat(task.felt_difficulty)}{'😐'.repeat(10 - task.felt_difficulty)} ({task.felt_difficulty}/10)
                                 </div>
                              )}
                           </div>
                        </div>
                     )}

                     {task.completion_percentage > 0 && (
                        <div className={styles.section}>
                           <h3>📊 Прогресс</h3>
                           <div className={styles.progressContainer}>
                              <div className={styles.progressBar} style={{ width: `${task.completion_percentage}%` }} />
                              <span className={styles.progressText}>{task.completion_percentage}%</span>
                           </div>
                        </div>
                     )}

                     <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                           <span className={styles.infoLabel}>👤 Создал</span>
                           <span className={styles.infoValue}>{task.assigner?.userName || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                           <span className={styles.infoLabel}>🏃 Исполнитель</span>
                           <span className={styles.infoValue}>{task.assignee?.userName || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                           <span className={styles.infoLabel}>📅 Создано</span>
                           <span className={styles.infoValue}>
                              {task.created_at && format(new Date(task.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                           </span>
                        </div>
                        {task.due_date && (
                           <div className={styles.infoItem}>
                              <span className={styles.infoLabel}>⏰ Срок</span>
                              <span className={`${styles.infoValue} ${task.status === 'active' && new Date(task.due_date) < new Date() ? styles.overdue : ''}`}>
                                 {format(new Date(task.due_date), 'dd MMM yyyy, HH:mm', { locale: ru })}
                              </span>
                           </div>
                        )}
                        {task.completed_at && (
                           <div className={styles.infoItem}>
                              <span className={styles.infoLabel}>✅ Выполнено</span>
                              <span className={styles.infoValue}>
                                 {format(new Date(task.completed_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                              </span>
                           </div>
                        )}
                        {task.points_earned > 0 && (
                           <div className={styles.infoItem}>
                              <span className={styles.infoLabel}>🏆 Баллы</span>
                              <span className={styles.infoValue}>{task.points_earned}</span>
                           </div>
                        )}
                     </div>

                     {task.exercise && (
                        <div className={styles.sourceInfo}>
                           <span className={styles.sourceIcon}>📚</span>
                           <span>Из библиотеки: {task.exercise.title}</span>
                        </div>
                     )}
                  </>
               )}
            </div>

            {!isEditing && (
               <div className={styles.actions}>
                  {canSaveToLibrary && (
                     <button onClick={handleSaveToLibrary} className={styles.libraryBtn}>
                        📚 В библиотеку
                     </button>
                  )}

                  <div className={styles.rightActions}>
                     {canComplete && (
                        <button onClick={handleComplete} disabled={isCompleting} className={styles.completeBtn}>
                           {isCompleting ? 'Выполняется...' : '✅ Выполнить'}
                        </button>
                     )}

                     {canEdit && (
                        <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                           ✏️ Редактировать
                        </button>
                     )}

                     {canArchive && (
                        <button onClick={() => setShowConfirmArchive(true)} className={styles.archiveBtn}>
                           📦 В архив
                        </button>
                     )}

                     {(canEdit || isAssigner || isAdmin) && (
                        <button onClick={() => setShowConfirmDelete(true)} className={styles.deleteBtn}>
                           🗑️ Удалить
                        </button>
                     )}
                  </div>
               </div>
            )}

            {showConfirmArchive && (
               <div className={styles.confirmOverlay}>
                  <div className={styles.confirmModal}>
                     <p>Отправить задание в архив?</p>
                     <p className={styles.confirmHint}>Архивные задания не отображаются в активном списке, но сохраняются для статистики.</p>
                     <div className={styles.confirmActions}>
                        <button onClick={() => setShowConfirmArchive(false)}>Отмена</button>
                        <button onClick={handleArchive} className={styles.confirmArchive}>В архив</button>
                     </div>
                  </div>
               </div>
            )}

            {showConfirmDelete && (
               <div className={styles.confirmOverlay}>
                  <div className={styles.confirmModal}>
                     <p>⚠️ Удалить задание?</p>
                     <p className={styles.confirmHint}>Это действие нельзя отменить. Задание будет полностью удалено из системы.</p>
                     <div className={styles.confirmActions}>
                        <button onClick={() => setShowConfirmDelete(false)}>Отмена</button>
                        <button onClick={handleDelete} disabled={isDeleting} className={styles.confirmDelete}>
                           {isDeleting ? 'Удаление...' : 'Удалить'}
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default TaskDetailModal;