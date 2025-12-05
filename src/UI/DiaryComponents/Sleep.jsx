import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SleepModal from './SleepModal'; // Импортируйте новый компонент

const Sleep = () => {
   const dispatch = useDispatch();
   const {
      sleepDuration,
      sleepType,
      sleepQuality,
      awakenings,
      toBedTime,
      wakeUpTime
   } = useSelector((state) => state.sleep);

   const [modalIsOpen, setModalIsOpen] = useState(false);

   const handleOpenModal = () => {
      setModalIsOpen(true);
   };

   const handleCloseModal = () => {
      setModalIsOpen(false);
   };

   const initialData = {
      sleepDuration,
      sleepType,
      sleepQuality,
      awakenings,
      toBedTime,
      wakeUpTime
   };

   return (
      <div>
         <h2>Последняя запись о сне</h2>
         <ul>
            <li>
               <p>Продолжительность сна: {sleepDuration} </p>
               <p>Тип (дневной, ночной): {sleepType}</p>
               <p>Качество сна: {sleepQuality}</p>
               <p>Пробуждения: {awakenings}</p>
               <p>Отход ко сну: {toBedTime}</p>
               <p>Подъем: {wakeUpTime}</p>
               <button onClick={handleOpenModal}>Редактировать</button>
            </li>
         </ul>

         <SleepModal
            isOpen={modalIsOpen}
            onRequestClose={handleCloseModal}
            initialData={initialData} // Передаем начальные данные в модалку
         />
      </div>
   );
};

export default Sleep;
