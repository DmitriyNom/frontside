// frontend/src/UI/Components/TaskCreateModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   fetchAssignableUsers,
   createTask,
   selectAssignableUsers,
   selectCreateTaskLoading
} from '../../features/taskSlice';
import styles from './TaskCreateModal.module.css';
import { toast } from 'react-toastify';

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

const TaskCreateModal = ({ isOpen, onClose, onSuccess, defaultUserId = null }) => {
   const dispatch = useDispatch();
   const assignableUsers = useSelector(selectAssignableUsers);
   const isLoading = useSelector(selectCreateTaskLoading);

   // Форма
   const [formData, setFormData] = useState({
      user_id: defaultUserId || '',
      exercise_type: 'custom',
      exercise_id: '',
      custom_title: '',
      custom_description: '',
      metric_type: 'sets_reps',
      metrics: {
         type: 'sets_reps',
         sets: 3,
         reps: 10,
         weight_kg: null
      },
      priority: 2,
      due_date: '',
      points_earned: 0
   });

   const [errors, setErrors] = useState({});

   // Загрузка пользователей при открытии
   useEffect(() => {
      if (isOpen) {
         dispatch(fetchAssignableUsers());
      }
   }, [isOpen, dispatch]);

   // Установка выбранного пользователя по умолчанию
   useEffect(() => {
      if (defaultUserId && assignableUsers.length > 0) {
         const user = assignableUsers.find(u => u.id === defaultUserId);
         if (user) {
            setFormData(prev => ({ ...prev, user_id: defaultUserId }));
         }
      }
   }, [defaultUserId, assignableUsers]);

   // Обновление метрик при изменении типа
   const handleMetricTypeChange = (type) => {
      let newMetrics = { type };
      switch (type) {
         case 'sets_reps':
            newMetrics = { type, sets: 3, reps: 10, weight_kg: null };
            break;
         case 'duration':
            newMetrics = { type, duration_seconds: 1800 };
            break;
         case 'weight':
            newMetrics = { type, weight_kg: 50, sets: 5, reps: 5 };
            break;
         case 'interval':
            newMetrics = { type, intervals: 5, work_seconds: 30, rest_seconds: 15 };
            break;
         default:
            newMetrics = { type, completed: true };
            break;
      }
      setFormData(prev => ({ ...prev, metric_type: type, metrics: newMetrics }));
   };

   // Обновление полей метрик
   const updateMetricField = (field, value) => {
      setFormData(prev => ({
         ...prev,
         metrics: { ...prev.metrics, [field]: value }
      }));
   };

   // Валидация формы
   const validateForm = () => {
      const newErrors = {};

      if (!formData.user_id) {
         newErrors.user_id = 'Выберите спортсмена';
      }

      if (formData.exercise_type === 'custom') {
         if (!formData.custom_title.trim()) {
            newErrors.custom_title = 'Введите название задания';
         }
      } else {
         if (!formData.exercise_id) {
            newErrors.exercise_id = 'Выберите упражнение';
         }
      }

      const { metrics } = formData;
      switch (metrics.type) {
         case 'sets_reps':
            if (!metrics.sets || metrics.sets < 1) newErrors.sets = 'Количество подходов должно быть больше 0';
            if (!metrics.reps || metrics.reps < 1) newErrors.reps = 'Количество повторений должно быть больше 0';
            break;
         case 'duration':
            if (!metrics.duration_seconds || metrics.duration_seconds < 1) {
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

   // Отправка формы
   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      let taskData = {
         user_id: formData.user_id,
         priority: formData.priority,
         metrics: formData.metrics,
         due_date: formData.due_date || null,
         points_earned: formData.points_earned
      };

      if (formData.exercise_type === 'custom') {
         taskData.custom_title = formData.custom_title.trim();
         taskData.custom_description = formData.custom_description.trim() || null;
      } else {
         taskData.exercise_id = parseInt(formData.exercise_id);
      }

      const result = await dispatch(createTask(taskData));

      if (result.meta.requestStatus === 'fulfilled') {
         const taskTitle = formData.custom_title || taskData.custom_title || 'Задание';
         toast.success(`✅ Задание "${taskTitle}" успешно создано!`, {
            position: "top-right",
            autoClose: 3000,
         });

         // Обновляем бейдж в сайдбаре
         if (window.refreshTasksCount) {
            window.refreshTasksCount();
         }
         window.dispatchEvent(new CustomEvent('tasks-updated'));

         handleClose();
         onSuccess?.();
      } else {
         const errorMsg = result.payload?.message || 'Не удалось создать задание';
         toast.error(`❌ Ошибка: ${errorMsg}`, {
            position: "top-right",
            autoClose: 5000,
         });
      }
   };

   const handleClose = () => {
      setFormData({
         user_id: defaultUserId || '',
         exercise_type: 'custom',
         exercise_id: '',
         custom_title: '',
         custom_description: '',
         metric_type: 'sets_reps',
         metrics: { type: 'sets_reps', sets: 3, reps: 10, weight_kg: null },
         priority: 2,
         due_date: '',
         points_earned: 0
      });
      setErrors({});
      onClose();
   };

   if (!isOpen) return null;

   return (
      <div className={styles.overlay} onClick={handleClose}>
         <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
               <h2>➕ Создание задания</h2>
               <button className={styles.closeBtn} onClick={handleClose}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
               {/* Выбор спортсмена */}
               <div className={styles.formGroup}>
                  <label>Спортсмен *</label>
                  <select
                     value={formData.user_id}
                     onChange={(e) => {
                        const userId = parseInt(e.target.value);
                        setFormData(prev => ({ ...prev, user_id: userId }));
                        setErrors(prev => ({ ...prev, user_id: null }));
                     }}
                     className={errors.user_id ? styles.error : ''}
                  >
                     <option value="">Выберите спортсмена</option>
                     {assignableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                           {user.userName} {user.relation_type === 'self' ? '(себе)' : ''}
                        </option>
                     ))}
                  </select>
                  {errors.user_id && <span className={styles.errorText}>{errors.user_id}</span>}
               </div>

               {/* Тип задания */}
               <div className={styles.formGroup}>
                  <label>Тип задания</label>
                  <div className={styles.radioGroup}>
                     <label className={styles.radioLabel}>
                        <input
                           type="radio"
                           value="custom"
                           checked={formData.exercise_type === 'custom'}
                           onChange={() => setFormData(prev => ({ ...prev, exercise_type: 'custom' }))}
                        />
                        📝 Кастомное задание
                     </label>
                     <label className={styles.radioLabel}>
                        <input
                           type="radio"
                           value="library"
                           checked={formData.exercise_type === 'library'}
                           onChange={() => setFormData(prev => ({ ...prev, exercise_type: 'library' }))}
                        />
                        📚 Из библиотеки упражнений
                     </label>
                  </div>
               </div>

               {/* Кастомное задание */}
               {formData.exercise_type === 'custom' && (
                  <>
                     <div className={styles.formGroup}>
                        <label>Название *</label>
                        <input
                           type="text"
                           value={formData.custom_title}
                           onChange={(e) => {
                              setFormData(prev => ({ ...prev, custom_title: e.target.value }));
                              setErrors(prev => ({ ...prev, custom_title: null }));
                           }}
                           placeholder="Например: Утренняя зарядка"
                           className={errors.custom_title ? styles.error : ''}
                        />
                        {errors.custom_title && <span className={styles.errorText}>{errors.custom_title}</span>}
                     </div>

                     <div className={styles.formGroup}>
                        <label>Описание</label>
                        <textarea
                           value={formData.custom_description}
                           onChange={(e) => setFormData(prev => ({ ...prev, custom_description: e.target.value }))}
                           placeholder="Подробное описание задания..."
                           rows={6}
                        />
                     </div>
                  </>
               )}

               {/* Библиотека упражнений */}
               {formData.exercise_type === 'library' && (
                  <div className={styles.formGroup}>
                     <label>Упражнение *</label>
                     <select
                        value={formData.exercise_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, exercise_id: e.target.value }))}
                        className={errors.exercise_id ? styles.error : ''}
                     >
                        <option value="">Выберите упражнение</option>
                        <option value="1">Приседания со штангой</option>
                        <option value="2">Жим лёжа</option>
                        <option value="3">Становая тяга</option>
                     </select>
                     {errors.exercise_id && <span className={styles.errorText}>{errors.exercise_id}</span>}
                  </div>
               )}

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
                  {formData.metrics.type === 'sets_reps' && (
                     <div className={styles.metricRow}>
                        <div className={styles.formGroupSmall}>
                           <label>Подходы</label>
                           <input
                              type="number"
                              value={formData.metrics.sets}
                              onChange={(e) => updateMetricField('sets', parseInt(e.target.value) || 0)}
                              min="1"
                           />
                           {errors.sets && <span className={styles.errorText}>{errors.sets}</span>}
                        </div>
                        <div className={styles.formGroupSmall}>
                           <label>Повторения</label>
                           <input
                              type="number"
                              value={formData.metrics.reps}
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

                  {formData.metrics.type === 'duration' && (
                     <div className={styles.metricRow}>
                        <div className={styles.formGroupSmall}>
                           <label>Длительность (минуты)</label>
                           <input
                              type="number"
                              value={Math.floor((formData.metrics.duration_seconds || 0) / 60)}
                              onChange={(e) => updateMetricField('duration_seconds', parseInt(e.target.value) * 60 || 0)}
                              min="1"
                           />
                           {errors.duration && <span className={styles.errorText}>{errors.duration}</span>}
                        </div>
                     </div>
                  )}

                  {formData.metrics.type === 'weight' && (
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
                              value={formData.metrics.sets}
                              onChange={(e) => updateMetricField('sets', parseInt(e.target.value) || 0)}
                              min="1"
                           />
                           {errors.sets && <span className={styles.errorText}>{errors.sets}</span>}
                        </div>
                        <div className={styles.formGroupSmall}>
                           <label>Повторения</label>
                           <input
                              type="number"
                              value={formData.metrics.reps}
                              onChange={(e) => updateMetricField('reps', parseInt(e.target.value) || 0)}
                              min="1"
                           />
                           {errors.reps && <span className={styles.errorText}>{errors.reps}</span>}
                        </div>
                     </div>
                  )}

                  {formData.metrics.type === 'interval' && (
                     <div className={styles.metricRow}>
                        <div className={styles.formGroupSmall}>
                           <label>Интервалов</label>
                           <input
                              type="number"
                              value={formData.metrics.intervals}
                              onChange={(e) => updateMetricField('intervals', parseInt(e.target.value) || 0)}
                              min="1"
                           />
                           {errors.intervals && <span className={styles.errorText}>{errors.intervals}</span>}
                        </div>
                        <div className={styles.formGroupSmall}>
                           <label>Работа (сек)</label>
                           <input
                              type="number"
                              value={formData.metrics.work_seconds}
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
                           onClick={() => setFormData(prev => ({ ...prev, priority: opt.value }))}
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
                     onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
               </div>

               {/* Баллы */}
               <div className={styles.formGroup}>
                  <label>Базовые баллы (опционально)</label>
                  <input
                     type="number"
                     value={formData.points_earned}
                     onChange={(e) => setFormData(prev => ({ ...prev, points_earned: parseInt(e.target.value) || 0 }))}
                     min="0"
                     placeholder="0"
                  />
               </div>

               {/* Кнопки */}
               <div className={styles.actions}>
                  <button type="button" onClick={handleClose} className={styles.cancelBtn}>
                     Отмена
                  </button>
                  <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                     {isLoading ? 'Создание...' : '➕ Создать задание'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default TaskCreateModal;