import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://shard-backend.onrender.com',
});

api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user'); // Fixed: Use 'user' key from Auth.tsx
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Format EXACTLY as extract_routes.py json.loads expects
      const token = JSON.stringify({ 
        userId: user.id || user.uid, 
        email: user.email 
      });
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error("Token format error", e);
    }
  }
  return config;
});

export default api;