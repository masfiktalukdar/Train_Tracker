import apiClient from '@/lib/apiClient'; 
import { useAuthStore } from '@/store/useAuthStore'; 

// Types
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
  const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return data;
};

/**
 * Registers a new user
 */
export const register = async (credentials: AuthCredentials): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/register', credentials);
  return data;
};