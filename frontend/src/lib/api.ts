import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://shard-backend.onrender.com',
});

// frontend/src/lib/api.ts
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  const nameStr = localStorage.getItem('name'); // Your specific key

  let identifier = "";

  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      identifier = userObj.email || userObj.name;
    } catch (e) {
      identifier = userStr; // fallback if it's not JSON
    }
  } else if (nameStr) {
    identifier = nameStr;
  }

  if (identifier) {
    // Backend uses json.loads(), so we send a stringified JSON object
    const token = JSON.stringify({ email: identifier });
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;