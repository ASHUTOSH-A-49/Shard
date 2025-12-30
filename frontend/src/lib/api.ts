import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://shard-backend.onrender.com',
});

api.interceptors.request.use((config) => {
  const username = localStorage.getItem('username');
  
  if (username) {
    // We send the username inside the "email" field because 
    const token = JSON.stringify({ email: username });
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;