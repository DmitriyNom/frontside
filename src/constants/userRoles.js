// 📁 src/constants/userRoles.js
export const TRAINING_LEVELS = [
   {
      value: 'beginner',
      label: '🥊 Новичок',
      description: 'Только начинаю тренироваться, мало опыта'
   },
   {
      value: 'amateur',
      label: '💪 Любитель',
      description: 'Регулярно тренируюсь 1-3 года, есть базовые навыки'
   },
   {
      value: 'advanced',
      label: '🔥 Продвинутый',
      description: 'Опытный спортсмен 3+ лет, участвую в соревнованиях'
   },
   {
      value: 'professional',
      label: '🏆 Профессионал',
      description: 'Профессиональный уровень, спорт - основная деятельность'
   }
];

export const getTrainingLevelLabel = (level) => {
   const found = TRAINING_LEVELS.find(item => item.value === level);
   return found ? found.label : 'Не указан';
};

// ✅ ОБНОВЛЯЕМ: Добавляем роль 'skipped'
export const USER_ROLES = {
   TRAINEE: 'trainee',
   TRAINER: 'trainer',
   SKIPPED: 'skipped',
   NONE: null
};

export const USER_ROLES_CONFIG = {
   [USER_ROLES.TRAINEE]: {
      value: USER_ROLES.TRAINEE,
      label: '👤 Спортсмен',
      description: 'Буду получать задания от тренера'
   },
   [USER_ROLES.TRAINER]: {
      value: USER_ROLES.TRAINER,
      label: '🏆 Тренер',
      description: 'Буду создавать задания для спортсменов'
   },
   [USER_ROLES.SKIPPED]: {
      value: USER_ROLES.SKIPPED,
      label: '⏩ Пропущено',
      description: 'Onboarding пропущен'
   }
};

export const getUserRoleLabel = (role) => {
   return USER_ROLES_CONFIG[role]?.label || 'Пользователь';
};

// ✅ ДОБАВЛЯЕМ: Утилиты для проверки статуса onboarding
export const isOnboardingCompleted = (role) => {
   return role === USER_ROLES.TRAINEE ||
      role === USER_ROLES.TRAINER ||
      role === USER_ROLES.SKIPPED;
};

export const isOnboardingSkipped = (role) => {
   return role === USER_ROLES.SKIPPED;
};

export const needsOnboarding = (role) => {
   return !role ||
      (role !== USER_ROLES.TRAINEE &&
         role !== USER_ROLES.TRAINER &&
         role !== USER_ROLES.SKIPPED);
};