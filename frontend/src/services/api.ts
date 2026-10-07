import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } });
api.interceptors.response.use((response) => response, (error: unknown) => {
  const status = (error as { response?: { status?: number }; config?: { url?: string } }).response?.status;
  const url = (error as { config?: { url?: string } }).config?.url || '';
  if (status === 401 && !url.includes('/auth/login')) window.dispatchEvent(new Event('auth-expired'));
  return Promise.reject(error);
});
