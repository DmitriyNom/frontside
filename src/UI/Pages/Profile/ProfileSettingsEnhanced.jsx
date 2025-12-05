// src/UI/Pages/Profile/ProfileSettingsEnhanced.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
   selectUser,
   selectLoading as selectAuthLoading,
   selectError as selectAuthError,
   setUserRole,
   updateUserProfile
} from '../../../features/authSlice';
import { updateOnboarding } from '../../../features/onboardingSlice';
import { USER_ROLES, getUserRoleLabel } from '../../../constants/userRoles';
import { TRAINING_LEVELS, getTrainingLevelLabel } from '../../../constants/trainingLevels';
import styles from './Profile.module.css';

// Компонент выбора роли (реиспользуем логику из onboarding)
const RoleSelector = ({ selectedRole, onRoleSelect }) => {
   return (
      <div className={styles.roleSelectorEnhanced}>
         <div className={styles.roleOptions}>
            <button
               className={`${styles.roleOption} ${selectedRole === USER_ROLES.TRAINEE ? styles.selected : ''}`}
               onClick={() => onRoleSelect(USER_ROLES.TRAINEE)}
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
const TrainingLevelSelector = ({ value, onChange }) => {
   return (
      <div className={styles.trainingLevelSelector}>
         <div className={styles.levelOptions}>
            {TRAINING_LEVELS.map((level) => (
               <button
                  key={level.value}
                  className={`${styles.levelOption} ${value === level.value ? styles.selected : ''}`}
                  onClick={() => onChange(level.value)}
                  title={level.description}
               >
                  <div className={styles.levelIcon}>{level.label.split(' ')[0]}</div>
                  <div className={styles.levelInfo}>
                     <h4>{level.label.split(' ').slice(1).join(' ')}</h4>
                     <p>{level.description}</p>
                  </div>
               </button>
            ))}
         </div>
      </div>
   );
};

// Основной компонент страницы настроек
const ProfileSettingsEnhanced = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const user = useSelector(selectUser);
   const authLoading = useSelector(selectAuthLoading);
   const authError = useSelector(selectAuthError);

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState(null);
   const [successMessage, setSuccessMessage] = useState(null);

   const [formData, setFormData] = useState({
      role: '',
      training_level: '',
      sport_specialization: '',
      allow_connections: true,
      userName: '',
      birthDate: ''
   });

   // Инициализация формы данными пользователя
   useEffect(() => {
      if (user) {
         setFormData({
            role: user.role || '',
            training_level: user.training_level || '',
            sport_specialization: user.sport_specialization || '',
            allow_connections: user.allow_connections !== false,
            userName: user.userName || '',
            birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
         });
      }
   }, [user]);

   const handleRoleChange = (newRole) => {
      if (formData.role === newRole) return;

      // Показываем предупреждение при смене роли
      if (formData.role && formData.role !== 'skipped' && newRole !== 'skipped') {
         const confirmed = window.confirm(
            `Вы уверены, что хотите сменить роль с "${getUserRoleLabel(formData.role)}" на "${getUserRoleLabel(newRole)}"?\n\n` +
            `Это может повлиять на доступные вам функции.`
         );

         if (!confirmed) return;
      }

      setFormData(prev => ({
         ...prev,
         role: newRole,
         // Очищаем связанные поля при смене роли
         ...(newRole === USER_ROLES.TRAINEE && { sport_specialization: '' }),
         ...(newRole === USER_ROLES.TRAINER && { training_level: '' })
      }));

      setSuccessMessage(null);
      setError(null);
   };

   const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : value
      }));
      setSuccessMessage(null);
      setError(null);
   };

   const validateForm = () => {
      const errors = [];

      if (!formData.role || formData.role === 'skipped') {
         errors.push('Выберите роль (Спортсмен или Тренер)');
      }

      if (formData.role === USER_ROLES.TRAINEE && !formData.training_level) {
         errors.push('Для спортсмена необходимо указать уровень подготовки');
      }

      if (formData.role === USER_ROLES.TRAINER && !formData.sport_specialization.trim()) {
         errors.push('Для тренера необходимо указать специализацию');
      }

      if (!formData.userName.trim()) {
         errors.push('Имя пользователя обязательно');
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
            userName: formData.userName,
            allow_connections: formData.allow_connections
         };

         // Добавляем поля в зависимости от роли
         if (formData.role === USER_ROLES.TRAINEE && formData.training_level) {
            submitData.training_level = formData.training_level;
         }

         if (formData.role === USER_ROLES.TRAINER && formData.sport_specialization) {
            submitData.sport_specialization = formData.sport_specialization.trim();
         }

         // Добавляем дату рождения, если указана
         if (formData.birthDate) {
            submitData.birthDate = formData.birthDate;
         }

         console.log('🟡 Отправляем данные профиля:', submitData);

         // Используем существующий endpoint onboarding для обновления роли
         const result = await dispatch(updateOnboarding(submitData)).unwrap();

         console.log('🟢 Профиль обновлен:', result);

         // Обновляем пользователя в Redux
         dispatch(setUserRole(result.role));

         setSuccessMessage('Профиль успешно обновлен!');
         setIsLoading(false);

         // Автоматически скрываем сообщение об успехе через 3 секунды
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
      // Возвращаемся к предыдущей странице
      navigate(-1);
   };

   if (authLoading) {
      return (
         <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
         </div>
      );
   }

   if (!user) {
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

   return (
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
            </div>
         )}

         {successMessage && (
            <div className={styles.successMessage}>
               <span className={styles.successIcon}>✅</span>
               {successMessage}
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
                     />
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
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>💪</span>
                        Уровень подготовки *
                     </h2>
                     <p className={styles.sectionDescription}>
                        Укажите ваш текущий уровень физической подготовки
                     </p>

                     <TrainingLevelSelector
                        value={formData.training_level}
                        onChange={(level) => setFormData(prev => ({ ...prev, training_level: level }))}
                     />
                  </section>
               )}

               {formData.role === USER_ROLES.TRAINER && (
                  <section className={styles.formSection}>
                     <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🎓</span>
                        Специализация *
                     </h2>
                     <p className={styles.sectionDescription}>
                        Укажите вашу спортивную специализацию как тренера
                     </p>

                     <div className={styles.formGroup}>
                        <input
                           type="text"
                           name="sport_specialization"
                           value={formData.sport_specialization}
                           onChange={handleInputChange}
                           placeholder="Например: Фитнес, Бокс, Йога, Плавание..."
                           className={styles.textInput}
                           required={formData.role === USER_ROLES.TRAINER}
                        />
                        <small className={styles.inputHint}>
                           Максимум 100 символов
                        </small>
                     </div>
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
                        />
                        <span className={styles.checkboxCustom}></span>
                        <div className={styles.checkboxText}>
                           <strong>Разрешить подключения</strong>
                           <p>Другие пользователи могут найти вас и отправить запрос на подключение</p>
                        </div>
                     </label>
                  </div>
               </section>

               {/* Секция 5: Текущие настройки (только для просмотра) */}
               <section className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>
                     <span className={styles.sectionIcon}>📧</span>
                     Учетная запись
                  </h2>

                  <div className={styles.readOnlyInfo}>
                     <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Email:</span>
                        <span className={styles.infoValue}>{user.email}</span>
                     </div>
                     <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>ID пользователя:</span>
                        <span className={styles.infoValue}>{user.id}</span>
                     </div>
                     <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Дата регистрации:</span>
                        <span className={styles.infoValue}>
                           {new Date(user.createdAt || Date.now()).toLocaleDateString('ru-RU')}
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
                  disabled={isLoading}
               >
                  Отмена
               </button>

               <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
               >
                  {isLoading ? (
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
            </div>
         </form>
      </div>
   );
};

export default ProfileSettingsEnhanced;