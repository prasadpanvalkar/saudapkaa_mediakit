import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: string;
  full_name: string;
  email: string;
  is_active_seller: boolean;
  is_active_broker: boolean;
  is_staff: boolean;
}

interface AuthState {
  user: User | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      setAuth: (user, token) => {
        // 1. Save Token to Cookie (For API calls)
        Cookies.set('access_token', token, { expires: 7 });

        // 2. Update State (Persist middleware will auto-save this to localStorage)
        set({ user });
      },

      logout: () => {
        Cookies.remove('access_token');
        set({ user: null });
      },
    }),
    {
      name: 'saudapakka-auth', // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }), // Only save the 'user' object
    }
  )
);