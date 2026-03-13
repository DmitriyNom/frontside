import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateOnboarding, setTempData, resetOnboarding } from '../../../features/onboardingSlice';
import { setUserRole, fetchUserProfile } from '../../../features/authSlice'; // ✅ Импортируем fetchUserProfile
import { USER_ROLES, needsOnboarding } from '../../../constants/userRoles';
import styles from './OnboardingPage.module.css';

const OnboardingPage = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const { user } = useSelector(state => state.auth);
   const { tempData, isLoading, error } = useSelector(state => state.onboarding);

   const [selectedRole, setSelectedRole] = useState(tempData.role || null);
   const [skipAttempted, setSkipAttempted] = useState(false);
   const [skipCompleted, setSkipCompleted] = useState(false);
   const [selectedLevel, setSelectedLevel] = useState(tempData.training_level || null);

   const userNeedsOnboarding = user && needsOnboarding(user.role);

   const handleRoleSelect = (role) => {
      console.log('🟢 Выбрана роль:', role);
      setSelectedRole(role);

      // ✅ Сохраняем только роль, БЕЗ userName!
      dispatch(setTempData({ role }));

      // Сбрасываем уровень при смене роли
      if (role !== USER_ROLES.TRAINEE) {
         setSelectedLevel(null);
      }
   };

   const handleLevelSelect = (level) => {
      console.log('🟢 Выбран уровень:', level);
      setSelectedLevel(level);
      dispatch(setTempData({ training_level: level }));
   };

   const handleSubmit = async () => {
      if (!selectedRole) {
         alert('Пожалуйста, выберите вашу роль');
         return;
      }

      try {
         console.log('🟡 Отправляем роль на сервер:', selectedRole);

         // ✅ Отправляем ТОЛЬКО роль и минимальные данные
         const submitData = { role: selectedRole };

         // Добавляем уровень подготовки только для спортсмена
         if (selectedRole === USER_ROLES.TRAINEE && selectedLevel) {
            submitData.training_level = selectedLevel;
         }

         console.log('🟡 Отправляемые данные:', submitData);

         const result = await dispatch(updateOnboarding(submitData)).unwrap();
         console.log('🟢 Ответ от сервера:', result);

         // ✅ 1. Обновляем роль в Redux
         dispatch(setUserRole(selectedRole));

         // ✅ 2. КРИТИЧЕСКИ ВАЖНО: Загружаем полный профиль!
         console.log('🟡 Загружаем полный профиль...');
         await dispatch(fetchUserProfile());
         console.log('🟢 Профиль загружен');

         // ✅ 3. Очищаем onboarding состояние
         dispatch(resetOnboarding());

         console.log('🟢 Онбординг завершен, редирект на профиль');
         navigate('/profile', { replace: true });

      } catch (error) {
         console.error('🔴 Ошибка сохранения роли:', error);
         alert(`Ошибка сохранения роли: ${error.message}`);
      }
   };

   const handleSkip = async () => {
      console.log('🟡 Нажата кнопка "Пропустить"');

      if (skipAttempted || skipCompleted) {
         console.log('⚠️ Пропуск уже в процессе или завершен');
         return;
      }

      if (user?.role === USER_ROLES.SKIPPED) {
         console.log('🟢 Уже есть role="skipped", редирект');
         navigate('/profile', { replace: true });
         return;
      }

      setSkipAttempted(true);
      console.log('🟡 Начинаем процесс пропуска...');

      try {
         // ✅ Отправляем ТОЛЬКО роль skipped
         const submitData = { role: USER_ROLES.SKIPPED };

         console.log('🟡 Отправляем данные пропуска:', submitData);

         const result = await dispatch(updateOnboarding(submitData)).unwrap();
         console.log('🟢 Ответ от сервера:', result);

         // ✅ 1. Обновляем роль в Redux
         dispatch(setUserRole(USER_ROLES.SKIPPED));

         // ✅ 2. КРИТИЧЕСКИ ВАЖНО: Загружаем полный профиль!
         console.log('🟡 Загружаем полный профиль...');
         await dispatch(fetchUserProfile());
         console.log('🟢 Профиль загружен');

         // ✅ 3. Очищаем onboarding состояние
         dispatch(resetOnboarding());

         setSkipCompleted(true);
         console.log('🟢 Пропуск завершен, редирект');
         navigate('/profile', { replace: true });

      } catch (error) {
         console.error('🔴 Ошибка при пропуске:', error);

         // ✅ РЕЗЕРВНЫЙ СЦЕНАРИЙ: пропускаем локально
         console.log('⚠️ Ошибка сервера, пропускаем локально');

         // Обновляем роль локально
         dispatch(setUserRole(USER_ROLES.SKIPPED));

         // Пытаемся загрузить профиль
         try {
            await dispatch(fetchUserProfile());
         } catch (profileError) {
            console.warn('⚠️ Не удалось загрузить профиль:', profileError);
         }

         // Очищаем onboarding
         dispatch(resetOnboarding());

         setSkipCompleted(true);
         navigate('/profile', { replace: true });
      }
   };

   // ✅ РЕДИРЕКТ при наличии роли
   useEffect(() => {
      if (skipCompleted) {
         console.log('🟡 useEffect: skipCompleted=true');
         return;
      }

      if (user?.role && (
         user.role === USER_ROLES.SKIPPED ||
         user.role === USER_ROLES.TRAINEE ||
         user.role === USER_ROLES.TRAINER
      )) {
         console.log('🟡 useEffect: Уже есть роль', user.role);
         navigate('/profile', { replace: true });
      }
   }, [user, navigate, skipCompleted]);

   // ✅ Очистка при размонтировании
   useEffect(() => {
      return () => {
         // Не очищаем здесь, чтобы не сбрасывать данные при редиректе
      };
   }, []);

   if (user && !userNeedsOnboarding) {
      console.log('🟡 Onboarding не нужен');
      return null;
   }

   if (skipAttempted && !skipCompleted) {
      return (
         <div className={styles.onboardingPage}>
            <div className={styles.container}>
               <div className={styles.header}>
                  <h1>Пропускаем onboarding... ⏳</h1>
                  <p>Пожалуйста, подождите</p>
               </div>
               <div className={styles.loading}>
                  <div className={styles.spinner}></div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className={styles.onboardingPage}>
         <div className={styles.container}>
            <div className={styles.header}>
               <h1>Добро пожаловать! 👋</h1>
               <p>Выберите вашу роль для персонализации опыта</p>
            </div>

            <div className={styles.roleSelection}>
               <div
                  className={`${styles.roleCard} ${selectedRole === USER_ROLES.TRAINEE ? styles.selected : ''}`}
                  onClick={() => handleRoleSelect(USER_ROLES.TRAINEE)}
               >
                  <div className={styles.icon}>🏃‍♂️</div>
                  <h3>Спортсмен</h3>
                  <p>Буду тренироваться и выполнять задания</p>
               </div>

               <div
                  className={`${styles.roleCard} ${selectedRole === USER_ROLES.TRAINER ? styles.selected : ''}`}
                  onClick={() => handleRoleSelect(USER_ROLES.TRAINER)}
               >
                  <div className={styles.icon}>👨‍🏫</div>
                  <h3>Тренер</h3>
                  <p>Буду создавать программы и руководить</p>
               </div>
            </div>

            {/* ✅ Показываем выбор уровня только для спортсмена */}
            {selectedRole === USER_ROLES.TRAINEE && (
               <div className={styles.levelSelection}>
                  <h3>Уровень подготовки (рекомендуем указать)</h3>
                  <div className={styles.levelOptions}>
                     <button
                        className={`${styles.levelButton} ${selectedLevel === 'beginner' ? styles.selected : ''}`}
                        onClick={() => handleLevelSelect('beginner')}
                     >
                        Начинающий
                     </button>
                     <button
                        className={`${styles.levelButton} ${selectedLevel === 'intermediate' ? styles.selected : ''}`}
                        onClick={() => handleLevelSelect('intermediate')}
                     >
                        Средний
                     </button>
                     <button
                        className={`${styles.levelButton} ${selectedLevel === 'advanced' ? styles.selected : ''}`}
                        onClick={() => handleLevelSelect('advanced')}
                     >
                        Продвинутый
                     </button>
                  </div>
                  <p className={styles.levelHint}>Можно указать позже в настройках</p>
               </div>
            )}

            {error && (
               <div className={styles.error}>
                  ❌ Ошибка: {error}
               </div>
            )}

            <div className={styles.actions}>
               <button
                  className={styles.skipButton}
                  onClick={handleSkip}
                  disabled={isLoading || skipAttempted || skipCompleted}
               >
                  {isLoading || skipAttempted ? '⏳ Пропускаем...' : '⏩ Пропустить'}
               </button>
               <button
                  className={styles.continueButton}
                  onClick={handleSubmit}
                  disabled={!selectedRole || isLoading || skipAttempted || skipCompleted}
               >
                  {isLoading ? '⏳ Сохранение...' : '✅ Подтвердить'}
               </button>
            </div>

            {/* Отладка (можно убрать в продакшне) */}
            <div className={styles.debugInfo}>
               <p>Роль: {selectedRole || 'не выбрана'}</p>
               <p>Уровень: {selectedLevel || 'не указан'}</p>
               <p>Загрузка: {isLoading ? 'да' : 'нет'}</p>
               <p>Пользователь: {user?.email} | роль: {user?.role}</p>
            </div>
         </div>
      </div>
   );
};

export default OnboardingPage;