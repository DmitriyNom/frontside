// src/UI/Pages/Profile/ProfileTraining.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsTrainer } from '../../../features/authSlice';
import styles from './ProfileTraining.module.css';

const ProfileTraining = ({ user }) => {
   const isTrainer = useSelector(selectIsTrainer);

   return (
      <div className={styles.trainingProfile}>
         <header className={styles.pageHeader}>
            <h1>{isTrainer ? 'Мои подопечные' : 'Мои тренировки'}</h1>
            <p>
               {isTrainer
                  ? 'Управление вашими спортсменами и заданиями'
                  : 'Ваши задания и прогресс тренировок'
               }
            </p>
         </header>

         <div className={styles.trainingContent}>
            {isTrainer ? (
               <div className={styles.trainerDashboard}>
                  <div className={styles.comingSoon}>
                     <div className={styles.comingSoonIcon}>👥</div>
                     <h3>Раздел в разработке</h3>
                     <p>Скоро здесь появится управление вашими подопечными</p>
                     <div className={styles.featureList}>
                        <span>✅ Создание заданий</span>
                        <span>✅ Просмотр отчетов</span>
                        <span>✅ Управление подключениями</span>
                     </div>
                  </div>
               </div>
            ) : (
               <div className={styles.traineeDashboard}>
                  <div className={styles.comingSoon}>
                     <div className={styles.comingSoonIcon}>💪</div>
                     <h3>Раздел в разработке</h3>
                     <p>Скоро здесь появятся ваши тренировочные задания</p>
                     <div className={styles.featureList}>
                        <span>✅ Получение заданий от тренера</span>
                        <span>✅ Отправка отчетов</span>
                        <span>✅ Отслеживание прогресса</span>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default ProfileTraining;