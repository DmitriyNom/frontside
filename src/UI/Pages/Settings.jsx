import React from 'react';
import styles from './Settings.module.css';

const Settings = () => {
   return (
      <div className={styles.settings}>
         <header className={styles.pageHeader}>
            <h1>Настройки</h1>
            <p>Управление настройками вашего аккаунта</p>
         </header>

         <div className={styles.settingsGrid}>
            <div className={styles.settingSection}>
               <h3>👤 Профиль</h3>
               <p>Измените информацию о вашем профиле</p>
            </div>

            <div className={styles.settingSection}>
               <h3>🔐 Безопасность</h3>
               <p>Обновите пароль и настройки безопасности</p>
            </div>

            <div className={styles.settingSection}>
               <h3>🎨 Внешний вид</h3>
               <p>Настройте тему и отображение приложения</p>
            </div>

            <div className={styles.settingSection}>
               <h3>🔔 Уведомления</h3>
               <p>Управление уведомлениями и рассылками</p>
            </div>
         </div>
      </div>
   );
};

export default Settings;