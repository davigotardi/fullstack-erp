import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ erro?: string }>(error)) {
    return error.response?.data?.erro || fallback;
  }
  return fallback;
}

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('erp_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err: unknown) => {
    if (!axios.isAxiosError(err)) return Promise.reject(err);
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
