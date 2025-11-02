import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// This User type should match the user object from your /api/auth/login response
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
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      /**
       * Action to set the user and token on login
       */
      login: (token, user) => {
        set({ token, user });
      },

      /**
       * Action to clear the user and token on logout
       */
      logout: () => {
        set({ token: null, user: null });
        // You can also add logic here to clear other stores if needed
      },

      /**
       * Selector to check if a user is authenticated
       */
      isAuthenticated: () => !!get().token,

      /**
       * Selector to check if the authenticated user is an admin
       */
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'auth-session-storage', // The key to use in localStorage
    }
  )
);
