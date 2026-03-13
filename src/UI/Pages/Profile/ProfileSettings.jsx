// src/UI/Pages/Profile/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
   selectUser,
   selectLoading as selectAuthLoading,
   setUserRole
} from '../../../features/authSlice';
import { USER_ROLES } from '../../../constants/userRoles';
import {
   loadProfile,
   updateProfile,
   fetchTrainingLevels,
   clearErrors,
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
import styles from './ProfileSettings.module.css';

// ============================================================================
// КОМПОНЕНТ ВЫБОРА РОЛИ
// ============================================================================
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

// ============================================================================
// КОМПОНЕНТ ВЫБОРА УРОВНЯ ПОДГОТОВКИ
// ============================================================================
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

// ============================================================================
// КОМПОНЕНТ ПОДСКАЗКИ
// ============================================================================
const RecommendationBox = ({ icon, title, message, hint }) => (
   <div className={styles.recommendationBox}>
      <span className={styles.recommendationIcon}>{icon}</span>
      <div>
         <strong>{title}</strong>
         <p>{message}</p>
         {hint && <small>{hint}</small>}
      </div>
   </div>
);

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================
const ProfileSettings = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   // ===== Redux селекторы =====
   const user = useSelector(selectUser);
   const authLoading = useSelector(selectAuthLoading);
   const profile = useSelector(selectProfile);
   const trainingLevels = useSelector(selectTrainingLevels);
   const isLoadingProfile = useSelector(selectIsLoading);
   const isSavingProfile = useSelector(selectIsSaving);
   const isLoadingLevels = useSelector(selectIsLoadingLevels);
   const profileError = useSelector(selectProfileError);
   const saveError = useSelector(selectSaveError);
   const isProfileLoaded = useSelector(selectIsProfileLoaded);

   // ===== Локальное состояние =====
   const [isLoading, setIsLoading] = useState(false);
   const [hasPendingRoleChange, setHasPendingRoleChange] = useState(false);
   const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
   const [pendingRoleChange, setPendingRoleChange] = useState(null);
   const [isFormDirty, setIsFormDirty] = useState(false);

   const [formData, setFormData] = useState({
      role: '',
      training_level: '',
      sport_specialization: '',
      allow_connections: true,
      userName: '',
      birthDate: ''
   });

   // ===== ЭФФЕКТЫ =====

   // 🔄 Загрузка профиля
   useEffect(() => {
      if (!isProfileLoaded && !isLoadingProfile && !profile) {
         dispatch(loadProfile());
      }
   }, [dispatch, isProfileLoaded, isLoadingProfile, profile]);

   // 🔄 Загрузка уровней подготовки
   useEffect(() => {
      if (trainingLevels.length === 0 && !isLoadingLevels) {
         dispatch(fetchTrainingLevels());
      }
   }, [dispatch, trainingLevels.length, isLoadingLevels]);

   // 🔄 Инициализация формы данными профиля
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
         setIsFormDirty(false);
      }
   }, [profile]);

   // 🔄 Сброс ошибок при размонтировании
   useEffect(() => {
      return () => {
         dispatch(clearErrors());
      };
   }, [dispatch]);

   // 🔄 Отображение ошибок из Redux
   useEffect(() => {
      if (profileError) {
         toast.error(`Ошибка загрузки профиля: ${profileError}`, {
            position: "top-right",
            autoClose: 5000,
         });
      }
      if (saveError) {
         toast.error(`Ошибка сохранения: ${saveError}`, {
            position: "top-right",
            autoClose: 5000,
         });
      }
   }, [profileError, saveError]);

   // ===== ОБРАБОТЧИКИ =====

   /**
    * Применяет смену роли в форме
    */
   const applyRoleChange = (newRole) => {
      setFormData(prev => ({
         ...prev,
         role: newRole,
         // Очищаем связанные поля при смене роли
         ...(newRole === USER_ROLES.TRAINEE && {
            sport_specialization: '',
            training_level: prev.training_level // Сохраняем уровень, если был
         }),
         ...(newRole === USER_ROLES.TRAINER && {
            training_level: '',
            sport_specialization: prev.sport_specialization // Сохраняем специализацию, если была
         })
      }));

      setHasPendingRoleChange(true);
      setIsFormDirty(true);

      toast.warning('🔄 Роль изменена. Не забудьте сохранить изменения!', {
         position: "top-right",
         autoClose: 5000,
      });
   };

   /**
    * Обработчик смены роли с подтверждением
    */
   const handleRoleChange = (newRole) => {
      if (formData.role === newRole) return;

      // Если роль уже была выбрана (не skipped) - показываем модалку
      if (formData.role && formData.role !== 'skipped' && newRole !== 'skipped') {
         setPendingRoleChange(newRole);
         setShowRoleChangeModal(true);
      } else {
         // Первичный выбор роли или со skipped
         applyRoleChange(newRole);
      }
   };

   /**
    * Подтверждение смены роли в модалке
    */
   const handleConfirmRoleChange = () => {
      if (pendingRoleChange) {
         applyRoleChange(pendingRoleChange);
         setShowRoleChangeModal(false);
         setPendingRoleChange(null);
      }
   };

   /**
    * Отмена смены роли
    */
   const handleCancelRoleChange = () => {
      setShowRoleChangeModal(false);
      setPendingRoleChange(null);
   };

   /**
    * Обработчик изменений полей формы
    */
   const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;

      let processedValue = value;
      if (name === 'sport_specialization') {
         // Форматируем специализацию: убираем лишние пробелы и запятые
         processedValue = value
            .replace(/\s*,\s*/g, ', ')
            .replace(/\s+/g, ' ')
            .trim();
      }

      setFormData(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : processedValue
      }));

      setIsFormDirty(true);
   };

   /**
    * Обработчик выбора уровня подготовки
    */
   const handleTrainingLevelChange = (level) => {
      setFormData(prev => ({ ...prev, training_level: level }));
      setIsFormDirty(true);
   };

   /**
    * ✅ ОПТИМИЗИРОВАННАЯ ВАЛИДАЦИЯ
    * Только критические ошибки блокируют отправку
    * Рекомендации не блокируют, а только предупреждают
    */
   const validateForm = () => {
      const errors = [];

      // ===== 🔴 КРИТИЧЕСКИЕ ОШИБКИ (блокируют отправку) =====

      // 1. Роль - ОБЯЗАТЕЛЬНА
      if (!formData.role || formData.role === 'skipped') {
         errors.push('❌ Выберите роль (Спортсмен или Тренер)');
      }

      // 2. Имя пользователя - ОБЯЗАТЕЛЬНО, минимум 2 символа
      if (!formData.userName.trim()) {
         errors.push('❌ Имя пользователя обязательно');
      } else if (formData.userName.trim().length < 2) {
         errors.push('❌ Имя пользователя должно содержать минимум 2 символа');
      } else if (formData.userName.trim().length > 50) {
         errors.push('❌ Имя пользователя не может превышать 50 символов');
      }

      // 3. Проверка даты рождения (только если указана)
      if (formData.birthDate) {
         const birthDate = new Date(formData.birthDate);
         const today = new Date();
         const minAgeDate = new Date();
         minAgeDate.setFullYear(today.getFullYear() - 100);
         const maxAgeDate = new Date();
         maxAgeDate.setFullYear(today.getFullYear() - 13);

         if (birthDate < minAgeDate) {
            errors.push('❌ Дата рождения не может быть ранее 100 лет назад');
         }
         if (birthDate > maxAgeDate) {
            errors.push('❌ Вам должно быть не менее 13 лет');
         }
      }

      // 4. Проверка существования выбранного уровня (если выбран)
      if (formData.role === USER_ROLES.TRAINEE && formData.training_level) {
         const levelExists = trainingLevels.some(level => level.id === formData.training_level);
         if (!levelExists) {
            errors.push('❌ Выбран несуществующий уровень подготовки');
         }
      }

      return errors;
   };

   /**
    * 🟡 ПОЛУЧЕНИЕ РЕКОМЕНДАЦИЙ (НЕ блокируют отправку)
    */
   const getRecommendations = () => {
      const recommendations = [];

      if (formData.role === USER_ROLES.TRAINEE && !formData.training_level) {
         recommendations.push('💡 Рекомендуем указать уровень подготовки для персонализированных тренировок');
      }

      if (formData.role === USER_ROLES.TRAINER && !formData.sport_specialization.trim()) {
         recommendations.push('💡 Рекомендуем указать специализацию, чтобы подопечные могли вас найти');
      }

      if (formData.role === USER_ROLES.TRAINEE && !formData.sport_specialization.trim()) {
         recommendations.push('💡 Укажите спортивные интересы для более точного подбора тренера');
      }

      if (formData.sport_specialization.trim().length > 200) {
         recommendations.push('💡 Специализация слишком длинная, рекомендуем сократить до 200 символов');
      }

      return recommendations;
   };

   /**
    * Отправка формы
    */
   const handleSubmit = async (e) => {
      e.preventDefault();

      const errors = validateForm();
      const recommendations = getRecommendations();

      // 🔴 БЛОКИРУЕМ отправку только при критических ошибках
      if (errors.length > 0) {
         errors.forEach(error => {
            toast.error(error, {
               position: "top-right",
               autoClose: 5000,
            });
         });
         return;
      }

      // 🟡 Показываем рекомендации, но НЕ блокируем отправку
      if (recommendations.length > 0) {
         recommendations.forEach(recommendation => {
            toast.info(recommendation, {
               position: "top-right",
               autoClose: 4000,
            });
         });
      }

      setIsLoading(true);

      try {
         // Подготовка данных для отправки
         const submitData = {
            role: formData.role,
            userName: formData.userName.trim(),
            allow_connections: formData.allow_connections
         };

         // Добавляем поля только если они заполнены
         if (formData.training_level) {
            submitData.training_level = formData.training_level;
         }

         if (formData.sport_specialization.trim()) {
            submitData.sport_specialization = formData.sport_specialization.trim();
         }

         // Добавляем дату рождения, если указана
         if (formData.birthDate) {
            submitData.birthDate = formData.birthDate;
         }

         console.log('🟡 Отправка данных профиля:', submitData);

         // Отправляем запрос на обновление
         const result = await dispatch(updateProfile(submitData)).unwrap();

         console.log('🟢 Профиль успешно обновлен:', result);

         // 🔥 КЛЮЧЕВОЕ: ОБНОВЛЯЕМ REDUX STORE!
         if (result.role) {
            dispatch(setUserRole(result.role));
            console.log('✅ Роль в Redux обновлена на:', result.role);
         }

         // Принудительно запрашиваем актуальный профиль
         await dispatch(loadProfile());

         // Сбрасываем состояния
         setHasPendingRoleChange(false);
         setIsFormDirty(false);
         setIsLoading(false);

         toast.success('✅ Профиль успешно обновлен!', {
            position: "top-right",
            autoClose: 3000,
         });

      } catch (error) {
         console.error('🔴 Ошибка обновления профиля:', error);

         toast.error(error.message || '❌ Произошла ошибка при обновлении профиля', {
            position: "top-right",
            autoClose: 5000,
         });

         setIsLoading(false);
      }
   };

   /**
    * Отмена изменений
    */
   const handleCancel = () => {
      if (isFormDirty || hasPendingRoleChange) {
         const userConfirmed = window.confirm(
            '⚠️ У вас есть несохраненные изменения. Вы уверены, что хотите отменить?'
         );
         if (!userConfirmed) return;
      }

      // Восстанавливаем исходные данные из профиля
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

      setIsLoading(false);
      setHasPendingRoleChange(false);
      setIsFormDirty(false);

      navigate('/profile');
   };

   // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

   /**
    * Форматирование возраста
    */
   const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
      return age;
   };

   /**
    * Проверка, нужно ли показывать блок с рекомендациями
    */
   const shouldShowRecommendations = () => {
      if (!formData.role || formData.role === 'skipped') return false;

      if (formData.role === USER_ROLES.TRAINEE && !formData.training_level) return true;
      if (formData.role === USER_ROLES.TRAINER && !formData.sport_specialization.trim()) return true;
      if (formData.role === USER_ROLES.TRAINEE && !formData.sport_specialization.trim()) return true;

      return false;
   };

   // ===== УСЛОВНЫЙ РЕНДЕРИНГ =====

   const isPageLoading = authLoading || isLoadingProfile;
   const isSaving = isLoading || isSavingProfile;
   const isSaveDisabled = isSaving || !isFormDirty;

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
            <button
               className={styles.retryButton}
               onClick={() => navigate('/login')}
            >
               Войти
            </button>
         </div>
      );
   }

   const displayUser = profile || user;

   // ===== ОСНОВНОЙ РЕНДЕРИНГ =====
   return (
      <>
         <div className={styles.settingsEnhancedContainer}>
            <header className={styles.settingsHeader}>
               <h1>Настройки профиля</h1>
               <p>Управление вашими персональными данными</p>
            </header>

            {/* Предупреждение о несохраненных изменениях */}
            {hasPendingRoleChange && (
               <div className={styles.warningMessage}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <strong>Несохраненная смена роли!</strong> Нажмите "Сохранить изменения" для подтверждения.
                  <button
                     className={styles.closeWarningButton}
                     onClick={() => {
                        setHasPendingRoleChange(false);
                        toast.info('Предупреждение скрыто', {
                           position: "top-right",
                           autoClose: 2000,
                        });
                     }}
                     aria-label="Закрыть предупреждение"
                  >
                     ×
                  </button>
               </div>
            )}

            {/* Блок рекомендаций */}
            {shouldShowRecommendations() && !isSaving && (
               <div className={styles.recommendationsContainer}>
                  {formData.role === USER_ROLES.TRAINEE && !formData.training_level && (
                     <RecommendationBox
                        icon="💪"
                        title="Уровень подготовки"
                        message="Укажите ваш уровень подготовки для получения персонализированных тренировок"
                        hint="Можно указать позже в настройках"
                     />
                  )}
                  {formData.role === USER_ROLES.TRAINER && !formData.sport_specialization.trim() && (
                     <RecommendationBox
                        icon="🎓"
                        title="Специализация"
                        message="Укажите вашу специализацию, чтобы подопечные могли вас найти"
                        hint="Можно указать позже в настройках"
                     />
                  )}
                  {formData.role === USER_ROLES.TRAINEE && !formData.sport_specialization.trim() && (
                     <RecommendationBox
                        icon="🎯"
                        title="Спортивные интересы"
                        message="Укажите ваши спортивные интересы для более точного подбора тренера"
                        hint="Можно указать позже в настройках"
                     />
                  )}
               </div>
            )}

            <form onSubmit={handleSubmit} className={styles.settingsForm}>
               <div className={styles.formSections}>

                  {/* ===== Секция 1: Основная информация ===== */}
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>👤</span>
                        Основная информация
                     </h2>

                     <div className={styles.formGroup}>
                        <label htmlFor="userName">
                           Имя пользователя <span className={styles.required}>*</span>
                        </label>
                        <input
                           type="text"
                           id="userName"
                           name="userName"
                           value={formData.userName}
                           onChange={handleInputChange}
                           placeholder="Введите ваше имя"
                           required
                           className={`${styles.textInput} ${formData.userName.trim().length < 2 && formData.userName.trim().length > 0 ? styles.inputError : ''}`}
                           disabled={isSaving}
                           maxLength={50}
                        />
                        <small className={styles.inputHint}>
                           {formData.userName.length}/50 символов
                           {formData.userName.trim().length < 2 && formData.userName.trim().length > 0 && (
                              <span className={styles.errorText}> минимум 2 символа</span>
                           )}
                        </small>
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
                              Возраст: {calculateAge(formData.birthDate)} лет
                           </small>
                        )}
                     </div>
                  </section>

                  {/* ===== Секция 2: Роль в системе ===== */}
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🎯</span>
                        Роль в системе <span className={styles.required}>*</span>
                     </h2>
                     <p className={styles.sectionDescription}>
                        Выберите вашу основную роль. Это определит доступные функции.
                     </p>

                     <RoleSelector
                        selectedRole={formData.role}
                        onRoleSelect={handleRoleChange}
                     />
                  </section>

                  {/* ===== Секция 3: Для спортсмена ===== */}
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
                                 <p>
                                    <strong>Рекомендуем указать уровень подготовки</strong>
                                    <br />
                                    Это поможет получать персонализированные тренировки
                                 </p>
                              </div>
                           )}
                        </section>

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
                                 {formData.sport_specialization.length}/200 символов
                              </small>
                           </div>

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

                  {/* ===== Секция 4: Для тренера ===== */}
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
                              {formData.sport_specialization.length}/200 символов
                           </small>
                        </div>

                        {!formData.sport_specialization.trim() && (
                           <div className={styles.infoBox}>
                              <span className={styles.infoIcon}>💡</span>
                              <p>
                                 <strong>Рекомендуем указать специализацию</strong>
                                 <br />
                                 Это поможет подопечным найти вас
                              </p>
                           </div>
                        )}

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

                  {/* ===== Секция 5: Настройки приватности ===== */}
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

                  {/* ===== Секция 6: Учетная запись ===== */}
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
                              {new Date(displayUser.createdAt || Date.now()).toLocaleDateString('ru-RU', {
                                 day: 'numeric',
                                 month: 'long',
                                 year: 'numeric'
                              })}
                           </span>
                        </div>
                        {displayUser.updatedAt && (
                           <div className={styles.infoRow}>
                              <span className={styles.infoLabel}>Последнее обновление:</span>
                              <span className={styles.infoValue}>
                                 {new Date(displayUser.updatedAt).toLocaleString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                 })}
                              </span>
                           </div>
                        )}
                     </div>
                  </section>
               </div>

               {/* ===== Кнопки действий ===== */}
               <div className={styles.formActions}>
                  <button
                     type="button"
                     onClick={handleCancel}
                     className={styles.cancelButton}
                     disabled={isSaving}
                  >
                     {isFormDirty ? 'Отменить изменения' : 'Назад'}
                  </button>

                  <button
                     type="submit"
                     className={styles.submitButton}
                     disabled={isSaveDisabled}
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
                  <p>
                     <span className={styles.required}>*</span> Обязательные для заполнения поля
                  </p>
                  {isFormDirty && (
                     <p className={styles.unsavedHint}>
                        ⚠️ Есть несохраненные изменения
                     </p>
                  )}
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