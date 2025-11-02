import apiClient from '@/lib/apiClient'; // From our previous step
import { useAuthStore } from '@/store/useAuthStore'; // From our previous step

// Types
// This is the data your login form will send
export type AuthCredentials = {
  email: string;
  password: string;
};

// This is the user type defined in your authStore
type User = NonNullable<ReturnType<typeof useAuthStore.getState>['user']>;

// This is the expected response from your /api/auth/login endpoint
export type AuthResponse = {
  token: string;
  user: User;
};

/**
 * Logs in a user (admin or regular)
 */
export const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
  // This POSTs to http://localhost:3000/api/auth/login
  const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return data;
};

/**
 * Registers a new user
 */
export const register = async (credentials: AuthCredentials): Promise<{ message: string }> => {
  // This POSTs to http://localhost:3000/api/auth/register
  const { data } = await apiClient.post<{ message: string }>('/auth/register', credentials);
  return data;
};