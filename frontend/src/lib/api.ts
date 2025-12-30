import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://shard-backend.onrender.com',
});

// frontend/src/lib/api.ts
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  const nameOnly = localStorage.getItem('name'); // Checking for 'name' specifically

  try {
    let tokenData: any = {};

    if (userStr) {
      const user = JSON.parse(userStr);
      tokenData = { 
        email: user.email, 
        userId: user.name || user.id // Prioritize 'name' if that's your DB key
      };
    } else if (nameOnly) {
      tokenData = { email: nameOnly };
    }

    if (Object.keys(tokenData).length > 0) {
      // Backend expects a stringified JSON object
      config.headers.Authorization = `Bearer ${JSON.stringify(tokenData)}`;
    }
  } catch (e) {
    console.error("Auth Interceptor Error:", e);
  }
  return config;
});

export default api;