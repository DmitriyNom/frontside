import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateOnboarding, setTempData } from '../../../features/onboardingSlice';
import { setUserRole } from '../../../features/authSlice';
import { USER_ROLES, needsOnboarding } from '../../../constants/userRoles';
import styles from './OnboardingPage.module.css';

const OnboardingPage = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   // Берем данные из двух slices
   const { user } = useSelector(state => state.auth);
   const { tempData, isLoading, error } = useSelector(state => state.onboarding);

   const [selectedRole, setSelectedRole] = useState(tempData.role || null);
   const [skipAttempted, setSkipAttempted] = useState(false); // Отслеживаем попытку пропуска
   const [skipCompleted, setSkipCompleted] = useState(false); // ✅ Отслеживаем успешное завершение пропуска

   // Проверяем, нужен ли пользователю onboarding
   const userNeedsOnboarding = user && needsOnboarding(user.role);

   const handleRoleSelect = (role) => {
      console.log('🟢 Выбрана роль:', role);
      setSelectedRole(role);
      dispatch(setTempData({ role }));
   };

   const handleSubmit = async () => {
      if (!selectedRole) {
         alert('Пожалуйста, выберите вашу роль');
         return;
      }

      try {
         console.log('🟡 Отправляем роль на сервер:', selectedRole);
         const result = await dispatch(updateOnboarding({ role: selectedRole })).unwrap();

         dispatch(setUserRole(result.role));
         console.log('🟢 Роль успешно сохранена:', result.role);

         // Редирект после успеха
         navigate('/profile', { replace: true });
      } catch (error) {
         console.error('🔴 Ошибка сохранения роли:', error);
         alert(`Ошибка сохранения роли: ${error.message}`);
      }
   };

   const handleSkip = async () => {
      console.log('🟡 Нажата кнопка "Пропустить"');

      // ✅ ПРОВЕРКА 1: Если пропуск уже в процессе или уже завершен - игнорируем
      if (skipAttempted || skipCompleted) {
         console.log('⚠️ Пропуск уже в процессе или завершен, игнорируем нажатие');
         return;
      }

      // ✅ ПРОВЕРКА 2: Если уже есть роль 'skipped' - сразу редирект
      if (user?.role === USER_ROLES.SKIPPED) {
         console.log('🟢 Уже есть role="skipped", редирект');
         navigate('/profile', { replace: true });
         return;
      }

      setSkipAttempted(true);
      console.log('🟡 Начинаем процесс пропуска...');

      try {
         // ✅ ШАГ 1: Отправляем запрос на сервер
         console.log('🟡 Отправляем role="skipped" на сервер');
         const result = await dispatch(updateOnboarding({
            role: USER_ROLES.SKIPPED,
            skipped: true // для обратной совместимости
         })).unwrap();

         console.log('🟢 Сервер ответил успешно:', result);

         // ✅ ШАГ 2: Обновляем роль в Redux
         dispatch(setUserRole(USER_ROLES.SKIPPED));

         // ✅ ШАГ 3: Помечаем пропуск как завершенный
         setSkipCompleted(true);
         console.log('🟢 Пропуск помечен как завершенный');

         // ✅ ШАГ 4: Немедленный редирект
         console.log('🟢 Выполняем редирект на /profile');
         navigate('/profile', { replace: true });

      } catch (error) {
         console.error('🔴 Ошибка при пропуске:', error);

         // ✅ РЕЗЕРВНЫЙ СЦЕНАРИЙ: При ошибке сервера пропускаем локально
         console.log('⚠️ Ошибка сервера, пропускаем локально');

         // Обновляем роль локально
         dispatch(setUserRole(USER_ROLES.SKIPPED));

         // Помечаем как завершенный
         setSkipCompleted(true);

         // Выполняем редирект
         setTimeout(() => {
            console.log('🟢 Локальный редирект на /profile');
            navigate('/profile', { replace: true });
         }, 50);

         // Разблокируем для повторной попытки (если редирект не сработает)
         setTimeout(() => {
            if (window.location.pathname.includes('/onboarding')) {
               console.log('⚠️ Редирект не сработал, разблокируем кнопку');
               setSkipAttempted(false);
            }
         }, 1000);
      }
   };

   // ✅ УПРОЩЕННАЯ ПРОВЕРКА ДЛЯ РЕДИРЕКТА
   useEffect(() => {
      // Если пропуск уже завершен - сразу редирект
      if (skipCompleted) {
         console.log('🟡 useEffect: skipCompleted=true, редирект');
         navigate('/profile', { replace: true });
         return;
      }

      // Если у пользователя уже есть валидная роль
      if (user?.role && (user.role === USER_ROLES.SKIPPED ||
         user.role === USER_ROLES.TRAINEE ||
         user.role === USER_ROLES.TRAINER)) {
         console.log('🟡 useEffect: Уже есть роль', user.role, ', редирект');
         navigate('/profile', { replace: true });
      }
   }, [user, navigate, skipCompleted]);

   // Если onboarding не нужен, не показываем страницу
   if (user && !userNeedsOnboarding) {
      console.log('🟡 Onboarding не нужен, скрываем страницу');
      return null;
   }

   // ✅ Показываем состояние загрузки при пропуске
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
            {/* Заголовок */}
            <div className={styles.header}>
               <h1>Добро пожаловать! 👋</h1>
               <p>Выберите вашу роль для персонализации опыта</p>
            </div>

            {/* Выбор роли */}
            <div className={styles.roleSelection}>
               <div
                  className={`${styles.roleCard} ${selectedRole === 'trainee' ? styles.selected : ''}`}
                  onClick={() => handleRoleSelect('trainee')}
               >
                  <div className={styles.icon}>🏃‍♂️</div>
                  <h3>Спортсмен</h3>
                  <p>Буду тренироваться и выполнять задания</p>
                  <ul className={styles.features}>
                     <li>✅ Получение тренировочных программ</li>
                     <li>✅ Отслеживание прогресса</li>
                     <li>✅ Работа с тренером</li>
                  </ul>
               </div>

               <div
                  className={`${styles.roleCard} ${selectedRole === 'trainer' ? styles.selected : ''}`}
                  onClick={() => handleRoleSelect('trainer')}
               >
                  <div className={styles.icon}>👨‍🏫</div>
                  <h3>Тренер</h3>
                  <p>Буду создавать программы и руководить</p>
                  <ul className={styles.features}>
                     <li>✅ Создание тренировочных планов</li>
                     <li>✅ Управление спортсменами</li>
                     <li>✅ Анализ прогресса подопечных</li>
                  </ul>
               </div>
            </div>

            {/* Показ ошибок */}
            {error && (
               <div className={styles.error}>
                  ❌ Ошибка: {error}
               </div>
            )}

            {/* Кнопки действий */}
            <div className={styles.actions}>
               <button
                  className={styles.skipButton}
                  onClick={handleSkip}
                  disabled={isLoading || skipAttempted || skipCompleted}
               >
                  {isLoading || skipAttempted ? '⏳ Пропускаем...' : '⏩ Пропустить (выбрать позже)'}
               </button>
               <button
                  className={styles.continueButton}
                  onClick={handleSubmit}
                  disabled={!selectedRole || isLoading || skipAttempted || skipCompleted}
               >
                  {isLoading ? '⏳ Сохранение...' : '✅ Подтвердить выбор'}
               </button>
            </div>

            {/* Отладочная информация */}
            <div className={styles.debugInfo}>
               <p><strong>Отладка:</strong> Роль: {selectedRole || 'не выбрана'} | Загрузка: {isLoading ? 'да' : 'нет'}</p>
               <p><strong>Статус пропуска:</strong> Попытка: {skipAttempted ? 'да' : 'нет'} | Завершен: {skipCompleted ? 'да' : 'нет'}</p>
               <p><strong>Пользователь:</strong> {user?.email} | Роль: {user?.role || 'не выбрана'} | needsOnboarding: {userNeedsOnboarding ? 'да' : 'нет'}</p>
            </div>
         </div>
      </div>
   );
};

export default OnboardingPage;