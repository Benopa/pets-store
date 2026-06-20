import axios from 'axios';

// Токен авторизации: из Redux-стора, иначе из localStorage.
export const authToken = (getState) =>
  getState().auth?.accessToken || localStorage.getItem('token');

// Заголовок Bearer для защищённых запросов.
export const bearer = (getState) => {
  const token = authToken(getState);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Человекочитаемое сообщение об ошибке из ответа бэкенда
// (массив сообщений class-validator склеиваем в строку).
export const errMessage = (err) => {
  const message = err.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || err.message;
};

export { axios };
