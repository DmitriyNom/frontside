// src/UI/Forms/NoteForm.jsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createNote, updateNote, selectLoading, selectError, clearError } from '../../features/notesSlice';
import { selectUser } from '../../features/authSlice';
import UserSelector from '../Components/UserSelector';
import FileUploadModal from '../Components/FileUploadModal';
import MiniMediaGallery from '../Components/MiniMediaGallery';
import styles from './NoteForm.module.css';

const REVERSE_PRIORITY_MAP = { low: 1, medium: 2, high: 3 };
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5];

Modal.setAppElement('#root');

const NoteForm = ({ isOpen, onClose, note = null, isEdit = false }) => {
   const dispatch = useDispatch();
   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);
   const currentUser = useSelector(selectUser);
   const isTrainer = currentUser?.role === 'trainer';

   // Состояния
   const [noteType, setNoteType] = useState('personal_note');
   const [form, setForm] = useState({
      note_name: '',
      note_description: '',
      note_priority: 'low',
      note_mark: '',
      note_is_completed: false,
      note_expiration_date: '',
      // Поля для заданий
      planned_date: '',
      planned_time: '',
      duration_minutes: '',
      difficulty_rating: 3,
      assigned_to_user_id: null
   });
   const [selectedUser, setSelectedUser] = useState(null);
   const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
   const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
   const [uploadedMedia, setUploadedMedia] = useState([]);
   const [mediaIds, setMediaIds] = useState([]);

   // Загрузка данных при редактировании
   useEffect(() => {
      if (isEdit && note) {
         setNoteType(note.note_type || 'personal_note');
         setForm({
            note_name: note.note_name || '',
            note_description: note.note_description || '',
            note_priority: getPriorityString(note.note_priority) || 'low',
            note_mark: note.note_mark || '',
            note_is_completed: note.note_is_completed || false,
            note_expiration_date: note.note_expiration_date
               ? formatDateForInput(note.note_expiration_date)
               : '',
            // Поля для заданий
            planned_date: note.planned_date || '',
            planned_time: note.planned_time || '',
            duration_minutes: note.duration_minutes || '',
            difficulty_rating: note.difficulty_rating || 3,
            assigned_to_user_id: note.assigned_to_user_id || null
         });

         // Если есть назначенный пользователь, загружаем его данные
         if (note.assigned_to_user_id && note.assigned_to) {
            setSelectedUser(note.assigned_to);
         }

         // Если есть медиа
         if (note.media && note.media.length > 0) {
            setUploadedMedia(note.media);
            setMediaIds(note.media.map(m => m.id));
         }
      } else {
         resetForm();
      }
   }, [isEdit, note]);

   // Сброс формы
   const resetForm = () => {
      setNoteType('personal_note');
      setForm({
         note_name: '',
         note_description: '',
         note_priority: 'low',
         note_mark: '',
         note_is_completed: false,
         note_expiration_date: '',
         planned_date: '',
         planned_time: '',
         duration_minutes: '',
         difficulty_rating: 3,
         assigned_to_user_id: null
      });
      setSelectedUser(null);
      setUploadedMedia([]);
      setMediaIds([]);
   };

   // Закрытие с очисткой
   const handleClose = () => {
      if (!loading) {
         resetForm();
         onClose();
      }
   };

   const getPriorityString = (priority) => {
      switch (priority) {
         case 1: return 'low';
         case 2: return 'medium';
         case 3: return 'high';
         default: return 'low';
      }
   };

   const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
         const date = new Date(dateString);
         if (isNaN(date.getTime())) return '';
         return date.toISOString().slice(0, 16);
      } catch (error) {
         return '';
      }
   };

   const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setForm(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : value,
      }));
      if (error) dispatch(clearError());
   };

   // Выбор пользователя
   const handleUserSelect = (user) => {
      setSelectedUser(user);
      setForm(prev => ({
         ...prev,
         assigned_to_user_id: user.id
      }));
      setIsUserSelectorOpen(false);
   };

   // Удаление выбранного пользователя
   const handleRemoveUser = () => {
      setSelectedUser(null);
      setForm(prev => ({
         ...prev,
         assigned_to_user_id: null
      }));
   };

   // Обработка загруженных медиа
   const handleMediaUploaded = (mediaData) => {
      setUploadedMedia(prev => [...prev, ...mediaData]);
      setMediaIds(prev => [...prev, ...mediaData.map(m => m.id)]);
   };

   // Удаление медиа из списка
   const handleRemoveMedia = (mediaId) => {
      setUploadedMedia(prev => prev.filter(m => m.id !== mediaId));
      setMediaIds(prev => prev.filter(id => id !== mediaId));
   };

   const validateForm = () => {
      if (!form.note_name.trim()) {
         toast.error('Название обязательно!');
         return false;
      }

      // Валидация для заданий
      if (noteType !== 'personal_note') {
         if (!form.planned_date) {
            toast.error('Укажите дату выполнения!');
            return false;
         }
         if (!form.duration_minutes || form.duration_minutes < 1) {
            toast.error('Укажите длительность (минимум 1 минута)!');
            return false;
         }
      }

      // Валидация для тренерских заданий
      if (noteType === 'trainer_assignment') {
         if (!selectedUser) {
            toast.error('Выберите спортсмена!');
            return false;
         }
      }

      return true;
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      // Базовая структура заметки
      const noteData = {
         note_name: form.note_name.trim(),
         note_description: form.note_description.trim(),
         note_priority: REVERSE_PRIORITY_MAP[form.note_priority],
         note_mark: form.note_mark.trim(),
         note_is_completed: form.note_is_completed,
         note_expiration_date: form.note_expiration_date
            ? new Date(form.note_expiration_date).toISOString()
            : null,
         note_type: noteType
      };

      // Добавляем поля для заданий
      if (noteType !== 'personal_note') {
         // 🔧 ИСПРАВЛЕНО: дата и время раздельно
         const plannedDateOnly = form.planned_date; // YYYY-MM-DD
         const plannedTimeOnly = form.planned_time || null; // HH:MM

         Object.assign(noteData, {
            planned_date: plannedDateOnly,     // Только дата
            planned_time: plannedTimeOnly,     // Время отдельно
            duration_minutes: parseInt(form.duration_minutes),
            difficulty_rating: parseInt(form.difficulty_rating),
            status: 'active'
         });
      }

      // Добавляем назначенного пользователя для тренерских заданий
      if (noteType === 'trainer_assignment' && selectedUser) {
         Object.assign(noteData, {
            assigned_to_user_id: selectedUser.id,
            assigned_by_user_id: currentUser.id
         });
      }

      // Добавляем медиа
      if (mediaIds.length > 0) {
         noteData.mediaIds = mediaIds;
      }

      // Лог для отладки
      console.log('📤 Sending noteData:', noteData);

      try {
         if (isEdit && note?.id) {
            await dispatch(updateNote({ id: note.id, noteData })).unwrap();
            toast.success('Заметка успешно обновлена!');
         } else {
            await dispatch(createNote(noteData)).unwrap();
            toast.success('Заметка успешно создана!');
         }
         handleClose();

      } catch (error) {
         toast.error(error.message || 'Произошла ошибка при сохранении');
      }
   };

   // Рендер переключателя типов
   const renderTypeSelector = () => (
      <div className={styles.typeSelector}>
         <button
            type="button"
            className={`${styles.typeButton} ${noteType === 'personal_note' ? styles.typeActive : ''}`}
            onClick={() => setNoteType('personal_note')}
            disabled={loading}
         >
            📝 Личная заметка
         </button>
         <button
            type="button"
            className={`${styles.typeButton} ${noteType === 'self_assignment' ? styles.typeActive : ''}`}
            onClick={() => setNoteType('self_assignment')}
            disabled={loading}
         >
            🎯 Личное задание
         </button>
         {isTrainer && (
            <button
               type="button"
               className={`${styles.typeButton} ${noteType === 'trainer_assignment' ? styles.typeActive : ''}`}
               onClick={() => setNoteType('trainer_assignment')}
               disabled={loading}
            >
               🏋️ Тренерское задание
            </button>
         )}
      </div>
   );

   // Рендер полей задания
   const renderAssignmentFields = () => (
      <>
         <div className={styles.formRow}>
            <div className={styles.formGroup}>
               <label className={styles.label}>
                  Дата выполнения
                  <span className={styles.required}>*</span>
               </label>
               <input
                  type="date"
                  name="planned_date"
                  value={form.planned_date}
                  onChange={handleChange}
                  disabled={loading}
                  className={styles.input}
                  min={new Date().toISOString().split('T')[0]}
               />
            </div>

            <div className={styles.formGroup}>
               <label className={styles.label}>Время (опционально)</label>
               <input
                  type="time"
                  name="planned_time"
                  value={form.planned_time}
                  onChange={handleChange}
                  disabled={loading}
                  className={styles.input}
               />
            </div>
         </div>

         <div className={styles.formRow}>
            <div className={styles.formGroup}>
               <label className={styles.label}>
                  Длительность (минуты)
                  <span className={styles.required}>*</span>
               </label>
               <input
                  type="number"
                  name="duration_minutes"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  disabled={loading}
                  className={styles.input}
                  min="1"
                  max="1440"
                  placeholder="Например: 60"
               />
            </div>

            <div className={styles.formGroup}>
               <label className={styles.label}>Сложность</label>
               <div className={styles.difficultySelector}>
                  {DIFFICULTY_OPTIONS.map(rating => (
                     <button
                        key={rating}
                        type="button"
                        className={`${styles.difficultyButton} ${form.difficulty_rating === rating ? styles.difficultyActive : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, difficulty_rating: rating }))}
                        disabled={loading}
                     >
                        {rating} ★
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </>
   );

   // Рендер выбора спортсмена (для тренера)
   const renderTraineeSelector = () => (
      <div className={styles.formGroup}>
         <label className={styles.label}>
            Спортсмен
            <span className={styles.required}>*</span>
         </label>
         {selectedUser ? (
            <div className={styles.selectedUser}>
               <div className={styles.userInfo}>
                  <img
                     src={selectedUser.userAvatar || '/default-avatar.png'}
                     alt={selectedUser.userName}
                     className={styles.userAvatar}
                  />
                  <span>{selectedUser.userName}</span>
               </div>
               <button
                  type="button"
                  className={styles.removeUserButton}
                  onClick={handleRemoveUser}
                  disabled={loading}
               >
                  ✕
               </button>
            </div>
         ) : (
            <button
               type="button"
               className={styles.selectUserButton}
               onClick={() => setIsUserSelectorOpen(true)}
               disabled={loading}
            >
               👤 Выбрать спортсмена
            </button>
         )}
      </div>
   );

   // Рендер медиа секции
   const renderMediaSection = () => (
      <div className={styles.mediaSection}>
         <div className={styles.mediaHeader}>
            <label className={styles.label}>Медиафайлы</label>
            <button
               type="button"
               className={styles.addMediaButton}
               onClick={() => setIsFileUploadOpen(true)}
               disabled={loading}
            >
               📎 Прикрепить
            </button>
         </div>
         {uploadedMedia.length > 0 && (
            <MiniMediaGallery
               media={uploadedMedia}
               onRemove={handleRemoveMedia}
               removable={!loading}
            />
         )}
      </div>
   );

   const getPriorityColor = (priority) => {
      switch (priority) {
         case 'low': return styles.priorityLow;
         case 'medium': return styles.priorityMedium;
         case 'high': return styles.priorityHigh;
         default: return '';
      }
   };

   return (
      <>
         <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            className={styles.modal}
            overlayClassName={styles.overlay}
            contentLabel={isEdit ? 'Редактировать заметку' : 'Создать заметку'}
         >
            <div className={styles.modalHeader}>
               <h2>{isEdit ? 'Редактировать заметку' : 'Новая заметка'}</h2>
               <button
                  className={styles.closeButton}
                  onClick={handleClose}
                  disabled={loading}
               >
                  ×
               </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
               {/* Переключатель типов (только для создания) */}
               {!isEdit && renderTypeSelector()}

               {/* Основные поля */}
               <div className={styles.formGroup}>
                  <label className={styles.label}>
                     Название
                     <span className={styles.required}>*</span>
                  </label>
                  <input
                     type="text"
                     name="note_name"
                     value={form.note_name}
                     onChange={handleChange}
                     required
                     disabled={loading}
                     className={styles.input}
                     placeholder="Введите название"
                  />
               </div>

               <div className={styles.formGroup}>
                  <label className={styles.label}>Описание</label>
                  <textarea
                     name="note_description"
                     value={form.note_description}
                     onChange={handleChange}
                     disabled={loading}
                     className={styles.textarea}
                     placeholder="Опишите заметку или задание..."
                     rows="4"
                  />
               </div>

               {/* Поля для заданий (для self_assignment и trainer_assignment) */}
               {noteType !== 'personal_note' && renderAssignmentFields()}

               {/* Выбор спортсмена (только для тренерских заданий) */}
               {noteType === 'trainer_assignment' && renderTraineeSelector()}

               {/* Медиа */}
               {renderMediaSection()}

               {/* Остальные поля */}
               <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                     <label className={styles.label}>Приоритет</label>
                     <div className={styles.selectWrapper}>
                        <select
                           name="note_priority"
                           value={form.note_priority}
                           onChange={handleChange}
                           disabled={loading}
                           className={`${styles.select} ${getPriorityColor(form.note_priority)}`}
                        >
                           <option value="low">🟢 Низкий</option>
                           <option value="medium">🟡 Средний</option>
                           <option value="high">🔴 Высокий</option>
                        </select>
                        <div className={styles.selectArrow}>▼</div>
                     </div>
                  </div>

                  <div className={styles.formGroup}>
                     <label className={styles.label}>Срок выполнения (дедлайн)</label>
                     <input
                        type="datetime-local"
                        name="note_expiration_date"
                        value={form.note_expiration_date}
                        onChange={handleChange}
                        disabled={loading}
                        className={styles.input}
                        min={new Date().toISOString().slice(0, 16)}
                     />
                  </div>
               </div>

               <div className={styles.formGroup}>
                  <label className={styles.label}>Выполнено</label>
                  <button
                     type="button"
                     className={`${styles.toggleButton} ${form.note_is_completed ? styles.toggleActive : styles.toggleInactive}`}
                     onClick={() => setForm(prev => ({ ...prev, note_is_completed: !prev.note_is_completed }))}
                     disabled={loading}
                  >
                     {form.note_is_completed ? '✓ Выполнена' : '✗ Не выполнена'}
                  </button>
               </div>

               <div className={styles.formGroup}>
                  <label className={styles.label}>Метка</label>
                  <input
                     type="text"
                     name="note_mark"
                     value={form.note_mark}
                     onChange={handleChange}
                     disabled={loading}
                     className={styles.input}
                     placeholder="Тег для группировки"
                  />
               </div>

               {error && (
                  <div className={styles.errorContainer}>
                     <span className={styles.errorIcon}>⚠️</span>
                     <span className={styles.error}>{error}</span>
                  </div>
               )}

               <div className={styles.actions}>
                  <button
                     type="button"
                     onClick={handleClose}
                     disabled={loading}
                     className={styles.cancelButton}
                  >
                     Отмена
                  </button>
                  <button
                     type="submit"
                     disabled={loading}
                     className={styles.submitButton}
                  >
                     {loading ? (
                        <>
                           <div className={styles.spinner}></div>
                           {isEdit ? 'Обновление...' : 'Создание...'}
                        </>
                     ) : (
                        isEdit ? '💾 Обновить' : '✨ Создать'
                     )}
                  </button>
               </div>
            </form>
         </Modal>

         {/* Модалка выбора спортсмена */}
         <UserSelector
            isOpen={isUserSelectorOpen}
            onClose={() => setIsUserSelectorOpen(false)}
            onSelect={handleUserSelect}
            selectedUserId={selectedUser?.id}
            title="Выберите спортсмена"
            excludeIds={[currentUser?.id]}
         />

         {/* Модалка загрузки файлов */}
         <FileUploadModal
            isOpen={isFileUploadOpen}
            onClose={() => setIsFileUploadOpen(false)}
            onUploadComplete={handleMediaUploaded}
            multiple={true}
            maxFiles={5}
            entityType="note"
         />
      </>
   );
};

export default NoteForm;