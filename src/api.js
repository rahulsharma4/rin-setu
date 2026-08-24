import axios from 'axios';

const API_BASE = `${window.API_BASE}/api/`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Har request ke saath JWT token attach karo
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('byaj_admin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 aane par auto-logout karo, 403 SUBSCRIPTION_EXPIRED aane par /subscription pe bhejo
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('byaj_admin_token');
      localStorage.removeItem('byaj_admin_info');
      window.location.href = '/login';
    }
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
      window.location.href = '/subscription';
    }
    return Promise.reject(error);
  }
);

export const customerAPI = {
  getAll: () => api.get('customers').then(res => res.data),
  getOne: (id) => api.get(`customers/${id}`).then(res => res.data),
  create: (data) => api.post('customers', data).then(res => res.data),
  update: (id, data) => api.put(`customers/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`customers/${id}`).then(res => res.data),
};

export const loanAPI = {
  getAll: () => api.get('loans').then(res => res.data),
  getOne: (id) => api.get(`loans/${id}`).then(res => res.data),
  create: (data) => api.post('loans', data).then(res => res.data),
  update: (id, data) => api.put(`loans/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`loans/${id}`).then(res => res.data),
};

export const transactionAPI = {
  getAll: () => api.get('transactions').then(res => res.data),
  create: (data) => api.post('transactions', data).then(res => res.data),
  delete: (id) => api.delete(`transactions/${id}`).then(res => res.data),
};

export const collectionAPI = {
  getToday: () => api.get('collection/today').then(res => res.data),
  getUpcoming: () => api.get('collection/upcoming').then(res => res.data),
  getOverdue: () => api.get('collection/overdue').then(res => res.data),
};

export const reportsAPI = {
  getSummary: () => api.get('reports/summary').then(res => res.data),
};

export default api;
