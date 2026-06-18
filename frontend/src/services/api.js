import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API service functions
export const ticketService = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  addMessage: (id, data) => api.post(`/tickets/${id}/messages`, data),
  getAIResponse: (id) => api.get(`/tickets/${id}/ai-response`),
};

export const analyticsService = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getAgentPerformance: (params) => api.get('/analytics/agent-performance', { params }),
  getSentimentTrends: (params) => api.get('/analytics/sentiment-trends', { params }),
  getAIInsights: (params) => api.get('/analytics/ai-insights', { params }),
  getLive: () => api.get('/analytics/live'),
};

export const userService = {
  getAll: () => api.get('/users'),
  getAgents: () => api.get('/users/agents'),
  updateStatus: (id, is_active) => api.put(`/users/${id}/status`, { is_active }),
};

export const authService = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};
