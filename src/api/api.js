// api.js
import axios from 'axios';

const api = axios.create({
   baseURL: 'http://localhost:5000', // здесь укажи адрес твоего backend-сервера
   // можно добавить другие настройки, например заголовки
});

export default api;
