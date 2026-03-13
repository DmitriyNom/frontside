/**
 * Обеспечивает обратную совместимость пользовательских данных
 * @param {Object} userData - данные пользователя с сервера
 * @returns {Object} нормализованные данные пользователя
 */
/**
 * Обеспечивает обратную совместимость пользовательских данных
 * @param {Object} userData - данные пользователя с сервера
 * @returns {Object} нормализованные данные пользователя
 */
export const ensureUserCompatibility = (userData) => {
   if (!userData) return null;

   return {
      // Старые поля
      id: userData.id,
      userName: userData.userName || '',
      email: userData.email || '',
      birthDate: userData.birthDate || null,
      userAvatar: userData.userAvatar || null,

      // Новые поля с дефолтными значениями
      role: userData.role || 'trainee',
      public_id: userData.public_id || `user_${userData.id}`,
      sport_specialization: userData.sport_specialization || '',
      training_level: userData.training_level || null,
      allow_connections: userData.allow_connections !== false,

      // ВАЖНО: СОХРАНЯЕМ connectionStatus!
      connectionStatus: userData.connectionStatus
   };
};

/**
 * Проверяет, есть ли у пользователя все необходимые поля профиля
 * @param {Object} user - объект пользователя
 * @returns {boolean}
 */
export const hasCompleteProfile = (user) => {
   if (!user) return false;

   const requiredFields = ['userName', 'email', 'role'];
   return requiredFields.every(field => user[field]);
};

/**
 * Возвращает отображаемое имя роли пользователя
 * @param {string} role - роль пользователя
 * @returns {string}
 */
export const getDisplayRole = (role) => {
   const roles = {
      'trainee': 'Спортсмен',
      'trainer': 'Тренер',
      'User': 'Пользователь' // для обратной совместимости
   };
   return roles[role] || 'Пользователь';
};

/**
 * Проверяет, может ли пользователь быть тренером
 * @param {Object} user - объект пользователя
 * @returns {boolean}
 */
export const canBeTrainer = (user) => {
   return user && user.role === 'trainer' && user.sport_specialization;
};