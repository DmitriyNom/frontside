// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { loginUser, clearError, selectLoading, selectError, selectUser } from '../../features/authSlice';
// import { toast } from 'react-toastify';
// import styles from './LoginForm.module.css';

// const LoginForm = () => {
//    const dispatch = useDispatch();
//    const navigate = useNavigate();

//    const loading = useSelector(selectLoading);
//    const error = useSelector(selectError);
//    const user = useSelector(selectUser);

//    const [form, setForm] = useState({
//       email: '',
//       password: '',
//    });

//    const [validationErrors, setValidationErrors] = useState({});

//    const handleChange = e => {
//       setForm(prev => ({
//          ...prev,
//          [e.target.name]: e.target.value,
//       }));

//       if (error) {
//          dispatch(clearError());
//       }

//       // Очищаем ошибки валидации при изменении поля
//       if (validationErrors[e.target.name]) {
//          setValidationErrors(prev => ({
//             ...prev,
//             [e.target.name]: ''
//          }));
//       }
//    };

//    const validate = () => {
//       const errors = {};
//       if (!form.email) errors.email = 'Email обязателен';
//       else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Неверный формат email';

//       if (!form.password) errors.password = 'Пароль обязателен';
//       return errors;
//    };

//    const handleSubmit = async e => {
//       e.preventDefault();

//       const errors = validate();
//       setValidationErrors(errors);

//       if (Object.keys(errors).length === 0) {
//          dispatch(clearError());

//          const resultAction = await dispatch(loginUser(form));

//          if (loginUser.fulfilled.match(resultAction)) {
//             const userData = resultAction.payload;
//             const welcomeMessage = getWelcomeMessage(userData);
//             toast.success(welcomeMessage);
//             navigate('/profile');
//          }
//       }
//    };

//    // Функция для персонализированного приветствия
//    const getWelcomeMessage = (userData) => {
//       if (!userData) return 'Вход выполнен успешно!';

//       const role = userData.role || 'trainee';
//       const userName = userData.userName || '';

//       if (role === 'trainer') {
//          return `Добро пожаловать, тренер ${userName}! 🏆`;
//       } else if (role === 'trainee') {
//          return `С возвращением, ${userName}! 💪`;
//       }

//       return `Добро пожаловать, ${userName}!`;
//    };

//    useEffect(() => {
//       if (error) {
//          toast.error(`Ошибка входа: ${error}`);
//       }
//    }, [error]);

//    useEffect(() => {
//       if (user) {
//          navigate('/profile');
//       }
//    }, [user, navigate]);

//    return (
//       <div className={styles.loginContainer}>
//          <div className={styles.loginCard}>
//             <div className={styles.loginHeader}>
//                <h2>Добро пожаловать</h2>
//                <p>Войдите в тренировочную платформу</p>
//                <div className={styles.platformHint}>
//                   💪 Станьте лучше с каждым днем!
//                </div>
//             </div>

//             <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
//                <div className={styles.formGroup}>
//                   <label className={styles.label} htmlFor="email">
//                      Email
//                      <span className={styles.required}>*</span>
//                   </label>
//                   <input
//                      className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
//                      type="email"
//                      id="email"
//                      name="email"
//                      value={form.email}
//                      onChange={handleChange}
//                      disabled={loading}
//                      autoComplete="username"
//                      placeholder="your@email.com"
//                   />
//                   {validationErrors.email && (
//                      <div className={styles.validationError}>
//                         <span className={styles.errorIcon}>⚠️</span>
//                         {validationErrors.email}
//                      </div>
//                   )}
//                </div>

//                <div className={styles.formGroup}>
//                   <label className={styles.label} htmlFor="password">
//                      Пароль
//                      <span className={styles.required}>*</span>
//                   </label>
//                   <input
//                      className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
//                      type="password"
//                      id="password"
//                      name="password"
//                      value={form.password}
//                      onChange={handleChange}
//                      disabled={loading}
//                      autoComplete="current-password"
//                      placeholder="Введите ваш пароль"
//                   />
//                   {validationErrors.password && (
//                      <div className={styles.validationError}>
//                         <span className={styles.errorIcon}>⚠️</span>
//                         {validationErrors.password}
//                      </div>
//                   )}
//                </div>

//                {error && (
//                   <div className={styles.errorContainer}>
//                      <span className={styles.errorIcon}>❌</span>
//                      <span className={styles.errorMessage}>{error}</span>
//                   </div>
//                )}

//                <button
//                   className={styles.submitButton}
//                   type="submit"
//                   disabled={loading}
//                >
//                   {loading ? (
//                      <>
//                         <div className={styles.spinner}></div>
//                         Вход...
//                      </>
//                   ) : (
//                      'Войти в аккаунт'
//                   )}
//                </button>

