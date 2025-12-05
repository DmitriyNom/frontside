// src/components/SleepList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { fetchSleeps } from '../features/sleepSlice';

const Nutrition = () => {
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
         <h2>Приемы пищи: </h2>
         <ul>

            <li >
               <p>Количество приемов сегодня: </p>
               <p>Калории: </p>
               <p>Белки:</p>
               <p>Жиры:</p>
               <p>Углеводы </p>
               <p>Кнопка дополнительно...</p>
               <p>Клетчатка</p>
               <p>Сахар</p>
               <p>Соль</p>
               <p>Холестерин</p>
               <p>Вода в пище</p>
               <p>Гликемический индекс</p>
               <p>Кнопка дополнительно</p>
               <p>Витамины abcde</p>
               <p>Минералы железо, магний, кальций, калий</p>
            </li>

         </ul>
      </div>
   );
};

export default Nutrition;
