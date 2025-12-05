// src/components/SleepList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { fetchSleeps } from '../features/sleepSlice';

const Mood = () => {
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
         <h2>Настроение</h2>
         <ul>

            <li >
               <p>Настроение сегодня...Рейтинг: отображается звездами  </p>
               <p>Эмоции:  </p>
               <p>Описание:</p>
               <p>Последнее обновление (время)</p>
            </li>

         </ul>
      </div>
   );
};

export default Mood;