//                <div className={styles.registerLink}>
//                   <p>Еще нет аккаунта?</p>
//                   <Link to="/register" className={styles.link}>
//                      Создать аккаунт
//                   </Link>
//                   <div className={styles.registrationHint}>
//                      Выберите роль: 👤 Спортсмен или 🏆 Тренер
//                   </div>
//                </div>
//             </form>
//          </div>
//       </div>
//    );
// };

// export default LoginForm;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, selectLoading, selectError } from '../../features/authSlice';
import { toast } from 'react-toastify';
import styles from './LoginForm.module.css';

const LoginForm = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);

   const [form, setForm] = useState({
      email: '',
      password: '',
   });

   const [validationErrors, setValidationErrors] = useState({});
   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleChange = e => {
      setForm(prev => ({
         ...prev,
         [e.target.name]: e.target.value,
      }));

      if (error) {
         dispatch(clearError());
      }

      if (validationErrors[e.target.name]) {
         setValidationErrors(prev => ({
            ...prev,
            [e.target.name]: ''
         }));
      }
   };

   const validate = () => {
      const errors = {};
      if (!form.email) errors.email = 'Email обязателен';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Неверный формат email';

      if (!form.password) errors.password = 'Пароль обязателен';
      return errors;
   };

   const getWelcomeMessage = (userData) => {
      if (!userData) return 'Вход выполнен успешно!';
      const role = userData.role || 'trainee';
      const userName = userData.userName || '';
      if (role === 'trainer') {
         return `Добро пожаловать, тренер ${userName}! 🏆`;
      } else if (role === 'trainee') {
         return `С возвращением, ${userName}! 💪`;
      }
      return `Добро пожаловать, ${userName}!`;
   };

   const handleSubmit = async e => {
      e.preventDefault();

      if (isSubmitting) return;

      const errors = validate();
      setValidationErrors(errors);

      if (Object.keys(errors).length === 0) {
         setIsSubmitting(true);
         dispatch(clearError());

         const resultAction = await dispatch(loginUser(form));

         if (loginUser.fulfilled.match(resultAction)) {
            const userData = resultAction.payload;
            const welcomeMessage = getWelcomeMessage(userData);
            toast.success(welcomeMessage);
            // ✅ Редирект после успешного логина
            navigate('/profile');
         }
         setIsSubmitting(false);
      }
   };

   useEffect(() => {
      if (error) {
         toast.error(`Ошибка входа: ${error}`);
         setIsSubmitting(false);
      }
   }, [error]);

   // ✅ УДАЛЕН useEffect с редиректом на user - он вызывал лишние редиректы

   return (
      <div className={styles.loginContainer}>
         <div className={styles.loginCard}>
            <div className={styles.loginHeader}>
               <h2>Добро пожаловать</h2>
               <p>Войдите в тренировочную платформу</p>
               <div className={styles.platformHint}>
                  💪 Станьте лучше с каждым днем!
               </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
               <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="email">
                     Email
                     <span className={styles.required}>*</span>
                  </label>
                  <input
                     className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
                     type="email"
                     id="email"
                     name="email"
                     value={form.email}
                     onChange={handleChange}
                     disabled={loading || isSubmitting}
                     autoComplete="username"
                     placeholder="your@email.com"
                  />
                  {validationErrors.email && (
                     <div className={styles.validationError}>
                        <span className={styles.errorIcon}>⚠️</span>
                        {validationErrors.email}
                     </div>
                  )}
               </div>

               <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="password">
                     Пароль
                     <span className={styles.required}>*</span>
                  </label>
                  <input
                     className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
                     type="password"
                     id="password"
                     name="password"
                     value={form.password}
                     onChange={handleChange}
                     disabled={loading || isSubmitting}
                     autoComplete="current-password"
                     placeholder="Введите ваш пароль"
                  />
                  {validationErrors.password && (
                     <div className={styles.validationError}>
                        <span className={styles.errorIcon}>⚠️</span>
                        {validationErrors.password}
                     </div>
                  )}
               </div>

               {error && (
                  <div className={styles.errorContainer}>
                     <span className={styles.errorIcon}>❌</span>
                     <span className={styles.errorMessage}>{error}</span>
                  </div>
               )}

               <button
                  className={styles.submitButton}
                  type="submit"
                  disabled={loading || isSubmitting}
               >
                  {loading || isSubmitting ? (
                     <>
                        <div className={styles.spinner}></div>
                        Вход...
                     </>
                  ) : (
                     'Войти в аккаунт'
                  )}
               </button>

               <div className={styles.registerLink}>
                  <p>Еще нет аккаунта?</p>
                  <Link to="/register" className={styles.link}>
                     Создать аккаунт
                  </Link>
                  <div className={styles.registrationHint}>
                     Выберите роль: 👤 Спортсмен или 🏆 Тренер
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
};

export default LoginForm;