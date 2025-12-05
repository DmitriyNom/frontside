import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import { createNote, updateNote, selectLoading, selectError, clearError } from '../../features/notesSlice';
import styles from './NoteForm.module.css';

// Маппинг для приоритета
const REVERSE_PRIORITY_MAP = { low: 1, medium: 2, high: 3 };

Modal.setAppElement('#root');

const NoteForm = ({ isOpen, onClose, note = null, isEdit = false }) => {
   const dispatch = useDispatch();
   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);

   const [form, setForm] = useState({
      note_name: '',
      note_description: '',
      note_priority: 'low',
      note_mark: '',
      note_is_completed: false,
      note_expiration_date: ''
   });

   useEffect(() => {
      if (isEdit && note) {
         console.log('Editing note:', note);
         // Заполняем форму данными из пропса note (для редактирования)
         setForm({
            note_name: note.note_name || '',
            note_description: note.note_description || '',
            note_priority: getPriorityString(note.note_priority) || 'low',
            note_mark: note.note_mark || '',
            note_is_completed: note.note_is_completed || false,
            note_expiration_date: note.note_expiration_date
               ? formatDateForInput(note.note_expiration_date)
               : ''
         });
      } else {
         console.log('Creating new note - resetting form');
         // Сбрасываем форму для создания новой заметки
         setForm({
            note_name: '',
            note_description: '',
            note_priority: 'low',
            note_mark: '',
            note_is_completed: false,
            note_expiration_date: ''
         });
      }
   }, [isEdit, note]); // Зависимость от note и isEdit

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
         // Проверяем, что дата валидна
         if (isNaN(date.getTime())) return '';
         return date.toISOString().slice(0, 16);
      } catch (error) {
         console.error('Error formatting date:', error);
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

   const handleSubmit = async (e) => {
      e.preventDefault();

      // Простая валидация
      if (!form.note_name.trim()) {
         alert('Название заметки обязательно!');
         return;
      }

      // 👇 ИСПРАВЛЕНИЕ: Правильно подготавливаем данные для отправки
      const noteData = {
         note_name: form.note_name.trim(),
         note_description: form.note_description.trim(),
         note_priority: REVERSE_PRIORITY_MAP[form.note_priority],
         note_mark: form.note_mark.trim(),
         note_is_completed: form.note_is_completed,
         // 👇 Важно: отправляем null если дата пустая, иначе преобразуем в ISO строку
         note_expiration_date: form.note_expiration_date
            ? new Date(form.note_expiration_date).toISOString()
            : null
      };

      console.log('Submitting note data:', noteData);

      try {
         if (isEdit && note?.id) {
            await dispatch(updateNote({ id: note.id, noteData }));
         } else {
            await dispatch(createNote(noteData));
         }
         onClose();
      } catch (error) {
         console.error('Error submitting form:', error);
      }
   };

   const getPriorityColor = (priority) => {
      switch (priority) {
         case 'low': return styles.priorityLow;
         case 'medium': return styles.priorityMedium;
         case 'high': return styles.priorityHigh;
         default: return '';
      }
   };

   return (
      <Modal
         isOpen={isOpen}
         onRequestClose={onClose}
         className={styles.modal}
         overlayClassName={styles.overlay}
         contentLabel={isEdit ? 'Редактировать заметку' : 'Создать заметку'}
      >
         <div className={styles.modalHeader}>
            <h2>{isEdit ? 'Редактировать заметку' : 'Новая заметка'}</h2>
            <button
               className={styles.closeButton}
               onClick={onClose}
               disabled={loading}
            >
               ×
            </button>
         </div>

         <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
               <label className={styles.label}>
                  Название заметки
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
                  placeholder="Введите название заметки"
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
                  placeholder="Опишите вашу заметку..."
                  rows="4"
               />
            </div>

            {/* Новые поля - Начало */}
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
                  <label className={styles.label}>Срок выполнения</label>
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
               <label className={styles.label}>Заметка выполнена</label>
               {/* Toggle-кнопка для статуса выполнения */}
               <button
                  type="button"
                  className={`${styles.toggleButton} ${form.note_is_completed ? styles.toggleActive : styles.toggleInactive}`}
                  onClick={() => setForm(prev => ({ ...prev, note_is_completed: !prev.note_is_completed }))}
                  disabled={loading}
               >
                  {form.note_is_completed ? '✓ Выполнена' : '✗ Не выполнена'}
               </button>
            </div>
            {/* Новые поля - Конец */}

            <div className={styles.formGroup}>
               <label className={styles.label}>Пометка</label>
               <input
                  type="text"
                  name="note_mark"
                  value={form.note_mark}
                  onChange={handleChange}
                  disabled={loading}
                  className={styles.input}
                  placeholder="Метка, тег..."
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
                  onClick={onClose}
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
   );
};

export default NoteForm;