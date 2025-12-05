import React, { useState } from 'react';
import NoteList from '../Components/NoteList';
import NoteForm from '../Forms/NoteForm';
import styles from './NotesPage.module.css';

const NotesPage = () => {
   const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);

   const openNoteForm = () => setIsNoteFormOpen(true);
   const closeNoteForm = () => setIsNoteFormOpen(false);

   return (
      <div className={styles.notesPage}>
         <header className={styles.pageHeader}>
            <div className={styles.headerContent}>
               <h1>Мои заметки</h1>
               <p>Управляйте вашими персональными записями</p>
            </div>
            <button className={styles.addNoteButton} onClick={openNoteForm}>
               <span>+</span>
               Новая заметка
            </button>
         </header>

         <div className={styles.notesContent}>
            <NoteList />
         </div>

         {isNoteFormOpen && (
            <NoteForm
               isOpen={isNoteFormOpen}
               onClose={closeNoteForm}
               isEdit={false}
            />
         )}
      </div>
   );
};

export default NotesPage;