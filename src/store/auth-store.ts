import { create } from 'zustand';
import { api } from '@/lib/api';

export type GlobalRole = 'SAAS_ADMIN' | 'LANDLORD' | 'STAFF' | 'TENANT';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  global_role: GlobalRole;
  tenant_code?: string;
  landlord_profile?: {
    id: string;
    company_name: string;
  };
  staff_profile?: {
    id: string;
    landlord_id: string;
    role: {
      name: string;
      permissions: { action: string }[];
    };
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  login: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),

  login: (accessToken, user) => {
    localStorage.setItem('rf-access-token', accessToken);
    set({ user, loading: false });
  },

  logout: async () => {
    // Capture role before clearing user state
    const currentUser = useAuthStore.getState().user;
    const role = currentUser?.global_role;
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout API call failed', e);
    } finally {
      localStorage.removeItem('rf-access-token');
      set({ user: null, loading: false });
      // Redirect to the appropriate portal login
      if (role === 'SAAS_ADMIN') {
        window.location.href = '/admin/login';
      } else if (role === 'LANDLORD' || role === 'STAFF') {
        window.location.href = '/landlord/login';
      } else {
        window.location.href = '/login';
      }
    }
  },

  checkAuth: async () => {
    const state = useAuthStore.getState();
    if (state.initialized && state.user) {
      return;
    }
    const token = localStorage.getItem('rf-access-token');
    if (!token) {
      set({ user: null, loading: false, initialized: true });
      return;
    }

    try {
      // Fetch currently authenticated user profile
      const res = await api.get('/auth/me');
      set({ user: res.data, loading: false, initialized: true });
    } catch (e) {
      console.error('Session verification failed', e);
      localStorage.removeItem('rf-access-token');
      set({ user: null, loading: false, initialized: true });
    }
  },
}));
