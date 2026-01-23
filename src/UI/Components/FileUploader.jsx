// src/UI/Components/FileUploader.jsx
import React, { useCallback, useState, useRef } from 'react';
import styles from './FileUploader.module.css';

const FileUploader = ({ onFilesSelected, maxFiles = 10, maxSizeMB = 100 }) => {
   const [selectedFiles, setSelectedFiles] = useState([]);
   const [dragActive, setDragActive] = useState(false);
   const [error, setError] = useState('');

   const maxSizeBytes = maxSizeMB * 1024 * 1024;

   // Используем useRef для сохранения текущих selectedFiles
   const selectedFilesRef = useRef();
   selectedFilesRef.current = selectedFiles;

   // Выносим validateFiles в useCallback
   const validateFiles = useCallback((files) => {
      const newFiles = Array.from(files);
      let totalSize = 0;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

      // Проверка количества файлов
      if (selectedFilesRef.current.length + newFiles.length > maxFiles) {
         setError(`Максимум ${maxFiles} файлов`);
         return false;
      }

      // Проверка каждого файла
      for (const file of newFiles) {
         // Проверка типа
         if (!allowedTypes.includes(file.type)) {
            setError(`Неподдерживаемый формат: ${file.name}`);
            return false;
         }

         // Проверка размера
         if (file.size > maxSizeBytes) {
            setError(`Файл ${file.name} превышает ${maxSizeMB}MB`);
            return false;
         }

         totalSize += file.size;
      }

      // Проверка общего размера (опционально)
      if (totalSize > maxSizeBytes * 3) {
         setError('Общий размер файлов слишком велик');
         return false;
      }

      setError('');
      return true;
   }, [maxFiles, maxSizeBytes, maxSizeMB]);

   // Обработчик выбора файлов через input
   const handleFileChange = (e) => {
      const files = e.target.files;
      if (!files.length) return;

      if (validateFiles(files)) {
         const updatedFiles = [...selectedFiles, ...Array.from(files)];
         setSelectedFiles(updatedFiles);
         onFilesSelected(updatedFiles);
      }
   };

   // Drag & drop обработчики
   const handleDrag = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
         setDragActive(true);
      } else if (e.type === 'dragleave') {
         setDragActive(false);
      }
   }, []);

   const handleDrop = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files.length) {
         if (validateFiles(files)) {
            const updatedFiles = [...selectedFilesRef.current, ...Array.from(files)];
            setSelectedFiles(updatedFiles);
            onFilesSelected(updatedFiles);
         }
      }
   }, [validateFiles, onFilesSelected]);

   // Удаление файла из списка
   const removeFile = (index) => {
      const newFiles = [...selectedFiles];
      newFiles.splice(index, 1);
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
      setError('');
   };

   // Очистка всех файлов
   const clearAll = () => {
      setSelectedFiles([]);
      onFilesSelected([]);
      setError('');
   };

   // Форматирование размера файла
   const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
   };

   // Получение иконки для типа файла
   const getFileIcon = (file) => {
      if (file.type.startsWith('image/')) return '🖼️';
      if (file.type.startsWith('video/')) return '🎥';
      return '📄';
   };

   return (
      <div className={styles.container}>
         {/* Drag & drop зона */}
         <div
            className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
         >
            <input
               type="file"
               id="file-upload"
               multiple
               accept="image/*,video/*"
               onChange={handleFileChange}
               className={styles.fileInput}
            />
            <label htmlFor="file-upload" className={styles.dropzoneLabel}>
               <div className={styles.uploadIcon}>📤</div>
               <p>Перетащите файлы сюда или</p>
               <span className={styles.browseButton}>Выберите файлы</span>
               <p className={styles.hint}>
                  Поддерживаются изображения и видео до {maxSizeMB}MB каждый
               </p>
            </label>
         </div>

         {/* Сообщение об ошибке */}
         {error && <div className={styles.error}>{error}</div>}

         {/* Список выбранных файлов */}
         {selectedFiles.length > 0 && (
            <div className={styles.fileList}>
               <div className={styles.fileListHeader}>
                  <span>Выбрано файлов: {selectedFiles.length}</span>
                  <button type="button" onClick={clearAll} className={styles.clearButton}>
                     Очистить все
                  </button>
               </div>

               {selectedFiles.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                     <div className={styles.fileInfo}>
                        <span className={styles.fileIcon}>{getFileIcon(file)}</span>
                        <div className={styles.fileDetails}>
                           <div className={styles.fileName}>{file.name}</div>
                           <div className={styles.fileMeta}>
                              {formatFileSize(file.size)} • {file.type.split('/')[1]}
                           </div>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className={styles.removeButton}
                        aria-label="Удалить файл"
                     >
                        ×
                     </button>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
};

export default FileUploader;