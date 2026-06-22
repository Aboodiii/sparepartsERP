// One configured axios instance the whole app imports. Change the base URL
// in one place (the .env file) instead of hard-coding it everywhere.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

export default api;
