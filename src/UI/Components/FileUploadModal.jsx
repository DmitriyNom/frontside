import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
   uploadMedia,
   fetchUserMedia,
   clearMediaError,
   setUploadProgress
} from '../../features/mediaSlice';
import FileUploader from './FileUploader';
import styles from './FileUploadModal.module.css';

const FileUploadModal = ({ isOpen, onClose, onSuccess }) => {
   const dispatch = useDispatch();
   const { isUploading, error, uploadProgress } = useSelector((state) => state.media);

   const [selectedFiles, setSelectedFiles] = useState([]);
   const [privacy, setPrivacy] = useState('private');
   const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'success', 'partial', 'error'
   const [showFilesDetails, setShowFilesDetails] = useState(false);

   const resetState = () => {
      setSelectedFiles([]);
      setPrivacy('private');
      setUploadStatus('');
      setShowFilesDetails(false);
      dispatch(clearMediaError());
      dispatch(setUploadProgress(0));
   };

   const handleClose = () => {
      if (!isUploading || uploadStatus === 'success' || uploadStatus === 'partial') {
         resetState();
         onClose();
      }
   };

   const handleUpload = async () => {
      if (selectedFiles.length === 0) return;

      setUploadStatus('uploading');

      try {
         // Загружаем файлы параллельно с Promise.allSettled
         const uploadPromises = selectedFiles.map(file =>
            dispatch(uploadMedia({ file, privacy })).unwrap()
         );

         const results = await Promise.allSettled(uploadPromises);

         const successful = results.filter(r => r.status === 'fulfilled').length;
         const failed = results.filter(r => r.status === 'rejected').length;

         // Обновляем список медиа
         await dispatch(fetchUserMedia()).unwrap();

         if (failed === 0) {
            // Все файлы загружены успешно
            setUploadStatus('success');
            setTimeout(() => {
               resetState();
               onSuccess?.();
               onClose();
            }, 1000);
         } else if (successful > 0) {
            // Частичный успех
            setUploadStatus('partial');
            setTimeout(() => {
               resetState();
               onSuccess?.();
               onClose();
            }, 1500);
         } else {
            // Все файлы с ошибкой
            setUploadStatus('error');
         }

      } catch (uploadError) {
         console.error('❌ Upload failed:', uploadError);
         setUploadStatus('error');
         setTimeout(() => {
            setUploadStatus('');
            dispatch(clearMediaError());
         }, 3000);
      }
   };

   if (!isOpen) return null;

   return (
      <div className={styles.modalOverlay} onClick={handleClose}>
         <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
               <h2>Загрузка файлов</h2>
               <button
                  className={styles.closeButton}
                  onClick={handleClose}
                  disabled={isUploading && uploadStatus !== 'success' && uploadStatus !== 'partial'}
               >
                  ×
               </button>
            </div>

            <div className={styles.modalBody}>
               {/* Состояние успеха */}
               {uploadStatus === 'success' && (
                  <div className={styles.stateMessage}>
                     <div className={`${styles.stateIcon} ${styles.successIcon}`}>
                        <div className={styles.checkmark}>✓</div>
                     </div>
                     <h3 className={styles.stateTitle}>Готово!</h3>
                     <p className={styles.stateText}>Все файлы успешно загружены</p>
                  </div>
               )}

               {/* Состояние частичного успеха */}
               {uploadStatus === 'partial' && (
                  <div className={styles.stateMessage}>
                     <div className={`${styles.stateIcon} ${styles.partialIcon}`}>
                        ⚠️
                     </div>
                     <h3 className={styles.stateTitle}>Загружено частично</h3>
                     <p className={styles.stateText}>Некоторые файлы не удалось загрузить</p>
                  </div>
               )}

               {/* Основной интерфейс загрузки */}
               {(uploadStatus !== 'success' && uploadStatus !== 'partial') && (
                  <>
                     {/* Загрузчик файлов */}
                     <FileUploader
                        onFilesSelected={setSelectedFiles}
                        maxFiles={10}
                        maxSizeMB={100}
                        disabled={isUploading}
                     />

                     {/* Настройки загрузки */}
                     {selectedFiles.length > 0 && (
                        <div className={styles.uploadSettings}>
                           <h3>Настройки загрузки</h3>

                           <div className={styles.settingGroup}>
                              <label className={styles.settingLabel}>
                                 Видимость файлов:
                              </label>
                              <div className={styles.radioGroup}>
                                 <label className={styles.radioOption}>
                                    <input
                                       type="radio"
                                       value="private"
                                       checked={privacy === 'private'}
                                       onChange={(e) => setPrivacy(e.target.value)}
                                       disabled={isUploading}
                                    />
                                    <span className={styles.radioLabel}>
                                       <strong>Приватный</strong>
                                       <small>Только вы и пользователи с доступом</small>
                                    </span>
                                 </label>

                                 <label className={styles.radioOption}>
                                    <input
                                       type="radio"
                                       value="public"
                                       checked={privacy === 'public'}
                                       onChange={(e) => setPrivacy(e.target.value)}
                                       disabled={isUploading}
                                    />
                                    <span className={styles.radioLabel}>
                                       <strong>Публичный</strong>
                                       <small>Доступен по прямой ссылке</small>
                                    </span>
                                 </label>
                              </div>
                           </div>

                           {/* Сворачиваемый список файлов */}
                           <div className={styles.selectedFilesSection}>
                              <div
                                 className={styles.filesHeader}
                                 onClick={() => setShowFilesDetails(!showFilesDetails)}
                              >
                                 <div className={styles.filesCount}>
                                    <span className={styles.countBadge}>{selectedFiles.length}</span>
                                    <span>файл(ов) выбрано</span>
                                 </div>
                                 <span className={styles.toggleIcon}>
                                    {showFilesDetails ? '▲' : '▼'}
                                 </span>
                              </div>

                              {showFilesDetails && (
                                 <div className={styles.filesListContainer}>
                                    <ul className={styles.filesList}>
                                       {selectedFiles.map((file, index) => (
                                          <li key={index} className={styles.fileItem}>
                                             <span className={styles.fileIcon}>
                                                {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                             </span>
                                             <span className={styles.fileName} title={file.name}>
                                                {file.name.length > 30
                                                   ? file.name.substring(0, 30) + '...'
                                                   : file.name}
                                             </span>
                                             <span className={styles.fileSize}>
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                             </span>
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                              )}
                           </div>

                           {/* Прогресс загрузки с анимацией */}
                           {isUploading && (
                              <div className={styles.uploadProgress}>
                                 <div className={styles.progressHeader}>
                                    <span className={styles.progressTitle}>Загрузка...</span>
                                    <span className={styles.progressPercent}>{uploadProgress}%</span>
                                 </div>

                                 <div className={styles.progressBar}>
                                    <div
                                       className={styles.progressFill}
                                       style={{ width: `${uploadProgress}%` }}
                                    >
                                       <div className={styles.progressAnimation}></div>
                                    </div>
                                 </div>

                                 <div className={styles.progressText}>
                                    {uploadProgress < 30 && 'Подготовка к загрузке...'}
                                    {uploadProgress >= 30 && uploadProgress < 80 && 'Загрузка файлов...'}
                                    {uploadProgress >= 80 && 'Обработка завершается...'}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </>
               )}

               {/* Сообщение об ошибке */}
               {error && uploadStatus === 'error' && (
                  <div className={styles.errorMessage}>
                     <div className={styles.errorIcon}>⚠️</div>
                     <div className={styles.errorContent}>
                        <h4>Ошибка загрузки</h4>
                        <p>{error}</p>
                     </div>
                  </div>
               )}
            </div>

            <div className={styles.modalFooter}>
               <button
                  className={styles.cancelButton}
                  onClick={handleClose}
                  disabled={isUploading && uploadStatus !== 'success' && uploadStatus !== 'partial'}
               >
                  {uploadStatus === 'success' || uploadStatus === 'partial' ? 'Закрыть' : 'Отмена'}
               </button>

               {uploadStatus !== 'success' && uploadStatus !== 'partial' && (
                  <button
                     className={styles.uploadButton}
                     onClick={handleUpload}
                     disabled={selectedFiles.length === 0 || isUploading}
                  >
                     {isUploading ? (
                        <>
                           <span className={styles.spinner}></span>
                           Загрузка {selectedFiles.length} файл(ов)...
                        </>
                     ) : (
                        `Загрузить ${selectedFiles.length} файл(ов)`
                     )}
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};

export default FileUploadModal;