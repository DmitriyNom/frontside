// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import sleepReducer from '../features/sleepSlice';
import authReducer from '../features/authSlice'
import notesReducer from '../features/notesSlice';
import onboardingReducer from '../features/onboardingSlice';


const store = configureStore({
   reducer: {
      sleep: sleepReducer,
      auth: authReducer,
      notes: notesReducer,
      onboarding: onboardingReducer,
   },
});

export default store;
