import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
   deleteMedia,
   updateMediaPrivacy,
   updateMedia
} from '../../features/mediaSlice';
import { getMediaUrl } from '../../api/api';
import ConfirmationModal from './ConfirmationModal';
import useFileNameValidation from '../../hooks/useFileNameValidation';
import styles from './MediaPreviewModal.module.css';

const MediaPreviewModal = ({ media, isOpen, onClose }) => {
   const dispatch = useDispatch();
   const mediaState = useSelector((state) => state.media);

   // Инициализация хука валидации
   const fileNameValidation = useFileNameValidation();

   const items = useMemo(() => mediaState.items, [mediaState.items]);
   const prevItemsRef = useRef([]);
   const isMountedRef = useRef(false);

   useEffect(() => {
      prevItemsRef.current = items;
   }, [items]);

   const [currentMedia, setCurrentMedia] = useState(media);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isEditing, setIsEditing] = useState(false);
   const [isDownloading, setIsDownloading] = useState(false);

   // Состояние для валидации в реальном времени
   const [validationState, setValidationState] = useState({
      errors: [],
      warnings: [],
      isTouched: false,
      characterCount: 0
   });

   // Получаем имя файла без расширения для инициализации
   const getInitialFilename = useCallback((mediaItem) => {
      if (!mediaItem?.original_filename) return '';
      const originalName = mediaItem.original_filename;
      const lastDotIndex = originalName.lastIndexOf('.');
      return lastDotIndex === -1 ? originalName : originalName.substring(0, lastDotIndex);
   }, []);

   const [editForm, setEditForm] = useState(() => ({
      filename: getInitialFilename(media),
      privacy: media?.privacy || 'private',
      allow_reshare: media?.allow_reshare || true,
      shared_with_friends: media?.shared_with_friends || false,
      shared_with_trainees: media?.shared_with_trainees || false,
   }));

   const [deleteModal, setDeleteModal] = useState({
      isOpen: false,
      mediaId: null,
      mediaName: ''
   });

   const [operationStatus, setOperationStatus] = useState({
      isInProgress: false,
      status: 'idle'
   });

   // Получаем оригинальное расширение файла
   const originalFileExtension = useMemo(() => {
      if (!currentMedia?.original_filename) return '';
      return fileNameValidation.getExtension(currentMedia.original_filename);
   }, [currentMedia, fileNameValidation]);

   // Функция для определения класса счетчика символов
   const getCharacterCounterClass = useCallback(() => {
      const count = validationState.characterCount;
      const maxLength = fileNameValidation.MAX_FILE_NAME_LENGTH;

      let className = styles.characterCounter;

      if (count > maxLength) {
         className += ` ${styles.overLimit}`;
      } else if (count > maxLength * 0.9) { // 90% от лимита
         className += ` ${styles.nearLimit}`;
      }

      return className;
   }, [validationState.characterCount, fileNameValidation.MAX_FILE_NAME_LENGTH]);

   // Функция для валидации в реальном времени
   const handleFilenameChange = useCallback((newFilename) => {
      if (!currentMedia) return;

      // Удаляем точки из ввода (чтобы нельзя было изменить расширение)
      const cleanedFilename = newFilename.replace(/\./g, '');

      const validationResult = fileNameValidation.validateLive(
         cleanedFilename,
         currentMedia.original_filename
      );

      setValidationState({
         errors: validationResult.liveErrors,
         warnings: validationResult.liveWarnings.map(w => w.message),
         isTouched: true,
         characterCount: cleanedFilename.length
      });
   }, [currentMedia, fileNameValidation]);

   // Обновляем editForm с валидацией - ИСПРАВЛЕННАЯ ВЕРСИЯ
   const handleFilenameInputChange = useCallback((e) => {
      const newFilename = e.target.value;

      // Удаляем точки из ввода
      const cleanedFilename = newFilename.replace(/\./g, '');

      // Обновляем состояние формы
      setEditForm(prev => ({
         ...prev,
         filename: cleanedFilename
      }));

      // Выполняем валидацию
      handleFilenameChange(cleanedFilename);
   }, [handleFilenameChange]);

   useEffect(() => {
      if (media && items.length > 0) {
         const index = items.findIndex(item => item.id === media.id);

         if (index >= 0) {
            setCurrentIndex(index);
            const foundMedia = items[index];
            setCurrentMedia(foundMedia);

            // Устанавливаем имя БЕЗ расширения
            const nameWithoutExt = getInitialFilename(foundMedia);
            setEditForm({
               filename: nameWithoutExt || '',
               privacy: foundMedia.privacy || 'private',
               allow_reshare: foundMedia.allow_reshare || true,
               shared_with_friends: foundMedia.shared_with_friends || false,
               shared_with_trainees: foundMedia.shared_with_trainees || false,
            });

            // Сбрасываем состояние валидации
            setValidationState({
               errors: [],
               warnings: [],
               isTouched: false,
               characterCount: nameWithoutExt?.length || 0
            });
         } else {
            setCurrentMedia(media);
            setCurrentIndex(0);
            const nameWithoutExt = getInitialFilename(media);
            setEditForm({
               filename: nameWithoutExt || '',
               privacy: media?.privacy || 'private',
               allow_reshare: media?.allow_reshare || true,
               shared_with_friends: media?.shared_with_friends || false,
               shared_with_trainees: media?.shared_with_trainees || false,
            });
         }
      }
   }, [media, items, getInitialFilename]);

   useEffect(() => {
      isMountedRef.current = true;
      return () => {
         isMountedRef.current = false;
      };
   }, []);

   const getLocalMediaUrl = useCallback((mediaItem) => {
      if (!mediaItem?.storage_url) return '';
      return getMediaUrl(mediaItem.storage_url);
   }, []);

   // 👇 ОБНОВЛЕННАЯ ФУНКЦИЯ: с интегрированной валидацией
   const handleSaveEdit = useCallback(async () => {
      if (!currentMedia || operationStatus.isInProgress) return;

      // Валидация имени файла с использованием хука
      // Передаем полное имя с расширением для валидации
      const fullFilename = `${editForm.filename}.${originalFileExtension}`;
      const validationResult = fileNameValidation.validate(
         fullFilename,
         currentMedia.original_filename
      );

      if (!validationResult.isValid) {
         // Показываем первую ошибку
         if (validationResult.errorMessages.length > 0) {
            toast.error(validationResult.errorMessages[0], {
               position: "top-right",
               autoClose: 3000,
            });
         }
         return;
      }

      // Если есть предупреждения, показываем их
      if (validationResult.warnings.length > 0) {
         validationResult.warningMessages.forEach(warning => {
            toast.warning(warning, {
               position: "top-right",
               autoClose: 2000,
            });
         });
      }

      setOperationStatus({ isInProgress: true, status: 'loading' });

      const loadingToastId = toast.info('Сохранение изменений...', {
         position: "top-right",
         autoClose: false,
         hideProgressBar: false,
         closeOnClick: false,
         pauseOnHover: true,
         draggable: false,
      });

      try {
         const promises = [];
         let hasChanges = false;

         // Проверяем, изменилось ли имя файла
         const sanitizedFilename = validationResult.correctedName || fullFilename;
         if (sanitizedFilename.trim() !== currentMedia.original_filename.trim()) {
            // Используем исправленное имя из валидации
            promises.push(
               dispatch(updateMedia({
                  mediaId: currentMedia.id,
                  updateData: { original_filename: sanitizedFilename.trim() }
               })).unwrap()
            );
            hasChanges = true;
         } else {
            promises.push(Promise.resolve(currentMedia));
         }

         // Проверяем, изменилась ли приватность
         if (editForm.privacy !== currentMedia.privacy) {
            promises.push(
               dispatch(updateMediaPrivacy({
                  mediaId: currentMedia.id,
                  privacy: editForm.privacy
               })).unwrap()
            );
            hasChanges = true;
         } else {
            promises.push(Promise.resolve(currentMedia));
         }

         if (!hasChanges) {
            toast.dismiss(loadingToastId);
            setIsEditing(false);
            return;
         }

         // Выполняем все запросы
         await Promise.all(promises);

         toast.dismiss(loadingToastId);

         // Определяем, что именно изменилось
         const filenameChanged = sanitizedFilename.trim() !== currentMedia.original_filename.trim();
         const privacyChanged = editForm.privacy !== currentMedia.privacy;

         let successMessage = 'Настройки сохранены';
         if (filenameChanged && privacyChanged) {
            successMessage = 'Файл переименован и приватность обновлена';
         } else if (filenameChanged) {
            successMessage = 'Файл успешно переименован';
         } else if (privacyChanged) {
            successMessage = 'Приватность обновлена';
         }

         toast.success(successMessage, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
         });

         // Локальное обновление
         const updatedMedia = { ...currentMedia };

         if (filenameChanged) {
            updatedMedia.original_filename = sanitizedFilename.trim();
         }

         if (privacyChanged) {
            updatedMedia.privacy = editForm.privacy;
         }

         setCurrentMedia(updatedMedia);
         setIsEditing(false);

         // Сбрасываем состояние валидации
         const nameWithoutExt = getInitialFilename(updatedMedia);
         setValidationState({
            errors: [],
            warnings: [],
            isTouched: false,
            characterCount: nameWithoutExt?.length || 0
         });

      } catch (error) {
         toast.dismiss(loadingToastId);

         // ИСПРАВЛЕННАЯ обработка ошибок - безопасная проверка
         const errorMessage = error?.message || error?.toString() || 'Неизвестная ошибка';
         const isUpdateMediaUnavailable =
            errorMessage.includes('404') ||
            errorMessage.includes('Not Found') ||
            errorMessage.includes('updateMedia');

         if (isUpdateMediaUnavailable) {
            // Если endpoint updateMedia не готов, пробуем только приватность
            toast.warning('Переименование временно недоступно. Обновлена только приватность.', {
               position: "top-right",
               autoClose: 4000,
            });

            // Пробуем обновить только приватность
            if (editForm.privacy !== currentMedia.privacy) {
               try {
                  await dispatch(updateMediaPrivacy({
                     mediaId: currentMedia.id,
                     privacy: editForm.privacy
                  })).unwrap();

                  setCurrentMedia(prev => ({
                     ...prev,
                     privacy: editForm.privacy
                  }));
               } catch (privacyError) {
                  const privacyErrorMessage = privacyError?.message || privacyError?.toString() || 'Неизвестная ошибка';
                  toast.error(`Не удалось обновить приватность: ${privacyErrorMessage}`, {
                     position: "top-right",
                     autoClose: 5000,
                  });
               }
            }
         } else {
            toast.error(`Не удалось сохранить изменения: ${errorMessage}`, {
               position: "top-right",
               autoClose: 5000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
            });
         }
      } finally {
         setOperationStatus({ isInProgress: false, status: 'idle' });
      }
   }, [currentMedia, dispatch, editForm, fileNameValidation, operationStatus.isInProgress, originalFileExtension, getInitialFilename]);

   const downloadWithFetch = useCallback(async (url, filename) => {
      try {
         const response = await fetch(url);
         if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`);
         }

         const blob = await response.blob();
         const blobUrl = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = blobUrl;
         link.download = filename;

         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(blobUrl);

         return true;
      } catch (error) {
         return false;
      }
   }, []);

   const downloadWithDirectLink = useCallback((url, filename) => {
      try {
         const link = document.createElement('a');
         link.href = url;
         link.download = filename;
         link.target = '_blank';
         link.rel = 'noopener noreferrer';
         link.setAttribute('download', filename);

         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);

         return true;
      } catch (error) {
         return false;
      }
   }, []);

   const handleDownload = useCallback(async () => {
      if (!currentMedia || isDownloading || operationStatus.isInProgress) return;

      setIsDownloading(true);
      setOperationStatus({ isInProgress: true, status: 'loading' });

      const url = getLocalMediaUrl(currentMedia);
      const filename = currentMedia.original_filename;

      if (!url) {
         toast.error('Не удалось получить ссылку на файл', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
         });
         setIsDownloading(false);
         setOperationStatus({ isInProgress: false, status: 'idle' });
         return;
      }

      const loadingToastId = toast.info('Начинаем скачивание файла...', {
         position: "top-right",
         autoClose: false,
         hideProgressBar: false,
         closeOnClick: false,
         pauseOnHover: true,
         draggable: false,
      });

      const fetchSuccess = await downloadWithFetch(url, filename);

      if (!fetchSuccess) {
         toast.update(loadingToastId, {
            render: 'Пробуем альтернативный метод...',
            type: toast.TYPE.INFO,
         });

         const directSuccess = downloadWithDirectLink(url, filename);

         if (!directSuccess) {
            toast.dismiss(loadingToastId);
            toast.error('Не удалось скачать файл. Попробуйте:\n1. Нажать правой кнопкой на файл и выбрать "Сохранить как"\n2. Или скопировать ссылку и открыть в новом окне', {
               position: "top-right",
               autoClose: 5000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
            });
            setIsDownloading(false);
            setOperationStatus({ isInProgress: false, status: 'idle' });
            return;
         }
      }

      toast.dismiss(loadingToastId);
      toast.success('Файл успешно скачан на ваше устройство', {
         position: "top-right",
         autoClose: 3000,
         hideProgressBar: false,
         closeOnClick: true,
         pauseOnHover: true,
         draggable: true,
      });

      setIsDownloading(false);
      setOperationStatus({ isInProgress: false, status: 'idle' });
   }, [currentMedia, isDownloading, getLocalMediaUrl, downloadWithFetch, downloadWithDirectLink, operationStatus.isInProgress]);

   const handleNext = useCallback(() => {
      if (items.length === 0) return;
      const nextIndex = (currentIndex + 1) % items.length;
      setCurrentIndex(nextIndex);
      const nextMedia = items[nextIndex];
      setCurrentMedia(nextMedia);

      // Устанавливаем имя БЕЗ расширения
      const nameWithoutExt = getInitialFilename(nextMedia);
      setEditForm({
         filename: nameWithoutExt || '',
         privacy: nextMedia.privacy || 'private',
         allow_reshare: nextMedia.allow_reshare || true,
         shared_with_friends: nextMedia.shared_with_friends || false,
         shared_with_trainees: nextMedia.shared_with_trainees || false,
      });

      setIsEditing(false);

      // Сбрасываем состояние валидации
      setValidationState({
         errors: [],
         warnings: [],
         isTouched: false,
         characterCount: nameWithoutExt?.length || 0
      });
   }, [items, currentIndex, getInitialFilename]);

   const handlePrevious = useCallback(() => {
      if (items.length === 0) return;
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      setCurrentIndex(prevIndex);
      const prevMedia = items[prevIndex];
      setCurrentMedia(prevMedia);

      // Устанавливаем имя БЕЗ расширения
      const nameWithoutExt = getInitialFilename(prevMedia);
      setEditForm({
         filename: nameWithoutExt || '',
         privacy: prevMedia.privacy || 'private',
         allow_reshare: prevMedia.allow_reshare || true,
         shared_with_friends: prevMedia.shared_with_friends || false,
         shared_with_trainees: prevMedia.shared_with_trainees || false,
      });

      setIsEditing(false);

      // Сбрасываем состояние валидации
      setValidationState({
         errors: [],
         warnings: [],
         isTouched: false,
         characterCount: nameWithoutExt?.length || 0
      });
   }, [items, currentIndex, getInitialFilename]);

   const handleDeleteClick = useCallback(() => {
      if (!currentMedia || operationStatus.isInProgress) return;

      setDeleteModal({
         isOpen: true,
         mediaId: currentMedia.id,
         mediaName: currentMedia.original_filename
      });
   }, [currentMedia, operationStatus.isInProgress]);

   const handleConfirmDelete = useCallback(async () => {
      if (!deleteModal.mediaId) return;

      setDeleteModal({ isOpen: false, mediaId: null, mediaName: '' });
      setOperationStatus({ isInProgress: true, status: 'loading' });

      const loadingToastId = toast.info('Удаляем файл...', {
         position: "top-right",
         autoClose: false,
         hideProgressBar: false,
         closeOnClick: false,
         pauseOnHover: true,
         draggable: false,
      });

      try {
         await dispatch(deleteMedia(deleteModal.mediaId)).unwrap();
         toast.dismiss(loadingToastId);

         const updatedItems = items.filter(item => item.id !== deleteModal.mediaId);

         if (updatedItems.length === 0) {
            toast.success('Файл успешно удален', {
               position: "top-right",
               autoClose: 2000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
            });

            setTimeout(() => {
               onClose();
            }, 2000);
         } else {
            const currentItemIndex = items.findIndex(item => item.id === deleteModal.mediaId);
            let newIndex = currentItemIndex;

            if (currentItemIndex >= updatedItems.length) {
               newIndex = updatedItems.length - 1;
            }

            if (updatedItems[newIndex]) {
               const newMedia = updatedItems[newIndex];
               setCurrentMedia(newMedia);
               setCurrentIndex(newIndex);

               // Устанавливаем имя БЕЗ расширения
               const nameWithoutExt = getInitialFilename(newMedia);
               setEditForm({
                  filename: nameWithoutExt || '',
                  privacy: newMedia.privacy || 'private',
                  allow_reshare: newMedia.allow_reshare || true,
                  shared_with_friends: newMedia.shared_with_friends || false,
                  shared_with_trainees: newMedia.shared_with_trainees || false,
               });
            }

            toast.success('Файл успешно удален', {
               position: "top-right",
               autoClose: 3000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
            });
         }

         setOperationStatus({ isInProgress: false, status: 'idle' });
      } catch (error) {
         toast.dismiss(loadingToastId);
         toast.error(error.message || 'Не удалось удалить файл. Попробуйте позже.', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
         });
         setOperationStatus({ isInProgress: false, status: 'idle' });
      }
   }, [deleteModal.mediaId, dispatch, items, onClose, getInitialFilename]);

   const handleCancelDelete = useCallback(() => {
      setDeleteModal({ isOpen: false, mediaId: null, mediaName: '' });
   }, []);

   // 👇 ОБНОВЛЕННАЯ ФУНКЦИЯ: с сбросом валидации
   const handleCancelEdit = useCallback(() => {
      // Устанавливаем имя БЕЗ расширения
      const nameWithoutExt = getInitialFilename(currentMedia);
      setEditForm({
         filename: nameWithoutExt || '',
         privacy: currentMedia.privacy || 'private',
         allow_reshare: currentMedia.allow_reshare || true,
         shared_with_friends: currentMedia.shared_with_friends || false,
         shared_with_trainees: currentMedia.shared_with_trainees || false,
      });

      setIsEditing(false);

      // Сбрасываем состояние валидации
      setValidationState({
         errors: [],
         warnings: [],
         isTouched: false,
         characterCount: nameWithoutExt?.length || 0
      });
   }, [currentMedia, getInitialFilename]);

   useEffect(() => {
      const handleKeyDown = (e) => {
         if (!isOpen) return;

         switch (e.key) {
            case 'Escape':
               if (isEditing) {
                  handleCancelEdit();
               } else {
                  onClose();
               }
               break;
            case 'ArrowLeft':
               handlePrevious();
               break;
            case 'ArrowRight':
               handleNext();
               break;
            default:
               break;
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [isOpen, isEditing, handlePrevious, handleNext, onClose, handleCancelEdit]);

   const formatDate = useCallback((dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('ru-RU', {
         day: 'numeric',
         month: 'long',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   }, []);

   const formatFileSize = useCallback((bytes) => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
   }, []);

   const handleCopyLink = useCallback(() => {
      if (!currentMedia || operationStatus.isInProgress) return;

      const mediaUrl = getLocalMediaUrl(currentMedia);
      if (!mediaUrl) {
         toast.error('Не удалось получить ссылку на файл', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
         });
         return;
      }

      navigator.clipboard.writeText(mediaUrl);
      toast.success('Ссылка на файл скопирована в буфер обмена', {
         position: "top-right",
         autoClose: 3000,
         hideProgressBar: false,
         closeOnClick: true,
         pauseOnHover: true,
         draggable: true,
      });
   }, [currentMedia, getLocalMediaUrl, operationStatus.isInProgress]);

   // Получаем CSS класс для поля ввода в зависимости от валидации
   const getInputClassName = useCallback(() => {
      const baseClass = styles.filenameInput;

      if (!validationState.isTouched) {
         return baseClass;
      }

      if (validationState.errors.length > 0) {
         return `${baseClass} ${styles.inputError}`;
      }

      if (validationState.warnings.length > 0) {
         return `${baseClass} ${styles.inputWarning}`;
      }

      return `${baseClass} ${styles.inputValid}`;
   }, [validationState]);

   // Проверяем, можно ли сохранить (валидно ли имя файла)
   const isSaveDisabled = useMemo(() => {
      if (operationStatus.isInProgress) return true;
      if (!editForm.filename.trim()) return true;

      // Проверяем полное имя с расширением
      const fullFilename = `${editForm.filename}.${originalFileExtension}`;
      const validationResult = fileNameValidation.validateLive(
         fullFilename,
         currentMedia?.original_filename || ''
      );

      return !validationResult.isValidForLive;
   }, [editForm.filename, currentMedia, fileNameValidation, operationStatus.isInProgress, originalFileExtension]);

   if (!isOpen || !currentMedia) {
      return null;
   }

   const mediaUrl = getLocalMediaUrl(currentMedia);

   return (
      <>
         <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
               {/* ЗАГОЛОВОК */}
               <div className={styles.header}>
                  <div className={styles.titleSection}>
                     <h2 className={styles.filename}>
                        {currentMedia.original_filename}
                     </h2>
                     <div className={styles.fileInfo}>
                        <span className={styles.fileType}>
                           {currentMedia.file_type === 'photo' ? 'Изображение' : 'Видео'}
                        </span>
                        <span className={styles.fileSize}>
                           {formatFileSize(currentMedia.size)}
                        </span>
                        <span className={styles.uploadDate}>
                           {formatDate(currentMedia.uploaded_at)}
                        </span>
                     </div>
                  </div>

                  <button className={styles.closeButton} onClick={onClose}>
                     ×
                  </button>
               </div>

               {/* Основное содержимое */}
               <div className={styles.mainContent}>
                  {/* Левая часть - медиа */}
                  <div className={styles.mediaContainer}>
                     {currentMedia.file_type === 'photo' ? (
                        <img
                           src={mediaUrl}
                           alt={currentMedia.original_filename}
                           className={styles.mediaDisplay}
                           onError={(e) => {
                              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23f0f0f0"/><text x="400" y="300" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle">Изображение не найдено</text></svg>';
                           }}
                        />
                     ) : (
                        <div className={styles.videoContainer}>
                           <video
                              src={mediaUrl}
                              controls
                              className={styles.videoDisplay}
                              poster={currentMedia.thumbnail_url ?
                                 `http://localhost:5000${currentMedia.thumbnail_url}` :
                                 undefined
                              }
                           >
                              Ваш браузер не поддерживает видео.
                           </video>
                        </div>
                     )}

                     {/* Кнопки навигации */}
                     {items.length > 1 && (
                        <>
                           <button
                              className={`${styles.navButton} ${styles.prevButton}`}
                              onClick={handlePrevious}
                              disabled={isEditing || operationStatus.isInProgress}
                           >

                           </button>
                           <button
                              className={`${styles.navButton} ${styles.nextButton}`}
                              onClick={handleNext}
                              disabled={isEditing || operationStatus.isInProgress}
                           >

                           </button>

                           <div className={styles.navInfo}>
                              {currentIndex + 1} / {items.length}
                           </div>
                        </>
                     )}
                  </div>

                  {/* Правая часть - информация и управление */}
                  <div className={styles.sidePanel}>
                     {isEditing ? (
                        <div className={styles.editForm}>
                           <h3>Редактирование файла</h3>

                           {/* ПОЛЕ ДЛЯ ИМЕНИ ФАЙЛА С ВАЛИДАЦИЕЙ И РАЗДЕЛЬНЫМ РАСШИРЕНИЕМ */}
                           <div className={styles.formGroup}>
                              <div className={styles.labelContainer}>
                                 <label className={styles.formLabel}>Имя файла</label>
                                 <div className={getCharacterCounterClass()}>
                                    {validationState.characterCount} / {fileNameValidation.MAX_FILE_NAME_LENGTH}
                                 </div>
                              </div>

                              <div className={styles.filenameInputGroup}>
                                 <input
                                    type="text"
                                    value={editForm.filename}
                                    onChange={handleFilenameInputChange}
                                    className={getInputClassName()}
                                    disabled={operationStatus.isInProgress}
                                    placeholder="Введите новое имя файла"
                                    autoFocus
                                    maxLength={fileNameValidation.MAX_FILE_NAME_LENGTH}
                                 />
                                 <div className={styles.fileExtension}>
                                    .{originalFileExtension}
                                 </div>
                              </div>

                              {/* Подсказки и ошибки */}
                              <div className={styles.validationFeedback}>
                                 {validationState.errors.length > 0 && validationState.isTouched && (
                                    <div className={styles.errorMessages}>
                                       {validationState.errors.map((error, index) => (
                                          <div key={index} className={styles.errorMessage}>
                                             {fileNameValidation.ERROR_MESSAGES[error]}
                                          </div>
                                       ))}
                                    </div>
                                 )}

                                 {validationState.warnings.length > 0 && validationState.isTouched && (
                                    <div className={styles.warningMessages}>
                                       {validationState.warnings.map((warning, index) => (
                                          <div key={index} className={styles.warningMessage}>
                                             {warning}
                                          </div>
                                       ))}
                                    </div>
                                 )}

                                 {/* Правила валидации */}
                                 <div className={styles.validationRules}>
                                    <div className={styles.ruleItem}>
                                       • Не используйте символы: \ / : * ? " &lt; &gt; |
                                    </div>
                                    <div className={styles.ruleItem}>
                                       • Максимальная длина: {fileNameValidation.MAX_FILE_NAME_LENGTH} символов (без расширения)
                                    </div>
                                    <div className={styles.ruleItem}>
                                       • Расширение файла (<strong>.{originalFileExtension}</strong>) нельзя изменить
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className={styles.formGroup}>
                              <label className={styles.formLabel}>Приватность</label>
                              <div className={styles.radioGroup}>
                                 <label className={styles.radioOption}>
                                    <input
                                       type="radio"
                                       value="private"
                                       checked={editForm.privacy === 'private'}
                                       onChange={(e) => {
                                          setEditForm(prev => ({ ...prev, privacy: e.target.value }));
                                       }}
                                       disabled={operationStatus.isInProgress}
                                    />
                                    <span>Приватный</span>
                                 </label>
                                 <label className={styles.radioOption}>
                                    <input
                                       type="radio"
                                       value="public"
                                       checked={editForm.privacy === 'public'}
                                       onChange={(e) => {
                                          setEditForm(prev => ({ ...prev, privacy: e.target.value }));
                                       }}
                                       disabled={operationStatus.isInProgress}
                                    />
                                    <span>Публичный</span>
                                 </label>
                              </div>
                           </div>

                           <div className={styles.formActions}>
                              <button
                                 className={styles.cancelButton}
                                 onClick={handleCancelEdit}
                                 disabled={operationStatus.isInProgress}
                              >
                                 Отмена
                              </button>
                              <button
                                 className={styles.saveButton}
                                 onClick={handleSaveEdit}
                                 disabled={isSaveDisabled}
                              >
                                 {operationStatus.isInProgress ? 'Сохранение...' : 'Сохранить'}
                              </button>
                           </div>
                        </div>
                     ) : (
                        <>
                           {/* Информация о файле */}
                           <div className={styles.infoSection}>
                              <h3>Информация о файле</h3>

                              <div className={styles.infoGrid}>
                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Название:</span>
                                    <span className={styles.infoValue}>
                                       {currentMedia.original_filename}
                                    </span>
                                 </div>

                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Тип:</span>
                                    <span className={styles.infoValue}>
                                       {currentMedia.mime_type}
                                    </span>
                                 </div>

                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Размер:</span>
                                    <span className={styles.infoValue}>
                                       {formatFileSize(currentMedia.size)}
                                    </span>
                                 </div>

                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Загружен:</span>
                                    <span className={styles.infoValue}>
                                       {formatDate(currentMedia.uploaded_at)}
                                    </span>
                                 </div>

                                 <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Статус:</span>
                                    <span className={`${styles.infoValue} ${styles.privacyBadge} ${currentMedia.privacy === 'public' ? styles.public : styles.private}`}>
                                       {currentMedia.privacy === 'public' ? 'Публичный' : 'Приватный'}
                                    </span>
                                 </div>

                                 {currentMedia.shared_count > 0 && (
                                    <div className={styles.infoRow}>
                                       <span className={styles.infoLabel}>Поделились:</span>
                                       <span className={styles.infoValue}>
                                          {currentMedia.shared_count} раз
                                       </span>
                                    </div>
                                 )}

                                 {currentMedia.duration && (
                                    <div className={styles.infoRow}>
                                       <span className={styles.infoLabel}>Длительность:</span>
                                       <span className={styles.infoValue}>
                                          {new Date(currentMedia.duration * 1000).toISOString().substr(11, 8)}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Действия */}
                           <div className={styles.actionsSection}>
                              <h3>Действия</h3>

                              <div className={styles.actionsGrid}>
                                 <button
                                    className={styles.actionButton}
                                    onClick={handleDownload}
                                    disabled={isDownloading || operationStatus.isInProgress}
                                 >
                                    {isDownloading ? '⏳ Скачивание...' : '⬇️ Скачать'}
                                 </button>

                                 <button
                                    className={styles.actionButton}
                                    onClick={() => setIsEditing(true)}
                                    disabled={operationStatus.isInProgress}
                                 >
                                    ✏️ Редактировать
                                 </button>

                                 <button
                                    className={`${styles.actionButton} ${styles.shareButton}`}
                                    onClick={handleCopyLink}
                                    disabled={operationStatus.isInProgress}
                                 >
                                    🔗 Копировать ссылку
                                 </button>

                                 <button
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    onClick={handleDeleteClick}
                                    disabled={operationStatus.isInProgress}
                                 >
                                    🗑️ Удалить
                                 </button>
                              </div>
                           </div>
                        </>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Модалка подтверждения удаления */}
         <ConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            title="Удаление файла"
            message={`Вы уверены, что хотите удалить файл "${deleteModal.mediaName}"?`}
            confirmText="Удалить"
            cancelText="Отмена"
            type="delete"
            disabled={operationStatus.isInProgress}
         />
      </>
   );
};

export default MediaPreviewModal;