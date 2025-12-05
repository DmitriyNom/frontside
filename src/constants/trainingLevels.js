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