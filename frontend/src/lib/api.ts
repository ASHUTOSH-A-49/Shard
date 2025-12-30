import axios from 'axios';

const api = axios.create({
  // Ensure VITE_API_URL is set to https://shard-backend.onrender.com in Render
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Interceptor to automatically attach correctly formatted tokens
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Backend expects a JSON string containing the user's email/ID
      const token = JSON.stringify({ 
        userId: user.id || user.uid, 
        email: user.email 
      });
      
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;