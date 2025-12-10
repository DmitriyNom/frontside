// src/UI/Pages/Profile/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
   selectUser,
   selectLoading as selectAuthLoading,
   setUserRole
} from '../../../features/authSlice';
import { USER_ROLES } from '../../../constants/userRoles';

// Импорты из profileSlice
import {
   // Actions
   loadProfile,
   updateProfile,
   fetchTrainingLevels,
   clearErrors,
   // Selectors
   selectProfile,
   selectTrainingLevels,
   selectIsLoading,
   selectIsSaving,
   selectIsLoadingLevels,
   selectProfileError,
   selectSaveError,
   selectIsProfileLoaded
} from '../../../features/profileSlice';

import ConfirmRoleChangeModal from '../../Components/ConfirmRoleChangeModal';
import styles from './Profile.module.css';

// Компонент выбора роли
const RoleSelector = ({ selectedRole, onRoleSelect }) => {
   return (
      <div className={styles.roleSelectorEnhanced}>
         <div className={styles.roleOptions}>
            <button
               className={`${styles.roleOption} ${selectedRole === USER_ROLES.TRAINEE ? styles.selected : ''}`}
               onClick={() => onRoleSelect(USER_ROLES.TRAINEE)}
               type="button"
            >
               <div className={styles.roleIcon}>🏃‍♂️</div>
               <div className={styles.roleInfo}>
                  <h4>Спортсмен</h4>
                  <p>Буду тренироваться и выполнять задания</p>
               </div>
               {selectedRole === USER_ROLES.TRAINEE && (
                  <div className={styles.selectedBadge}>✓</div>
               )}
            </button>

            <button
               className={`${styles.roleOption} ${selectedRole === USER_ROLES.TRAINER ? styles.selected : ''}`}
               onClick={() => onRoleSelect(USER_ROLES.TRAINER)}
               type="button"
            >
               <div className={styles.roleIcon}>👨‍🏫</div>
               <div className={styles.roleInfo}>
                  <h4>Тренер</h4>
                  <p>Буду создавать программы и руководить</p>
               </div>
               {selectedRole === USER_ROLES.TRAINER && (
                  <div className={styles.selectedBadge}>✓</div>
               )}
            </button>
         </div>
      </div>
   );
};

// Компонент выбора уровня подготовки
const TrainingLevelSelector = ({ value, onChange, levels, isLoading }) => {
   if (isLoading) {
      return (
         <div className={styles.trainingLevelSelector}>
            <div className={styles.loadingLevels}>
               <div className={styles.spinnerSmall}></div>
               <p>Загрузка уровней подготовки...</p>
            </div>
         </div>
      );
   }

   if (!levels || levels.length === 0) {
      return (
         <div className={styles.trainingLevelSelector}>
            <div className={styles.noLevels}>
               <p>Нет доступных уровней подготовки</p>
            </div>
         </div>
      );
   }

   return (
      <div className={styles.trainingLevelSelector}>
         <div className={styles.levelOptions}>
            {levels.map((level) => (
               <button
                  key={level.id}
                  className={`${styles.levelOption} ${value === level.id ? styles.selected : ''}`}
                  onClick={() => onChange(level.id)}
                  title={level.description}
                  type="button"
               >
                  <div className={styles.levelIcon}>{level.icon}</div>
                  <div className={styles.levelInfo}>
                     <h4>{level.name}</h4>
                     <p>{level.description}</p>
                     {level.minExperience !== undefined && (
                        <small className={styles.levelExperience}>
                           Опыт: {level.minExperience}
                           {level.maxExperience ? `-${level.maxExperience}` : '+'} лет
                        </small>
                     )}
                  </div>
               </button>
            ))}
         </div>
      </div>
   );
};

