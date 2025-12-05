// src/components/SleepList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { fetchSleeps } from '../features/sleepSlice';

const WorkoutExercise = () => {
   const dispatch = useDispatch();
   // const { sleeps, loading, error } = useSelector((state) => state.sleep);

   // useEffect(() => {
   //    dispatch(fetchSleeps());
   // }, [dispatch]);

   // if (loading) {
   //    return <div>Загрузка...</div>;
   // }

   // if (error) {
   //    return <div>Ошибка: {error}</div>;
   // }

   return (
      <div>
         <h2>Упражнение</h2>
         <ul>

            <li >
               <p>Название: </p>
               <p>Подходы: </p>
               <p>Повторения или Продолжительность:</p>
               <p>Максимум повторений:</p>
               <p>Время выполнения: </p>
            </li>

         </ul>
      </div>
   );
};

export default WorkoutExercise;
