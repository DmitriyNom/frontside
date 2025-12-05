// src/components/SleepList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { fetchSleeps } from '../features/sleepSlice';

const Hydration = () => {
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
         <h2>Потребление воды</h2>
         <ul>

            <li >
               <p>Вода питьевая:  </p>
               <p>Спортивные напитки и изотоники:</p>
               <p>Друние напитки:</p>
               <p>Общий объем потребленной воды: </p>
               <p>Последний напиток (время)</p>
            </li>

         </ul>
      </div>
   );
};

export default Hydration;
