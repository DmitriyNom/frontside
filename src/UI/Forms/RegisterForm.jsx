// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { registerUser, fetchUserProfile, clearError, selectLoading, selectError, selectUser } from '../../features/authSlice';
// import { toast } from 'react-toastify';
// import styles from './RegisterForm.module.css';

// const RegisterForm = () => {
//    const dispatch = useDispatch();
//    const navigate = useNavigate();

//    const loading = useSelector(selectLoading);
//    const error = useSelector(selectError);
//    const user = useSelector(selectUser);

//    const [form, setForm] = useState({
//       email: '',
//       userName: '',
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

//       if (!form.userName) errors.userName = 'Имя пользователя обязательно';
//       else if (form.userName.length < 3) errors.userName = 'Имя должно быть минимум 3 символа';
//       else if (form.userName.length > 50) errors.userName = 'Имя не должно превышать 50 символов';

//       if (!form.password) errors.password = 'Пароль обязателен';
//       else if (form.password.length < 6) errors.password = 'Пароль должен быть минимум 6 символов';
//       else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
//          errors.password = 'Пароль должен содержать буквы и цифры';
//       }

//       return errors;
//    };

//    const handleSubmit = async e => {
//       e.preventDefault();

//       const errors = validate();
//       setValidationErrors(errors);

//       if (Object.keys(errors).length === 0) {
//          dispatch(clearError());

//          // ТОЛЬКО основные данные - роль по умолчанию 'trainee'
//          const submitData = {
//             email: form.email,
//             userName: form.userName,
//             password: form.password,
//             // role: 'trainee' - бэкенд сам поставит дефолт
//          };

//          const resultAction = await dispatch(registerUser(submitData));

//          if (registerUser.fulfilled.match(resultAction)) {
//             toast.success('Регистрация прошла успешно! Дополните профиль в настройках.');
//             await dispatch(fetchUserProfile());
//             navigate('/profile');
//          }
//       }
//    };

//    useEffect(() => {
//       if (error) {
//          toast.error(`Ошибка регистрации: ${error}`);
//       }
//    }, [error]);

//    useEffect(() => {
//       if (user) {
//          navigate('/profile');
//       }
//    }, [user, navigate]);

//    return (
//       <div className={styles.registerContainer}>
//          <div className={styles.registerCard}>
//             <div className={styles.registerHeader}>
//                <h2>Создать аккаунт</h2>
//                <p>Начните за 30 секунд</p>
//                <div className={styles.quickStartHint}>
//                   🚀 Быстрая регистрация - детали настроите позже
//                </div>
//             </div>

//             <form onSubmit={handleSubmit} className={styles.registerForm} noValidate>
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
//                      autoComplete="email"
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
//                   <label className={styles.label} htmlFor="userName">
//                      Имя пользователя
//                      <span className={styles.required}>*</span>
//                   </label>
//                   <input
//                      className={`${styles.input} ${validationErrors.userName ? styles.inputError : ''}`}
//                      type="text"
//                      id="userName"
//                      name="userName"
//                      value={form.userName}
//                      onChange={handleChange}
//                      disabled={loading}
//                      autoComplete="username"
//                      placeholder="Как к вам обращаться?"
//                   />
//                   {validationErrors.userName && (
//                      <div className={styles.validationError}>
//                         <span className={styles.errorIcon}>⚠️</span>
//                         {validationErrors.userName}
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
//                      autoComplete="new-password"
//                      placeholder="Минимум 6 символов"
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
//                         Регистрация...
//                      </>
//                   ) : (
//                      'Начать тренироваться!'
//                   )}
//                </button>

//                <div className={styles.loginLink}>
//                   <p>Уже есть аккаунт?</p>
//                   <Link to="/login" className={styles.link}>
//                      Войти в систему
//                   </Link>
//                   <div className={styles.featureHint}>
//                      После регистрации настроите роль тренера или спортсмена
//                   </div>
//                </div>
//             </form>
//          </div>
//       </div>
//    );
// };

// export default RegisterForm;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError, selectLoading, selectError } from '../../features/authSlice';
import { toast } from 'react-toastify';
import styles from './RegisterForm.module.css';

const RegisterForm = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const loading = useSelector(selectLoading);
   const error = useSelector(selectError);

   const [form, setForm] = useState({
      email: '',
      userName: '',
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

      if (!form.userName) errors.userName = 'Имя пользователя обязательно';
      else if (form.userName.length < 3) errors.userName = 'Имя должно быть минимум 3 символа';
      else if (form.userName.length > 50) errors.userName = 'Имя не должно превышать 50 символов';

      if (!form.password) errors.password = 'Пароль обязателен';
      else if (form.password.length < 6) errors.password = 'Пароль должен быть минимум 6 символов';
      else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
         errors.password = 'Пароль должен содержать буквы и цифры';
      }

      return errors;
   };

   const handleSubmit = async e => {
      e.preventDefault();

      if (isSubmitting) return;

      const errors = validate();
      setValidationErrors(errors);

      if (Object.keys(errors).length === 0) {
         setIsSubmitting(true);
         dispatch(clearError());

         const submitData = {
            email: form.email,
            userName: form.userName,
            password: form.password,
         };

         const resultAction = await dispatch(registerUser(submitData));

         if (registerUser.fulfilled.match(resultAction)) {
            toast.success('Регистрация прошла успешно! Дополните профиль в настройках.');
            navigate('/profile');
         }
         setIsSubmitting(false);
      }
   };

   useEffect(() => {
      if (error) {
         toast.error(`Ошибка регистрации: ${error}`);
         setIsSubmitting(false);
      }
   }, [error]);

   // ✅ УДАЛЕН useEffect с редиректом на user

   return (
      <div className={styles.registerContainer}>
         <div className={styles.registerCard}>
            <div className={styles.registerHeader}>
               <h2>Создать аккаунт</h2>
               <p>Начните за 30 секунд</p>
               <div className={styles.quickStartHint}>
                  🚀 Быстрая регистрация - детали настроите позже
               </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.registerForm} noValidate>
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
                     autoComplete="email"
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
                  <label className={styles.label} htmlFor="userName">
                     Имя пользователя
                     <span className={styles.required}>*</span>
                  </label>
                  <input
                     className={`${styles.input} ${validationErrors.userName ? styles.inputError : ''}`}
                     type="text"
                     id="userName"
                     name="userName"
                     value={form.userName}
                     onChange={handleChange}
                     disabled={loading || isSubmitting}
                     autoComplete="username"
                     placeholder="Как к вам обращаться?"
                  />
                  {validationErrors.userName && (
                     <div className={styles.validationError}>
                        <span className={styles.errorIcon}>⚠️</span>
                        {validationErrors.userName}
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
                     autoComplete="new-password"
                     placeholder="Минимум 6 символов"
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
                        Регистрация...
                     </>
                  ) : (
                     'Начать тренироваться!'
                  )}
               </button>

               <div className={styles.loginLink}>
                  <p>Уже есть аккаунт?</p>
                  <Link to="/login" className={styles.link}>
                     Войти в систему
                  </Link>
                  <div className={styles.featureHint}>
                     После регистрации настроите роль тренера или спортсмена
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
};

export default RegisterForm;