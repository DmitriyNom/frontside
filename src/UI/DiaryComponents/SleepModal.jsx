import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useDispatch } from 'react-redux';
import { updateSleepData } from '../../features/sleepSlice'; // Импортируйте действие для обновления данных

const SleepModal = ({ isOpen, onRequestClose, initialData }) => {
   const dispatch = useDispatch();
   const [formData, setFormData] = useState(initialData);

   useEffect(() => {
      setFormData(initialData);
   }, [initialData]);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({
         ...formData,
         [name]: value
      });
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      dispatch(updateSleepData(formData)); // Действие для обновления данных в Redux
      onRequestClose(); // Закрываем модалку после отправки
   };

   // Функция для расчета продолжительности сна
   const calculateSleepDuration = (toBedTime, wakeUpTime) => {
      const [bedHours, bedMinutes] = toBedTime.split(':').map(Number);
      const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);

      // Переводим оба времени в общее количество минут с начала суток
      const bedTotalMinutes = bedHours * 60 + bedMinutes;
      const wakeTotalMinutes = wakeHours * 60 + wakeMinutes;

      // Если время пробуждения меньше или равно времени отхода ко сну, значит пробуждение на следующий день
      let durationMinutes = wakeTotalMinutes - bedTotalMinutes;
      if (durationMinutes <= 0) {
         durationMinutes += 24 * 60; // добавляем сутки в минутах
      }

      // Преобразуем в часы и минуты
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return { hours, minutes };
   };


   // Обновляем продолжительность сна при изменении времени
   useEffect(() => {
      const duration = calculateSleepDuration(formData.toBedTime, formData.wakeUpTime);
      // Формируем строку вида "7 ч 30 мин"
      const sleepDurationStr = `${duration.hours} ч ${duration.minutes} мин`;
      setFormData((prevData) => ({
         ...prevData,
         sleepDuration: sleepDurationStr
      }));
   }, [formData.toBedTime, formData.wakeUpTime]);

   return (
      <Modal
         isOpen={isOpen}
         onRequestClose={onRequestClose}
         contentLabel="Редактировать данные о сне"
      >
         <h2>Редактировать данные о сне</h2>
         <form onSubmit={handleSubmit}>
            <p>
               <label>
                  <label>
                     Продолжительность сна: {formData.sleepDuration}
                  </label>
               </label>
            </p>
            <p>
               <label>
                  Тип сна:
                  <select
                     name="sleepType"
                     value={formData.sleepType}
                     onChange={handleChange}
                  >
                     <option value="Ночной">Ночной</option>
                     <option value="Дневной">Дневной</option>
                  </select>
               </label>
            </p>
            <p>
               <label>
                  Качество сна:
                  <input
                     type="number"
                     name="sleepQuality"
                     value={formData.sleepQuality}
                     onChange={handleChange}
                  />
               </label>
            </p>
            <p>
               <label>
                  Пробуждения:
                  <input
                     type="number"
                     name="awakenings"
                     value={formData.awakenings}
                     onChange={handleChange}
                  />
               </label>
            </p>
            <p>
               <label>
                  Отход ко сну:
                  <input
                     type="time"
                     name="toBedTime"
                     value={formData.toBedTime}
                     onChange={handleChange}
                  />
               </label>
            </p>
            <p>
               <label>
                  Подъем:
                  <input
                     type="time"
                     name="wakeUpTime"
                     value={formData.wakeUpTime}
                     onChange={handleChange}
                  />
               </label>
            </p>
            <p>
               <button type="submit">Сохранить</button>
            </p>
         </form>

      </Modal>
   );
};

export default SleepModal;
