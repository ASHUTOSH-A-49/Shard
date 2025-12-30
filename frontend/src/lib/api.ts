import axios from 'axios';

// Create an axios instance with the base URL from env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

export default api;