// Основной компонент страницы настроек
const ProfileSettings = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   // Данные из auth
   const user = useSelector(selectUser);
   const authLoading = useSelector(selectAuthLoading);

   // Данные из profileSlice
   const profile = useSelector(selectProfile);
   const trainingLevels = useSelector(selectTrainingLevels);
   const isLoadingProfile = useSelector(selectIsLoading);
   const isSavingProfile = useSelector(selectIsSaving);
   const isLoadingLevels = useSelector(selectIsLoadingLevels);
   const profileError = useSelector(selectProfileError);
   const saveError = useSelector(selectSaveError);
   const isProfileLoaded = useSelector(selectIsProfileLoaded);

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState(null);
   const [successMessage, setSuccessMessage] = useState(null);
   const [hasPendingRoleChange, setHasPendingRoleChange] = useState(false);

   // Состояния для модалки подтверждения смены роли
   const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
   const [pendingRoleChange, setPendingRoleChange] = useState(null);

   const [formData, setFormData] = useState({
      role: '',
      training_level: '',
      sport_specialization: '',
      allow_connections: true,
      userName: '',
      birthDate: ''
   });

   // 🔄 Загружаем профиль пользователя
   useEffect(() => {
      if (!isProfileLoaded && !isLoadingProfile && !profile) {
         console.log('🟡 Загрузка профиля...');
         dispatch(loadProfile());
      }
   }, [dispatch, isProfileLoaded, isLoadingProfile, profile]);

   // 🔄 Загружаем уровни подготовки
   useEffect(() => {
      if (trainingLevels.length === 0 && !isLoadingLevels) {
         console.log('🟡 Загрузка уровней подготовки...');
         dispatch(fetchTrainingLevels());
      }
   }, [dispatch, trainingLevels.length, isLoadingLevels]);

   // 🔄 Обновление формы когда профиль загружен
   useEffect(() => {
      if (profile) {
         setFormData({
            role: profile.role || '',
            training_level: profile.training_level || '',
            sport_specialization: profile.sport_specialization || '',
            allow_connections: profile.allow_connections !== false,
            userName: profile.userName || '',
            birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : ''
         });
      }
   }, [profile]);

   // 🔄 Сброс ошибок при размонтировании
   useEffect(() => {
      return () => {
         dispatch(clearErrors());
      };
   }, [dispatch]);

   // Обработчик смены роли
   const handleRoleChange = (newRole) => {
      if (formData.role === newRole) return;

      if (formData.role && formData.role !== 'skipped' && newRole !== 'skipped') {
         setPendingRoleChange(newRole);
         setShowRoleChangeModal(true);
      } else {
         applyRoleChange(newRole);
      }
   };

   // Функция применения смены роли
   const applyRoleChange = (newRole) => {
      setFormData(prev => ({
         ...prev,
         role: newRole,
         ...(newRole === USER_ROLES.TRAINEE && { sport_specialization: '' }),
         ...(newRole === USER_ROLES.TRAINER && { training_level: '' })
      }));

      setHasPendingRoleChange(true);
      setSuccessMessage(null);
      setError(null);
   };

   // Обработчик подтверждения смены роли
   const handleConfirmRoleChange = () => {
      if (pendingRoleChange) {
         applyRoleChange(pendingRoleChange);
         setShowRoleChangeModal(false);
         setPendingRoleChange(null);
      }
   };

   // Обработчик отмены смены роли
   const handleCancelRoleChange = () => {
      setShowRoleChangeModal(false);
      setPendingRoleChange(null);
   };

   const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;

      // Автоформатирование для sport_specialization
      let processedValue = value;
      if (name === 'sport_specialization') {
         // Убираем лишние пробелы вокруг запятых
         processedValue = value
            .replace(/\s*,\s*/g, ', ')  // "Бег,  Плавание ,Йога" → "Бег, Плавание, Йога"
            .replace(/\s+/g, ' ')       // Убираем двойные пробелы
            .trim();
      }

      setFormData(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : processedValue
      }));
      setSuccessMessage(null);
      setError(null);
   };

   // Обработчик изменения уровня подготовки (без автосохранения)
   const handleTrainingLevelChange = (level) => {
      setFormData(prev => ({ ...prev, training_level: level }));
   };

   const validateForm = () => {
      const errors = [];

      if (!formData.role || formData.role === 'skipped') {
         errors.push('Выберите роль (Спортсмен или Тренер)');
      }

      if (formData.role === USER_ROLES.TRAINEE && formData.training_level) {
         const levelExists = trainingLevels.some(level => level.id === formData.training_level);
         if (!levelExists) {
            errors.push('Выбран несуществующий уровень подготовки');
         }
      }

      // УБРАНА обязательная проверка для тренера - поле теперь опциональное для всех
      // if (formData.role === USER_ROLES.TRAINER && !formData.sport_specialization.trim()) {
      //    errors.push('Для тренера необходимо указать специализацию');
      // }

      if (!formData.userName.trim()) {
         errors.push('Имя пользователя обязательно');
      }

      if (formData.birthDate) {
         const birthDate = new Date(formData.birthDate);
         const today = new Date();
         const minAgeDate = new Date();
         minAgeDate.setFullYear(today.getFullYear() - 100);
         const maxAgeDate = new Date();
         maxAgeDate.setFullYear(today.getFullYear() - 13);

         if (birthDate < minAgeDate) {
            errors.push('Дата рождения не может быть ранее 100 лет назад');
         }
         if (birthDate > maxAgeDate) {
            errors.push('Вам должно быть не менее 13 лет');
         }
      }

      return errors;
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      const errors = validateForm();
      if (errors.length > 0) {
         setError(errors.join('. '));
         return;
      }

      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
         // Подготавливаем данные для отправки
         const submitData = {
            role: formData.role,
            userName: formData.userName.trim(),
            allow_connections: formData.allow_connections
         };

         // Добавляем поля в зависимости от роли
         if (formData.role === USER_ROLES.TRAINEE) {
            if (formData.training_level) {
               submitData.training_level = formData.training_level;
            }
            // ✅ ДОБАВЛЯЕМ специализацию для спортсмена (спортивные интересы)
            if (formData.sport_specialization.trim()) {
               submitData.sport_specialization = formData.sport_specialization.trim();
            }
         }

         // ✅ Для тренера - специализация (необязательное поле)
         if (formData.role === USER_ROLES.TRAINER && formData.sport_specialization.trim()) {
            submitData.sport_specialization = formData.sport_specialization.trim();
         }

         // Добавляем дату рождения, если указана
         if (formData.birthDate) {
            submitData.birthDate = formData.birthDate;
         }

         console.log('🟡 Отправляем данные профиля:', submitData);

         // Отправляем данные
         const result = await dispatch(updateProfile(submitData)).unwrap();

         console.log('🟢 Профиль обновлен:', result);

         // Обновляем роль пользователя в authSlice
         if (result.role) {
            dispatch(setUserRole(result.role));
         }

         // Сбрасываем флаг после успешного сохранения
         setHasPendingRoleChange(false);

         setSuccessMessage('Профиль успешно обновлен!');
         setIsLoading(false);

         setTimeout(() => {
            setSuccessMessage(null);
         }, 3000);

      } catch (error) {
         console.error('🔴 Ошибка обновления профиля:', error);
         setError(error.message || 'Произошла ошибка при обновлении профиля');
         setIsLoading(false);
      }
   };

   const handleCancel = () => {
      // Сбрасываем ВСЕ состояния
      setIsLoading(false);
      setHasPendingRoleChange(false);
      setError(null);
      setSuccessMessage(null);

      // Навигация
      navigate('/');
   };

   // 🔄 Отображение ошибок из Redux
   useEffect(() => {
      if (profileError) {
         setError(`Ошибка загрузки профиля: ${profileError}`);
      }
      if (saveError) {
         setError(`Ошибка сохранения: ${saveError}`);
      }
   }, [profileError, saveError]);

   // Объединяем состояния загрузки
   const isPageLoading = authLoading || isLoadingProfile;
   const isSaving = isLoading || isSavingProfile;

   if (isPageLoading) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   if (!user && !profile) {
      return (
         <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Пользователь не найден</h2>
            <p>Пожалуйста, войдите в систему</p>
            <button className={styles.retryButton} onClick={() => navigate('/login')}>
               Войти
            </button>
         </div>
      );
   }

   const displayUser = profile || user;

   return (
      <>
         <div className={styles.settingsEnhancedContainer}>
            <header className={styles.settingsHeader}>
               <h1>Настройки профиля</h1>
               <p>Управление вашими персональными данными</p>
            </header>

            {/* Сообщения об ошибках и успехе */}
            {error && (
               <div className={styles.errorMessage}>
                  <span className={styles.errorIcon}>❌</span>
                  {error}
                  <button
                     className={styles.closeErrorButton}
                     onClick={() => setError(null)}
                     aria-label="Закрыть ошибку"
                  >
                     ×
                  </button>
               </div>
            )}

            {hasPendingRoleChange && !error && (
               <div className={styles.warningMessage}>
                  <span className={styles.warningIcon}>⚠️</span>
                  Несохраненная смена роли! Нажмите "Сохранить изменения" для подтверждения.
                  <button
                     className={styles.closeWarningButton}
                     onClick={() => setHasPendingRoleChange(false)}
                     aria-label="Закрыть предупреждение"
                  >
                     ×
                  </button>
               </div>
            )}

            {successMessage && (
               <div className={styles.successMessage}>
                  <span className={styles.successIcon}>✅</span>
                  {successMessage}
                  <button
                     className={styles.closeSuccessButton}
                     onClick={() => setSuccessMessage(null)}
                     aria-label="Закрыть уведомление"
                  >
                     ×
                  </button>
               </div>
            )}

            <form onSubmit={handleSubmit} className={styles.settingsForm}>
               <div className={styles.formSections}>

                  {/* Секция 1: Основная информация */}
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>👤</span>
                        Основная информация
                     </h2>

                     <div className={styles.formGroup}>
                        <label htmlFor="userName">Имя пользователя *</label>
                        <input
                           type="text"
                           id="userName"
                           name="userName"
                           value={formData.userName}
                           onChange={handleInputChange}
                           placeholder="Введите ваше имя"
                           required
                           className={styles.textInput}
                           disabled={isSaving}
                        />
                     </div>

                     <div className={styles.formGroup}>
                        <label htmlFor="birthDate">Дата рождения</label>
                        <input
                           type="date"
                           id="birthDate"
                           name="birthDate"
                           value={formData.birthDate}
                           onChange={handleInputChange}
                           className={styles.dateInput}
                           disabled={isSaving}
                           max={new Date().toISOString().split('T')[0]}
                        />
                        {formData.birthDate && (
                           <small className={styles.inputHint}>
                              Возраст: {Math.floor((new Date() - new Date(formData.birthDate)) / (365.25 * 24 * 60 * 60 * 1000))} лет
                           </small>
                        )}
                     </div>
                  </section>

                  {/* Секция 2: Роль в системе */}
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🎯</span>
                        Роль в системе *
                     </h2>
                     <p className={styles.sectionDescription}>
                        Выберите вашу основную роль. Это определит доступные функции.
                     </p>

                     <RoleSelector
                        selectedRole={formData.role}
                        onRoleSelect={handleRoleChange}
                     />
                  </section>

                  {/* Секция 3: Настройки в зависимости от роли */}
                  {formData.role === USER_ROLES.TRAINEE && (
                     <>
                        <section className={styles.formSection}>
                           <h2 className={styles.sectionTitle}>
                              <span className={styles.sectionIcon}>💪</span>
                              Уровень подготовки
                           </h2>
                           <p className={styles.sectionDescription}>
                              Укажите ваш текущий уровень физической подготовки
                           </p>

                           <TrainingLevelSelector
                              value={formData.training_level}
                              onChange={handleTrainingLevelChange}
                              levels={trainingLevels}
                              isLoading={isLoadingLevels}
                           />

                           {!formData.training_level && (
                              <div className={styles.infoBox}>
                                 <span className={styles.infoIcon}>💡</span>
                                 <p>Выберите уровень подготовки, чтобы получать персонализированные тренировки</p>
                              </div>
                           )}
                        </section>

                        {/* ✅ НОВАЯ СЕКЦИЯ: Спортивные интересы для спортсмена */}
                        <section className={styles.formSection}>
                           <h2 className={styles.sectionTitle}>
                              <span className={styles.sectionIcon}>🎯</span>
                              Спортивные интересы
                           </h2>
                           <p className={styles.sectionDescription}>
                              Укажите виды спорта или активности, которыми занимаетесь (через запятую)
                           </p>

                           <div className={styles.formGroup}>
                              <input
                                 type="text"
                                 name="sport_specialization"
                                 value={formData.sport_specialization}
                                 onChange={handleInputChange}
                                 placeholder="Например: Бег, Плавание, Йога, Велоспорт..."
                                 className={styles.textInput}
                                 disabled={isSaving}
                                 maxLength={200}
                              />
                              <small className={styles.inputHint}>
                                 Укажите через запятую. Это поможет найти подходящего тренера и единомышленников.
                              </small>
                           </div>

                           {/* Показываем визуальные теги */}
                           {formData.sport_specialization.trim() && (
                              <div className={styles.tagPreview}>
                                 <div className={styles.tagsContainer}>
                                    {formData.sport_specialization
                                       .split(',')
                                       .map(tag => tag.trim())
                                       .filter(tag => tag.length > 0)
                                       .map((tag, index) => (
                                          <span key={index} className={styles.tagChip}>
                                             {tag}
                                          </span>
                                       ))}
                                 </div>
                              </div>
                           )}
                        </section>
                     </>
                  )}

                  {formData.role === USER_ROLES.TRAINER && (
                     <section className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>
                           <span className={styles.sectionIcon}>🎓</span>
                           Специализация
                        </h2>
                        <p className={styles.sectionDescription}>
                           Укажите ваши направления подготовки (через запятую)
                        </p>

                        <div className={styles.formGroup}>
                           <input
                              type="text"
                              name="sport_specialization"
                              value={formData.sport_specialization}
                              onChange={handleInputChange}
                              placeholder="Например: Фитнес, Бокс, Йога, Плавание..."
                              className={styles.textInput}
                              disabled={isSaving}
                              maxLength={200}
                           />
                           <small className={styles.inputHint}>
                              Укажите через запятую все направления, в которых вы работаете как тренер.
                           </small>
                        </div>

                        {/* Показываем визуальные теги */}
                        {formData.sport_specialization.trim() && (
                           <div className={styles.tagPreview}>
                              <div className={styles.tagsContainer}>
                                 {formData.sport_specialization
                                    .split(',')
                                    .map(tag => tag.trim())
                                    .filter(tag => tag.length > 0)
                                    .map((tag, index) => (
                                       <span key={index} className={styles.tagChip}>
                                          {tag}
                                       </span>
                                    ))}
                              </div>
                           </div>
                        )}
                     </section>
                  )}

                  {/* Секция 4: Настройки приватности */}
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🔒</span>
                        Настройки приватности
                     </h2>

                     <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                           <input
                              type="checkbox"
                              name="allow_connections"
                              checked={formData.allow_connections}
                              onChange={handleInputChange}
                              className={styles.checkboxInput}
                              disabled={isSaving}
                           />
                           <span className={styles.checkboxCustom}></span>
                           <div className={styles.checkboxText}>
                              <strong>Разрешить подключения</strong>
                              <p>Другие пользователи могут найти вас и отправить запрос на подключение</p>
                           </div>
                        </label>
                     </div>
                  </section>

                  {/* Секция 5: Текущие настройки */}
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>📧</span>
                        Учетная запись
                     </h2>

                     <div className={styles.readOnlyInfo}>
                        <div className={styles.infoRow}>
                           <span className={styles.infoLabel}>Email:</span>
                           <span className={styles.infoValue}>{displayUser.email}</span>
                        </div>
                        <div className={styles.infoRow}>
                           <span className={styles.infoLabel}>ID пользователя:</span>
                           <span className={styles.infoValue}>{displayUser.id}</span>
                        </div>
                        <div className={styles.infoRow}>
                           <span className={styles.infoLabel}>Дата регистрации:</span>
                           <span className={styles.infoValue}>
                              {new Date(displayUser.createdAt || Date.now()).toLocaleDateString('ru-RU')}
                           </span>
                        </div>
                        <div className={styles.infoRow}>
                           <span className={styles.infoLabel}>Последнее обновление:</span>
                           <span className={styles.infoValue}>
                              {displayUser.updatedAt
                                 ? new Date(displayUser.updatedAt).toLocaleDateString('ru-RU')
                                 : 'Не обновлялся'
                              }
                           </span>
                        </div>
                     </div>
                  </section>
               </div>

               {/* Кнопки действий */}
               <div className={styles.formActions}>
                  <button
                     type="button"
                     onClick={handleCancel}
                     className={styles.cancelButton}
                     disabled={isSaving}
                  >
                     Отмена
                  </button>

                  <button
                     type="submit"
                     className={styles.submitButton}
                     disabled={isSaving}
                  >
                     {isSaving ? (
                        <>
                           <span className={styles.spinnerSmall}></span>
                           Сохранение...
                        </>
                     ) : (
                        'Сохранить изменения'
                     )}
                  </button>
               </div>

               <div className={styles.formHint}>
                  <p>* Обязательные для заполнения поля</p>
                  <p className={styles.apiInfo}>
                     {profile?.updatedAt && `Последнее обновление: ${new Date(profile.updatedAt).toLocaleString('ru-RU')}`}
                  </p>
               </div>
            </form>
         </div>

         {/* Модалка подтверждения смены роли */}
         <ConfirmRoleChangeModal
            isOpen={showRoleChangeModal}
            onClose={handleCancelRoleChange}
            onConfirm={handleConfirmRoleChange}
            currentRole={formData.role}
            newRole={pendingRoleChange}
            userName={displayUser.userName}
         />
      </>
   );
};

export default ProfileSettings;