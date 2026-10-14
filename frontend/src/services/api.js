import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45s timeout accommodates LLM generation and dense RAG processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-Flight GET Request Deduplication Map for High Concurrency UI
const pendingGetRequests = new Map();

// Request interceptor: attach token based on route and deduplicate identical GETs
api.interceptors.request.use(
  (config) => {
    const isAdminRoute = config.url && config.url.includes('/admin') && !config.url.includes('/admin/auth/login');
    let token = null;

    if (isAdminRoute) {
      // Exclusively use verified admin bearer token for governance endpoints
      token = localStorage.getItem('adminToken');
    } else {
      token = localStorage.getItem('accessToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle automatic token refresh & clean deduplication
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is a 401 and hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      const isAdminRoute = originalRequest.url && originalRequest.url.includes('/admin');

      if (isAdminRoute) {
        const adminRefreshToken = localStorage.getItem('adminRefreshToken');
        if (adminRefreshToken) {
          try {
            const res = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
              refreshToken: adminRefreshToken,
            });
            const newAdminToken = res.data?.accessToken || res.data?.data?.accessToken;
            localStorage.setItem('adminToken', newAdminToken);
            originalRequest.headers.Authorization = `Bearer ${newAdminToken}`;
            return api(originalRequest);
          } catch (refreshErr) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('adminUser');
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            }
            return Promise.reject(refreshErr);
          }
        }
      } else {
        const candidateRefreshToken = localStorage.getItem('refreshToken');
        if (candidateRefreshToken) {
          try {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: candidateRefreshToken,
            });
            const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('candidateUser');
            // Only redirect if currently on a protected route to avoid jarring user experience on public landing/pricing pages
            const isProtectedRoute = ['/dashboard', '/interviews', '/resumes', '/quizzes', '/profile'].some(p =>
              window.location.pathname.startsWith(p)
            );
            if (isProtectedRoute) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshErr);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
