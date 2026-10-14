import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('candidateUser') || 'null'),
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,

  // Admin state
  adminUser: JSON.parse(localStorage.getItem('adminUser') || 'null'),
  adminToken: localStorage.getItem('adminToken') || null,
  adminRefreshToken: localStorage.getItem('adminRefreshToken') || null,
  isAdminAuthenticated: !!localStorage.getItem('adminToken'),

  // Candidate Actions
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data?.data || res.data || {};
      const user = payload.user || res.data?.user || (payload._id ? payload : null);
      const accessToken = payload.accessToken || res.data?.accessToken;
      const refreshToken = payload.refreshToken || res.data?.refreshToken;

      if (!accessToken || !user) {
        throw new Error('Authentication response did not contain user credentials');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('candidateUser', JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  oauthLogin: async (provider, profile) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/oauth', { provider, profile });
      const payload = res.data?.data || res.data || {};
      const user = payload.user || res.data?.user || (payload._id ? payload : null);
      const accessToken = payload.accessToken || res.data?.accessToken;
      const refreshToken = payload.refreshToken || res.data?.refreshToken;

      if (!accessToken || !user) {
        throw new Error('OAuth authentication response did not contain user credentials');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('candidateUser', JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Social authentication failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const payload = res.data?.data || res.data || {};
      const user = payload.user || res.data?.user || (payload._id ? payload : null);
      const accessToken = payload.accessToken || res.data?.accessToken;
      const refreshToken = payload.refreshToken || res.data?.refreshToken;

      if (!accessToken || !user) {
        throw new Error('Registration response did not contain user credentials');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('candidateUser', JSON.stringify(user));

      // Newly registered users are candidates; ensure admin credentials are cleared
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        adminUser: null,
        adminToken: null,
        adminRefreshToken: null,
        isAdminAuthenticated: false,
        loading: false,
      });
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Registration failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      const refreshToken = get().refreshToken;
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('candidateUser');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        adminUser: null,
        adminToken: null,
        adminRefreshToken: null,
        isAdminAuthenticated: false,
      });
    }
  },

  fetchMe: async () => {
    if (!get().accessToken) return;
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.user || res.data?.data || res.data;
      if (user && user._id) {
        localStorage.setItem('candidateUser', JSON.stringify(user));
        set({
          user,
          isAuthenticated: true,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch user:', err.message);
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true });
    try {
      const res = await api.patch('/users/profile', profileData);
      const updatedUser = res.data?.user || res.data?.data || res.data;
      localStorage.setItem('candidateUser', JSON.stringify(updatedUser));
      set({ user: updatedUser, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Profile update failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  // Admin Actions
  adminLogin: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/admin/auth/login', { email, password });
      const payload = res.data?.data || res.data || {};
      const admin = payload.admin || res.data?.admin || (payload._id ? payload : null);
      const accessToken = payload.accessToken || res.data?.accessToken;
      const refreshToken = payload.refreshToken || res.data?.refreshToken;

      if (!accessToken || !admin) {
        throw new Error('Admin authentication response did not contain credentials');
      }

      localStorage.setItem('adminToken', accessToken);
      if (refreshToken) localStorage.setItem('adminRefreshToken', refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(admin));

      // Also sync standard candidate session so admin can freely access user dashboard
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('candidateUser', JSON.stringify(admin));

      set({
        user: admin,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        adminUser: admin,
        adminToken: accessToken,
        adminRefreshToken: refreshToken,
        isAdminAuthenticated: true,
        loading: false,
      });
      return { success: true, admin };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Admin login failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  adminLogout: async () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    set({
      adminUser: null,
      adminToken: null,
      adminRefreshToken: null,
      isAdminAuthenticated: false,
    });
  },
}));
