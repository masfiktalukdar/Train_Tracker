import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore'; // We will create this in Step 3

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Or your backend port
});

// Interceptor: This function runs before every request
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token; // Get token from Zustand
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;