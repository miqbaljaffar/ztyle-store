import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  checkSession: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ message: string }>;
  verifyEmail: (token: string) => Promise<{ message: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const user = await res.json();
        set({ user, isLoading: false });
        return user;
      }
    } catch (error) {
      console.error('Check session failed:', error);
    }
    set({ user: null, isLoading: false });
    return null;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login gagal.');
      }
      set({ user: data.user, isLoading: false });
      return data.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    set({ user: null });
  },

  register: async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registrasi gagal.');
    }
    return data;
  },

  verifyEmail: async (token) => {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Verifikasi gagal.');
    }
    return data;
  },
}));
