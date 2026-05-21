// frontend/src/UI/Components/TaskCompleteModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { completeTask } from '../../features/taskSlice';
import styles from './TaskCompleteModal.module.css';
import { toast } from 'react-toastify';


const TaskCompleteModal = ({ isOpen, onClose, task, onSuccess }) => {
   const dispatch = useDispatch();

   const [actualMetrics, setActualMetrics] = useState({});
   const [feltDifficulty, setFeltDifficulty] = useState(5);
   const [comment, setComment] = useState('');
   const [errors, setErrors] = useState({});
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Инициализация формы при открытии
   useEffect(() => {
      if (isOpen && task) {
         const metricsType = task.metrics?.type;

         switch (metricsType) {
            case 'sets_reps':
               setActualMetrics({
                  type: 'sets_reps',
                  sets: task.metrics?.sets || 1,
                  reps: Array(task.metrics?.sets || 1).fill(task.metrics?.reps || 10),
                  weight_kg: task.metrics?.weight_kg || null
               });
               break;
            case 'duration':
               setActualMetrics({
                  type: 'duration',
                  duration_seconds: task.metrics?.duration_seconds || 0
               });
               break;
            case 'weight':
               setActualMetrics({
                  type: 'weight',
                  weight_kg: task.metrics?.weight_kg || 50,
                  sets: task.metrics?.sets || 5,
                  reps: task.metrics?.reps || 5
               });
               break;
            case 'interval':
               setActualMetrics({
                  type: 'interval',
                  intervals: task.metrics?.intervals || 5,
                  intervals_completed: task.metrics?.intervals || 5,
                  work_seconds: task.metrics?.work_seconds || 30,
                  rest_seconds: task.metrics?.rest_seconds || 15
               });
               break;
            default:
               setActualMetrics({ completed: true });
         }

         setFeltDifficulty(5);
         setComment('');
         setErrors({});
      }
   }, [isOpen, task]);

   const formatDuration = (seconds) => {
      if (!seconds) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
   };

   const parseDuration = (timeStr) => {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
         return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return parseInt(parts[0]) * 60 || 0;
   };

   const updateMetricField = (field, value) => {
      setActualMetrics(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
         setErrors(prev => ({ ...prev, [field]: null }));
      }
   };

   const updateRepForSet = (index, value) => {
      const newReps = [...(actualMetrics.reps || [])];
      newReps[index] = parseInt(value) || 0;
      updateMetricField('reps', newReps);
   };

   const validateForm = () => {
      const newErrors = {};
      const metricsType = task?.metrics?.type;

      switch (metricsType) {
         case 'sets_reps':
            const actualSets = actualMetrics.sets || 0;
            const plannedSets = task.metrics?.sets || 1;

            if (actualSets < 1) {
               newErrors.sets = 'Укажите количество выполненных подходов';
            }

            if (actualMetrics.reps && Array.isArray(actualMetrics.reps)) {
               for (let i = 0; i < actualMetrics.reps.length; i++) {
                  if (!actualMetrics.reps[i] || actualMetrics.reps[i] < 1) {
                     newErrors[`rep_${i}`] = 'Укажите количество повторений';
                  }
               }
            }

            if (actualSets > plannedSets) {
               newErrors.sets = `Вы не можете выполнить больше подходов, чем запланировано (${plannedSets})`;
            }
            break;

         case 'duration':
            if (!actualMetrics.duration_seconds || actualMetrics.duration_seconds < 1) {
               newErrors.duration = 'Укажите фактическую длительность';
            }
            break;

         case 'weight':
            if (!actualMetrics.weight_kg || actualMetrics.weight_kg < 1) {
               newErrors.weight = 'Укажите фактический вес';
            }
            if (!actualMetrics.sets || actualMetrics.sets < 1) {
               newErrors.sets = 'Укажите количество подходов';
            }
            if (!actualMetrics.reps || actualMetrics.reps < 1) {
               newErrors.reps = 'Укажите количество повторений';
            }
            break;

         case 'interval':
            if (!actualMetrics.intervals_completed || actualMetrics.intervals_completed < 1) {
               newErrors.intervals_completed = 'Укажите количество выполненных интервалов';
            }
            if (actualMetrics.intervals_completed > (task.metrics?.intervals || 1)) {
               newErrors.intervals_completed = `Нельзя выполнить больше ${task.metrics?.intervals} интервалов`;
            }
            break;

         default:
            if (!actualMetrics.completed) {
               newErrors.completed = 'Подтвердите выполнение задания';
            }
            break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      setIsSubmitting(true);

      const completionData = {
         actual_metrics: actualMetrics,
         felt_difficulty: feltDifficulty,
         comment: comment.trim() || null
      };

      const result = await dispatch(completeTask({
         taskId: task.id,
         result: completionData
      }));

      setIsSubmitting(false);

      if (result.meta.requestStatus === 'fulfilled') {
         const taskTitle = task.exercise?.title || task.custom_title || 'Задание';
         toast.success(`🎉 Задание "${taskTitle}" выполнено! Получено ${task.points_earned || 0} баллов.`, {
            position: "top-right",
            autoClose: 4000,
         });

         // Обновляем бейдж в сайдбаре
         if (window.refreshTasksCount) {
            window.refreshTasksCount();
         }
         window.dispatchEvent(new CustomEvent('tasks-updated'));

         onSuccess?.();
         onClose();
      } else {
         const errorMsg = result.payload?.message || 'Не удалось завершить задание';
         toast.error(`❌ Ошибка: ${errorMsg}`, {
            position: "top-right",
            autoClose: 5000,
         });
      }
   };

   // Получение цвета для ползунка в зависимости от значения
   const getSliderGradient = () => {
      const percent = ((feltDifficulty - 1) / 9) * 100;
      return `linear-gradient(90deg, #10b981 0%, #f59e0b ${percent}%, #ef4444 ${percent}%, #e2e8f0 ${percent}%)`;
   };

   if (!isOpen || !task) return null;

   const metricsType = task.metrics?.type;
   const plannedMetrics = task.metrics;

   const renderMetricFields = () => {
      switch (metricsType) {
         case 'sets_reps':
            const plannedSets = plannedMetrics?.sets || 1;
            const plannedReps = plannedMetrics?.reps || 10;

            return (
               <div className={styles.metricSection}>
                  <div className={styles.metricHeader}>
                     <span className={styles.metricIcon}>🏋️</span>
                     <span>Подходы и повторения</span>
                     <span className={styles.plannedHint}>
                        (план: {plannedSets}×{plannedReps})
                     </span>
                  </div>

                  <div className={styles.formGroup}>
                     <label>Выполнено подходов</label>
                     <input
                        type="number"
                        value={actualMetrics.sets || ''}
                        onChange={(e) => updateMetricField('sets', parseInt(e.target.value) || 0)}
                        min="1"
                        max={plannedSets}
                        className={errors.sets ? styles.error : ''}
                     />
                     {errors.sets && <span className={styles.errorText}>{errors.sets}</span>}
                  </div>

                  <div className={styles.setsContainer}>
                     <label>Повторения по подходам</label>
                     {Array.from({ length: actualMetrics.sets || 1 }).map((_, index) => (
                        <div key={index} className={styles.setInput}>
                           <span className={styles.setNumber}>Подход {index + 1}:</span>
                           <input
                              type="number"
                              value={actualMetrics.reps?.[index] || ''}
                              onChange={(e) => updateRepForSet(index, e.target.value)}
                              placeholder={`${plannedReps} повт`}
                              min="1"
                              className={errors[`rep_${index}`] ? styles.error : ''}
                           />
                           <span>повторений</span>
                        </div>
                     ))}
                  </div>

                  <div className={styles.formGroup}>
                     <label>Вес (кг) (опционально)</label>
                     <input
                        type="number"
                        value={actualMetrics.weight_kg || ''}
                        onChange={(e) => updateMetricField('weight_kg', parseInt(e.target.value) || null)}
                        placeholder={plannedMetrics?.weight_kg ? `${plannedMetrics.weight_kg} кг` : 'не указан'}
                     />
                  </div>
               </div>
            );

         case 'duration':
            return (
               <div className={styles.metricSection}>
                  <div className={styles.metricHeader}>
                     <span className={styles.metricIcon}>⏱️</span>
                     <span>Длительность</span>
                     <span className={styles.plannedHint}>
                        (план: {formatDuration(plannedMetrics?.duration_seconds || 0)})
                     </span>
                  </div>

                  <div className={styles.formGroup}>
                     <label>Фактическая длительность</label>
                     <input
                        type="text"
                        value={formatDuration(actualMetrics.duration_seconds || 0)}
                        onChange={(e) => updateMetricField('duration_seconds', parseDuration(e.target.value))}
                        placeholder="мм:сс"
                        className={errors.duration ? styles.error : ''}
                     />
                     <span className={styles.hint}>Формат: минуты:секунды (например, 5:30)</span>
                     {errors.duration && <span className={styles.errorText}>{errors.duration}</span>}
                  </div>
               </div>
            );

         case 'weight':
            const plannedWeight = plannedMetrics?.weight_kg || 50;
            const plannedWeightSets = plannedMetrics?.sets || 5;
            const plannedWeightReps = plannedMetrics?.reps || 5;

            return (
               <div className={styles.metricSection}>
                  <div className={styles.metricHeader}>
                     <span className={styles.metricIcon}>🏋️‍♂️</span>
                     <span>Весовая работа</span>
                     <span className={styles.plannedHint}>
                        (план: {plannedWeight}кг, {plannedWeightSets}×{plannedWeightReps})
                     </span>
                  </div>

                  <div className={styles.formRow}>
                     <div className={styles.formGroup}>
                        <label>Фактический вес (кг)</label>
                        <input
                           type="number"
                           value={actualMetrics.weight_kg || ''}
                           onChange={(e) => updateMetricField('weight_kg', parseInt(e.target.value) || 0)}
                           min="1"
                           className={errors.weight ? styles.error : ''}
                        />
                        {errors.weight && <span className={styles.errorText}>{errors.weight}</span>}
                     </div>

                     <div className={styles.formGroup}>
                        <label>Подходы</label>
                        <input
                           type="number"
                           value={actualMetrics.sets || ''}
                           onChange={(e) => updateMetricField('sets', parseInt(e.target.value) || 0)}
                           min="1"
                           className={errors.sets ? styles.error : ''}
                        />
                        {errors.sets && <span className={styles.errorText}>{errors.sets}</span>}
                     </div>

                     <div className={styles.formGroup}>
                        <label>Повторения</label>
                        <input
                           type="number"
                           value={actualMetrics.reps || ''}
                           onChange={(e) => updateMetricField('reps', parseInt(e.target.value) || 0)}
                           min="1"
                           className={errors.reps ? styles.error : ''}
                        />
                        {errors.reps && <span className={styles.errorText}>{errors.reps}</span>}
                     </div>
                  </div>
               </div>
            );

         case 'interval':
            const plannedIntervals = plannedMetrics?.intervals || 5;
            const workSec = plannedMetrics?.work_seconds || 30;
            const restSec = plannedMetrics?.rest_seconds || 15;

            return (
               <div className={styles.metricSection}>
                  <div className={styles.metricHeader}>
                     <span className={styles.metricIcon}>🔄</span>
                     <span>Интервальная тренировка</span>
                     <span className={styles.plannedHint}>
                        (план: {plannedIntervals}×{workSec}с работы / {restSec}с отдыха)
                     </span>
                  </div>

                  <div className={styles.formGroup}>
                     <label>Выполнено интервалов</label>
                     <input
                        type="number"
                        value={actualMetrics.intervals_completed || ''}
                        onChange={(e) => updateMetricField('intervals_completed', parseInt(e.target.value) || 0)}
                        min="1"
                        max={plannedIntervals}
                        className={errors.intervals_completed ? styles.error : ''}
                     />
                     {errors.intervals_completed && <span className={styles.errorText}>{errors.intervals_completed}</span>}
                  </div>

                  <div className={styles.formGroup}>
                     <label>Фактическое время работы (сек) (опционально)</label>
                     <input
                        type="number"
                        value={actualMetrics.actual_work_seconds || ''}
                        onChange={(e) => updateMetricField('actual_work_seconds', parseInt(e.target.value) || null)}
                        placeholder={`${workSec} сек`}
                     />
                  </div>
               </div>
            );

         default:
            return (
               <div className={styles.metricSection}>
                  <div className={styles.metricHeader}>
                     <span className={styles.metricIcon}>✅</span>
                     <span>Выполнение</span>
                  </div>

                  <div className={styles.checkboxGroup}>
                     <label className={styles.checkboxLabel}>
                        <input
                           type="checkbox"
                           checked={actualMetrics.completed || false}
                           onChange={(e) => updateMetricField('completed', e.target.checked)}
                        />
                        Задание выполнено
                     </label>
                  </div>
               </div>
            );
      }
   };

   return (
      <div className={styles.overlay} onClick={onClose}>
         <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
               <h2>✅ Завершение задания</h2>
               <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
               <div className={styles.taskInfo}>
                  <h3>{task.exercise?.title || task.custom_title || 'Задание'}</h3>
                  {task.custom_description || task.exercise?.description ? (
                     <p>{task.custom_description || task.exercise?.description}</p>
                  ) : null}
               </div>

               {renderMetricFields()}

               <div className={styles.formGroup}>
                  <label>Субъективная сложность (1-10)</label>
                  <div className={styles.difficultyContainer}>
                     <div className={styles.difficultyLabels}>
                        <span className={styles.difficultyLabelEasy}>😊 Легко</span>
                        <span className={styles.difficultyLabelHard}>💪 Сложно</span>
                     </div>
                     <div className={styles.sliderWrapper}>
                        <input
                           type="range"
                           min="1"
                           max="10"
                           step="1"
                           value={feltDifficulty}
                           onChange={(e) => setFeltDifficulty(parseInt(e.target.value))}
                           className={styles.sliderElegant}
                           style={{ background: getSliderGradient() }}
                        />
                        <div className={styles.sliderMarkers}>
                           <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                           <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                        </div>
                     </div>
                     <div className={styles.difficultyValue}>
                        {feltDifficulty === 1 && '🌟 Очень легко'}
                        {feltDifficulty === 2 && '😊 Легко'}
                        {feltDifficulty === 3 && '🙂 Нормально'}
                        {feltDifficulty === 4 && '🤔 Немного сложно'}
                        {feltDifficulty === 5 && '😐 Средне'}
                        {feltDifficulty === 6 && '😓 Выше среднего'}
                        {feltDifficulty === 7 && '😅 Сложновато'}
                        {feltDifficulty === 8 && '😰 Сложно'}
                        {feltDifficulty === 9 && '💀 Очень сложно'}
                        {feltDifficulty === 10 && '🔥 Максимально сложно'}
                     </div>
                  </div>
               </div>

               <div className={styles.formGroup}>
                  <label>Комментарий (опционально)</label>
                  <textarea
                     value={comment}
                     onChange={(e) => setComment(e.target.value)}
                     placeholder="Расскажите о выполненном задании, возникших сложностях или достижениях..."
                     rows={4}
                  />
               </div>

               <div className={styles.actions}>
                  <button type="button" onClick={onClose} className={styles.cancelBtn}>
                     Отмена
                  </button>
                  <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                     {isSubmitting ? 'Отправка...' : '✅ Подтвердить выполнение'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default TaskCompleteModal;