import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setShowOnboarding, resetOnboarding } from '../features/onboardingSlice';

export const useOnboarding = () => {
   const dispatch = useDispatch();
   const { user } = useSelector(state => state.auth);
   const { showOnboarding, skipped } = useSelector(state => state.onboarding);

   // ДЕТАЛЬНАЯ ОТЛАДКА
   console.log('🔍 useOnboarding ДЕТАЛЬНАЯ ОТЛАДКА:', {
      user: user ? {
         id: user.id,
         email: user.email,
         role: user.role,
         roleType: typeof user.role,
         isNull: user.role === null,
         isUndefined: user.role === undefined,
         isEmptyString: user.role === '',
         truthy: !!user.role
      } : 'NO USER',
      skipped,
      showOnboarding,
      needsOnboarding: user && !user.role && !skipped
   });

   // Логика определения нужно ли показывать onboarding
   const needsOnboarding = user &&
      (user.role === null ||
         user.role === undefined ||
         user.role === '') &&
      !skipped;

   // ✅ ДОБАВЛЯЕМ: Сброс skipped состояния для новых пользователей
   useEffect(() => {
      if (user && !user.role && skipped) {
         console.log('🟡 Сбрасываем skipped для нового пользователя без роли');
         dispatch(resetOnboarding());
      }
   }, [user, skipped, dispatch]);

   // Автоматически показываем onboarding если нужно
   useEffect(() => {
      if (needsOnboarding && !showOnboarding) {
         console.log('🟡 ПОКАЗЫВАЕМ ONBOARDING - пользователь без роли');
         dispatch(setShowOnboarding(true));
      }

      // Скрываем onboarding если роль уже выбрана
      if (user?.role && showOnboarding) {
         console.log('🟡 СКРЫВАЕМ ONBOARDING - роль уже выбрана:', user.role);
         dispatch(setShowOnboarding(false));
      }
   }, [needsOnboarding, showOnboarding, user, dispatch]);

   return {
      needsOnboarding,
      showOnboarding,
      skipped
   };
};