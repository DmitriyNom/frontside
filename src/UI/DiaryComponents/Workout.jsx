// src/components/SleepList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { fetchSleeps } from '../features/sleepSlice';

const Workout = () => {
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
         <h2>Тренировка</h2>
         <ul>

            <li >
               <p>Тип тренировки: </p>
               <p>Продолжительность: </p>
               <p>Интенсивность ( список селект):</p>
               <p>Категория (селект):</p>
               <p>Заметки по тренировке: </p>
               <p>Последняя тренировка: (время)</p>
               <p>Кнопка Подробнее...</p>
            </li>

         </ul>
      </div>
   );
};

export default Workout;
