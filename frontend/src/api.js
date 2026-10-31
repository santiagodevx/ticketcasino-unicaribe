const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('employeeData');
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error en la petición');
  return data;
}

export const api = {
  // Auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  employeeLogin: (body) => request('/auth/employee-login', { method: 'POST', body: JSON.stringify(body) }),

  // Employees
  getEmployees: () => request('/employees'),
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (body) => request('/employees', { method: 'POST', body: JSON.stringify(body) }),
  updateEmployee: (id, body) => request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Tickets
  generateForAll: () => request('/tickets/generate-all', { method: 'POST' }),
  generateForEmployee: (body) => request('/tickets/generate', { method: 'POST', body: JSON.stringify(body) }),
  validateTicket: (body) => request('/tickets/validate', { method: 'POST', body: JSON.stringify(body) }),
  redeemTicket: (body) => request('/tickets/redeem', { method: 'POST', body: JSON.stringify(body) }),
  getMySummary: () => request('/tickets/my-summary'),
  getHistory: (id) => request(`/tickets/employee/${id}/history`),
  getActive: (id) => request(`/tickets/employee/${id}/active`),
  expireTickets: () => request('/tickets/expire', { method: 'POST' }),

  // Analytics
  getSummary: () => request('/analytics/summary'),
  getTopConsumers: () => request('/analytics/top-consumers'),
  getDaily: () => request('/analytics/daily'),
};
