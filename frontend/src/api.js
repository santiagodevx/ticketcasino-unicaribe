import axios from 'axios';
import { toast } from 'sonner';

const AUTH_ROUTES = ['/auth/login', '/auth/employee-login'];

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: adjuntar JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: manejar 401
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const isAuthRoute = AUTH_ROUTES.some((r) => error.config?.url?.includes(r));

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('employeeData');
      toast.error('Sesión expirada. Por favor inicia sesión de nuevo.');
      window.location.href = '/login';
    }

    const message = error.response?.data?.message || error.message || 'Error en la petición';
    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  }
);

export const api = {
  // Auth
  login: (body) => apiClient.post('/auth/login', body),
  employeeLogin: (body) => apiClient.post('/auth/employee-login', body),

  // Employees
  getEmployees: () => apiClient.get('/employees'),
  getEmployee: (id) => apiClient.get(`/employees/${id}`),
  createEmployee: (body) => apiClient.post('/employees', body),
  updateEmployee: (id, body) => apiClient.patch(`/employees/${id}`, body),

  // Tickets
  generateForAll: () => apiClient.post('/tickets/generate-all'),
  generateForEmployee: (body) => apiClient.post('/tickets/generate', body),
  validateTicket: (body) => apiClient.post('/tickets/validate', body),
  redeemTicket: (body) => apiClient.post('/tickets/redeem', body),
  getMySummary: () => apiClient.get('/tickets/my-summary'),
  getHistory: (id) => apiClient.get(`/tickets/employee/${id}/history`),
  getActive: (id) => apiClient.get(`/tickets/employee/${id}/active`),
  expireTickets: () => apiClient.post('/tickets/expire'),

  // Analytics
  getSummary: () => apiClient.get('/analytics/summary'),
  getTopConsumers: () => apiClient.get('/analytics/top-consumers'),
  getDaily: () => apiClient.get('/analytics/daily'),
};
