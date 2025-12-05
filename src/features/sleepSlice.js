import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/sleep'; // Замените на ваш API URL

export const fetchSleeps = createAsyncThunk('sleep/fetchSleeps', async () => {
   const response = await axios.get(API_URL);
   return response.data; // Предполагается, что данные возвращаются в формате массива
});

const initialState = {
   sleepDuration: 8,
   sleepType: "Ночной",
   sleepQuality: 5,
   awakenings: 2,
   toBedTime: "11pm",
   wakeUpTime: "7am"
};

const sleepSlice = createSlice({
   name: 'sleep',
   initialState,
   reducers: {
      updateSleepData: (state, action) => {
         return { ...state, ...action.payload }; // Обновляем состояние с новыми данными
      },
      resetSleepData: () => initialState // Сброс данных о сне
   }
});

export const { updateSleepData, resetSleepData } = sleepSlice.actions;
export default sleepSlice.reducer;
