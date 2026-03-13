// src/hooks/useFileNameValidation.js
import { useCallback, useMemo } from 'react';

/**
 * Хук для валидации имени файла
 * Предоставляет функции для проверки, очистки и форматирования имен файлов
 */
const useFileNameValidation = () => {
   // Конфигурационные константы
   const MAX_FILE_NAME_LENGTH = 100;
   const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'];
   const FORBIDDEN_CHARS_REGEX = /[\\/:*?"<>|]/g;
   const MULTIPLE_DOTS_REGEX = /\.{2,}/g;
   const LEADING_TRAILING_DOTS_SPACES_REGEX = /^[.\s]+|[.\s]+$/g;
   const MULTIPLE_SPACES_REGEX = /\s{2,}/g;

   // Типы ошибок валидации
   const VALIDATION_ERRORS = {
      EMPTY_NAME: 'empty_name',
      TOO_LONG: 'too_long',
      INVALID_EXTENSION: 'invalid_extension',
      FORBIDDEN_CHARS: 'forbidden_chars',
      MULTIPLE_DOTS: 'multiple_dots',
      LEADING_TRAILING_DOTS: 'leading_trailing_dots',
      EXTENSION_CHANGED: 'extension_changed',
      NO_NAME_WITHOUT_EXTENSION: 'no_name_without_extension',
      RESERVED_NAME: 'reserved_name'
   };

   // Сообщения об ошибках на русском
   const ERROR_MESSAGES = {
      [VALIDATION_ERRORS.EMPTY_NAME]: 'Имя файла не может быть пустым',
      [VALIDATION_ERRORS.TOO_LONG]: `Имя файла не должно превышать ${MAX_FILE_NAME_LENGTH} символов`,
      [VALIDATION_ERRORS.INVALID_EXTENSION]: 'Недопустимое расширение файла',
      [VALIDATION_ERRORS.FORBIDDEN_CHARS]: 'Имя файла содержит запрещенные символы (\\ / : * ? " < > |)',
      [VALIDATION_ERRORS.MULTIPLE_DOTS]: 'Имя файла содержит несколько точек подряд',
      [VALIDATION_ERRORS.LEADING_TRAILING_DOTS]: 'Имя файла не может начинаться или заканчиваться точкой или пробелом',
      [VALIDATION_ERRORS.EXTENSION_CHANGED]: 'Нельзя изменять расширение файла',
      [VALIDATION_ERRORS.NO_NAME_WITHOUT_EXTENSION]: 'Имя файла должно содержать название до расширения',
      [VALIDATION_ERRORS.RESERVED_NAME]: 'Это имя файла зарезервировано системой'
   };

   // Зарезервированные имена файлов (Windows/Linux)
   const RESERVED_NAMES = [
      'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
   ];

   /**
    * Получает расширение файла из имени
    * @param {string} fileName - Имя файла
    * @returns {string} Расширение файла в нижнем регистре (без точки)
    */
   const getFileExtension = useCallback((fileName) => {
      if (!fileName || typeof fileName !== 'string') return '';

      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
         return '';
      }

      return fileName.substring(lastDotIndex + 1).toLowerCase();
   }, []);

   /**
    * Получает имя файла без расширения
    * @param {string} fileName - Имя файла
    * @returns {string} Имя без расширения
    */
   const getFileNameWithoutExtension = useCallback((fileName) => {
      if (!fileName || typeof fileName !== 'string') return fileName || '';

      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex === -1) return fileName;

      return fileName.substring(0, lastDotIndex);
   }, []);

   /**
    * Проверяет, является ли расширение допустимым
    * @param {string} extension - Расширение файла
    * @returns {boolean} true если расширение допустимо
    */
   const isValidExtension = useCallback((extension) => {
      if (!extension) return false;
      return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
   }, []);

   /**
    * Проверяет, содержит ли имя файла запрещенные символы
    * @param {string} fileName - Имя файла
    * @returns {boolean} true если содержит запрещенные символы
    */
   const hasForbiddenChars = useCallback((fileName) => {
      return FORBIDDEN_CHARS_REGEX.test(fileName);
   }, []);

   /**
    * Проверяет, является ли имя файла зарезервированным
    * @param {string} fileNameWithoutExt - Имя файла без расширения
    * @returns {boolean} true если имя зарезервировано
    */
   const isReservedName = useCallback((fileNameWithoutExt) => {
      if (!fileNameWithoutExt) return false;
      return RESERVED_NAMES.includes(fileNameWithoutExt.toUpperCase());
   }, []);

   /**
    * Очищает имя файла от недопустимых символов и форматирует его
    * @param {string} fileName - Исходное имя файла
    * @param {string} originalFileName - Оригинальное имя файла (для сохранения расширения)
    * @returns {Object} { cleanedName: string, appliedCorrections: string[] }
    */
   const sanitizeFileName = useCallback((fileName, originalFileName = '') => {
      if (!fileName || typeof fileName !== 'string') return '';

      let cleanedName = fileName.trim();
      const appliedCorrections = [];

      // 1. Удаляем запрещенные символы
      if (FORBIDDEN_CHARS_REGEX.test(cleanedName)) {
         cleanedName = cleanedName.replace(FORBIDDEN_CHARS_REGEX, '');
         appliedCorrections.push(VALIDATION_ERRORS.FORBIDDEN_CHARS);
      }

      // 2. Заменяем множественные точки на одну
      if (MULTIPLE_DOTS_REGEX.test(cleanedName)) {
         cleanedName = cleanedName.replace(MULTIPLE_DOTS_REGEX, '.');
         appliedCorrections.push(VALIDATION_ERRORS.MULTIPLE_DOTS);
      }

      // 3. Удаляем точки и пробелы в начале и конце
      if (LEADING_TRAILING_DOTS_SPACES_REGEX.test(cleanedName)) {
         cleanedName = cleanedName.replace(LEADING_TRAILING_DOTS_SPACES_REGEX, '');
         appliedCorrections.push(VALIDATION_ERRORS.LEADING_TRAILING_DOTS);
      }

      // 4. Заменяем множественные пробелы на один
      if (MULTIPLE_SPACES_REGEX.test(cleanedName)) {
         cleanedName = cleanedName.replace(MULTIPLE_SPACES_REGEX, ' ');
         appliedCorrections.push('multiple_spaces');
      }

      // 5. Обрезаем до максимальной длины (учитывая расширение)
      if (originalFileName) {
         const originalExt = getFileExtension(originalFileName);
         const maxNameLength = MAX_FILE_NAME_LENGTH - (originalExt ? originalExt.length + 1 : 0);

         const nameWithoutExt = getFileNameWithoutExtension(cleanedName);
         if (nameWithoutExt.length > maxNameLength) {
            cleanedName = nameWithoutExt.substring(0, maxNameLength) +
               (originalExt ? `.${originalExt}` : '');
            appliedCorrections.push(VALIDATION_ERRORS.TOO_LONG);
         }
      } else if (cleanedName.length > MAX_FILE_NAME_LENGTH) {
         cleanedName = cleanedName.substring(0, MAX_FILE_NAME_LENGTH);
         appliedCorrections.push(VALIDATION_ERRORS.TOO_LONG);
      }

      // 6. Если имя пустое после очистки, генерируем базовое имя
      if (!cleanedName || getFileNameWithoutExtension(cleanedName) === '') {
         cleanedName = `файл${originalFileName ? `.${getFileExtension(originalFileName)}` : ''}`;
         appliedCorrections.push(VALIDATION_ERRORS.EMPTY_NAME);
      }

      return {
         cleanedName,
         appliedCorrections: [...new Set(appliedCorrections)] // Уникальные коррекции
      };
   }, [getFileExtension, getFileNameWithoutExtension]);

   /**
    * Основная функция валидации имени файла
    * @param {string} fileName - Проверяемое имя файла
    * @param {string} originalFileName - Оригинальное имя файла (для проверки расширения)
    * @returns {Object} Результат валидации
    */
   const validateFileName = useCallback((fileName, originalFileName = '') => {
      const errors = [];
      const warnings = [];

      if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
         errors.push(VALIDATION_ERRORS.EMPTY_NAME);
         return {
            isValid: false,
            errors,
            warnings,
            errorMessages: errors.map(err => ERROR_MESSAGES[err]),
            correctedName: originalFileName || ''
         };
      }

      const trimmedName = fileName.trim();
      const originalExtension = getFileExtension(originalFileName);
      const newExtension = getFileExtension(trimmedName);
      const nameWithoutExt = getFileNameWithoutExtension(trimmedName);

      // Проверка длины
      if (trimmedName.length > MAX_FILE_NAME_LENGTH) {
         errors.push(VALIDATION_ERRORS.TOO_LONG);
      }

      // Проверка на наличие имени без расширения
      if (!nameWithoutExt) {
         errors.push(VALIDATION_ERRORS.NO_NAME_WITHOUT_EXTENSION);
      }

      // Проверка зарезервированных имен
      if (isReservedName(nameWithoutExt)) {
         errors.push(VALIDATION_ERRORS.RESERVED_NAME);
      }

      // Проверка запрещенных символов
      if (hasForbiddenChars(trimmedName)) {
         errors.push(VALIDATION_ERRORS.FORBIDDEN_CHARS);
      }

      // Проверка множественных точек
      if (MULTIPLE_DOTS_REGEX.test(trimmedName)) {
         errors.push(VALIDATION_ERRORS.MULTIPLE_DOTS);
      }

      // Проверка точек/пробелов в начале/конце
      if (LEADING_TRAILING_DOTS_SPACES_REGEX.test(trimmedName)) {
         errors.push(VALIDATION_ERRORS.LEADING_TRAILING_DOTS);
      }

      // Проверка расширения (если есть оригинальное имя)
      if (originalFileName) {
         // Если пользователь пытается изменить расширение
         if (newExtension && originalExtension && newExtension !== originalExtension) {
            errors.push(VALIDATION_ERRORS.EXTENSION_CHANGED);
         }

         // Проверка допустимости расширения (для нового файла)
         if (!originalExtension && newExtension && !isValidExtension(newExtension)) {
            errors.push(VALIDATION_ERRORS.INVALID_EXTENSION);
         }
      } else if (newExtension && !isValidExtension(newExtension)) {
         // Для новых файлов без оригинала
         errors.push(VALIDATION_ERRORS.INVALID_EXTENSION);
      }

      // Генерация исправленного имени
      let correctedName = trimmedName;
      if (errors.length > 0) {
         const sanitized = sanitizeFileName(trimmedName, originalFileName);
         correctedName = sanitized.cleanedName;

         // Добавляем примененные коррекции как warnings
         sanitized.appliedCorrections.forEach(correction => {
            if (ERROR_MESSAGES[correction]) {
               warnings.push({
                  code: correction,
                  message: ERROR_MESSAGES[correction]
               });
            }
         });
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings,
         errorMessages: errors.map(err => ERROR_MESSAGES[err]),
         warningMessages: warnings.map(w => w.message),
         correctedName,
         originalExtension,
         newExtension,
         nameWithoutExt
      };
   }, [
      getFileExtension,
      getFileNameWithoutExtension,
      isReservedName,
      hasForbiddenChars,
      isValidExtension,
      sanitizeFileName
   ]);

   /**
    * Проверяет, нужно ли показывать предупреждение при вводе
    * (для валидации в реальном времени)
    */
   const validateLive = useCallback((fileName, originalFileName = '') => {
      const result = validateFileName(fileName, originalFileName);

      // Для live-валидации считаем некоторые ошибки предупреждениями
      const liveErrors = result.errors.filter(err =>
         ![
            VALIDATION_ERRORS.EMPTY_NAME,
            VALIDATION_ERRORS.NO_NAME_WITHOUT_EXTENSION
         ].includes(err)
      );

      const liveWarnings = [
         ...result.warnings,
         ...result.errors.filter(err =>
            [
               VALIDATION_ERRORS.EMPTY_NAME,
               VALIDATION_ERRORS.NO_NAME_WITHOUT_EXTENSION
            ].includes(err)
         ).map(err => ({
            code: err,
            message: ERROR_MESSAGES[err]
         }))
      ];

      return {
         ...result,
         isValidForLive: liveErrors.length === 0,
         liveErrors,
         liveWarnings
      };
   }, [validateFileName]);

   // Мемоизированные значения для оптимизации
   const validationRules = useMemo(() => ({
      maxLength: MAX_FILE_NAME_LENGTH,
      allowedExtensions: ALLOWED_EXTENSIONS,
      forbiddenChars: FORBIDDEN_CHARS_REGEX.toString(),
      errorMessages: ERROR_MESSAGES,
      validationErrors: VALIDATION_ERRORS
   }), []);

   return {
      // Основные функции
      validate: validateFileName,
      validateLive,
      sanitize: sanitizeFileName,

      // Вспомогательные функции
      getExtension: getFileExtension,
      getFileNameWithoutExtension,
      isValidExtension,

      // Конфигурация
      validationRules,

      // Константы для использования в компонентах
      MAX_FILE_NAME_LENGTH,
      ALLOWED_EXTENSIONS,
      FORBIDDEN_CHARS_REGEX,
      VALIDATION_ERRORS,
      ERROR_MESSAGES
   };
};

export default useFileNameValidation;