import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

type AuthState = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => {
        set({ token, user });
      },
      logout: () => {
        set({ token: null, user: null });
        // You might also want to clear other stores here if needed
      },
    }),
    {
      name: 'auth-storage', // This will save the token in localStorage
    }
  )
);