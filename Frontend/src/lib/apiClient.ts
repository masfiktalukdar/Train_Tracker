import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL, // Or your backend port
});

// Interceptor 1: Runs BEFORE every request is sent
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from our Zustand store
    const token = useAuthStore.getState().token;
    if (token) {
      // If the token exists, attach it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors (e.g., network issues)
    return Promise.reject(error);
  }
);

// Interceptor 2: Runs AFTER every response is received
apiClient.interceptors.response.use(
  (response) => {
    // If the response is successful (status 2xx), just return it
    return response;
  },
  (error) => {
    // If the response is an error

    // Check if it's a 401 Unauthorized error
    if (error.response && error.response.status === 401) {
      console.error("API request unauthorized (401). Token may be expired. Logging out.");

      // Get the user's role *before* logging out to ensure correct redirect
      const userRole = useAuthStore.getState().user?.role;

      // Call the logout action from our auth store to clear the session
      useAuthStore.getState().logout();

      // Force a redirect to the appropriate login page
      if (userRole === 'admin') {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }

      // Return a rejected promise to stop the original mutation/query from proceeding
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    // For all other errors (404, 500, etc.), just pass them along
    // so the useMutation's onError can handle them.
    return Promise.reject(error);
  }
);

export default apiClient;
