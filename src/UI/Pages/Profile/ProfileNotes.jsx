// src/UI/Pages/Profile/ProfileNotes.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectNotes } from '../../../features/notesSlice';
import NoteList from '../../Components/NoteList';
import NoteForm from '../../Forms/NoteForm';
import styles from './Profile.module.css';

// Плавающая кнопка для создания заметок
const FloatingCreateButton = ({ onClick, noteCount, isVisible }) => {
   return (
      <button
         className={`${styles.floatingButton} ${isVisible ? styles.visible : ''}`}
         onClick={onClick}
         title="Создать новую заметку"
      >
         <span className={styles.floatingButtonIcon}>+</span>
         <span className={styles.floatingButtonText}>Новая заметка</span>

         {/* Бейдж с количеством заметок */}
         {noteCount > 0 && (
            <span className={styles.noteCountBadge}>{noteCount}</span>
         )}
      </button>
   );
};

const ProfileNotes = ({ onOpenNoteForm }) => {
   const notes = useSelector(selectNotes);
   const [isFloatingButtonVisible, setIsFloatingButtonVisible] = useState(false);
   const tabHeaderRef = useRef(null);

   // Отслеживаем скролл окна браузера
   useEffect(() => {
      const handleScroll = () => {
         const scrollY = window.scrollY || document.documentElement.scrollTop;
         const scrollThreshold = 50;

         if (scrollY > scrollThreshold) {
            setIsFloatingButtonVisible(true);
         } else {
            setIsFloatingButtonVisible(false);
         }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();

      return () => {
         window.removeEventListener('scroll', handleScroll);
      };
   }, []);

   return (
      <div className={styles.notesTab}>
         <header
            className={styles.tabHeader}
            ref={tabHeaderRef}
         >
            <div className={styles.headerContent}>
               <h2>Мои заметки</h2>
               <p>Управляйте вашими персональными записями</p>
            </div>

            {/* Основная кнопка создания заметки */}
            <button
               className={`${styles.addNoteButton} ${isFloatingButtonVisible ? styles.headerButtonHidden : ''}`}
               onClick={onOpenNoteForm}
            >
               <span>+</span>
               Новая заметка
            </button>
         </header>
         <div className={styles.notesContent}>
            <NoteList />
         </div>

         {/* Плавающая кнопка создания заметки */}
         <FloatingCreateButton
            onClick={onOpenNoteForm}
            noteCount={notes?.length || 0}
            isVisible={isFloatingButtonVisible}
         />
      </div>
   );
};

export default ProfileNotes;