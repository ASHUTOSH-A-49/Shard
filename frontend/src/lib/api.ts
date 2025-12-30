import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add a request interceptor to attach the token automatically
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user && user.email) {
    // Ensure this matches the JSON.loads format your backend expects
    const token = JSON.stringify({ email: user.email, userId: user.id });
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;