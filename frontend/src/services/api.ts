import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@OdontoFlow:token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const message = error.response?.data?.message 
      || error.response?.data?.error 
      || 'Ocorreu um erro inesperado';

    // Handle specific status codes
    switch (error.response?.status) {
      case 401:
        // Token expired or invalid
        localStorage.removeItem('@OdontoFlow:token');
        window.location.href = '/login';
        toast.error('Sessão expirada. Faça login novamente.');
        break;
      
      case 403:
        toast.error('Você não tem permissão para esta ação.');
        break;
      
      case 404:
        toast.error('Recurso não encontrado.');
        break;
      
      case 422:
        // Validation errors are handled by forms
        break;
      
      case 429:
        toast.error('Muitas requisições. Aguarde um momento.');
        break;
      
      case 500:
        toast.error('Erro interno do servidor. Tente novamente.');
        break;
      
      default:
        if (!error.response) {
          toast.error('Erro de conexão. Verifique sua internet.');
        }
    }

    return Promise.reject(error);
  }
);

// API Services
export const authService = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  me: () => 
    api.get('/auth/me'),
  
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string, passwordConfirmation: string) => 
    api.post('/auth/reset-password', { token, password, password_confirmation: passwordConfirmation }),
};

export const patientService = {
  list: (params?: Record<string, unknown>) => 
    api.get('/patients', { params }),
  
  get: (id: string) => 
    api.get(`/patients/${id}`),
  
  create: (data: Record<string, unknown>) => 
    api.post('/patients', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    api.put(`/patients/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/patients/${id}`),
  
  getAnamnesis: (id: string) => 
    api.get(`/patients/${id}/anamnesis`),
  
  saveAnamnesis: (id: string, data: Record<string, unknown>) => 
    api.post(`/patients/${id}/anamnesis`, data),
  
  getOdontogram: (id: string) => 
    api.get(`/patients/${id}/odontogram`),
  
  updateOdontogram: (id: string, data: Record<string, unknown>) => 
    api.put(`/patients/${id}/odontogram`, data),
  
  atRisk: () => 
    api.get('/patients/at-risk'),
  
  inactive: (days = 90) => 
    api.get('/patients/inactive', { params: { days } }),
  
  birthdays: () => 
    api.get('/patients/birthdays'),
};

export const scheduleService = {
  getAppointments: (params: Record<string, unknown>) => 
    api.get('/schedule/appointments', { params }),
  
  getAppointment: (id: string) => 
    api.get(`/schedule/appointments/${id}`),
  
  createAppointment: (data: Record<string, unknown>) => 
    api.post('/schedule/appointments', data),
  
  updateAppointment: (id: string, data: Record<string, unknown>) => 
    api.put(`/schedule/appointments/${id}`, data),
  
  cancelAppointment: (id: string, reason?: string) => 
    api.post(`/schedule/appointments/${id}/cancel`, { reason }),
  
  confirmAppointment: (id: string, via?: string) => 
    api.post(`/schedule/appointments/${id}/confirm`, { via }),
  
  checkIn: (id: string) => 
    api.post(`/schedule/appointments/${id}/check-in`),
  
  startService: (id: string) => 
    api.post(`/schedule/appointments/${id}/start`),
  
  completeService: (id: string) => 
    api.post(`/schedule/appointments/${id}/complete`),
  
  noShow: (id: string) => 
    api.post(`/schedule/appointments/${id}/no-show`),
  
  getAvailableSlots: (params: Record<string, unknown>) => 
    api.get('/schedule/available-slots', { params }),
  
  getSmartSuggestions: (params: Record<string, unknown>) => 
    api.get('/schedule/smart-suggestions', { params }),
};

export const aiService = {
  generateEvolution: (data: Record<string, unknown>) => 
    api.post('/ai/evolution', data),
  
  suggestDiagnosis: (data: Record<string, unknown>) => 
    api.post('/ai/diagnosis', data),
  
  suggestTreatment: (data: Record<string, unknown>) => 
    api.post('/ai/treatment', data),
  
  chat: (message: string, conversationId?: string, context?: Record<string, unknown>) => 
    api.post('/ai/chat', { message, conversation_id: conversationId, context }),
  
  analyzeNoShowRisk: (data: Record<string, unknown>) => 
    api.post('/ai/no-show-risk', data),
  
  getFinancialInsights: (period?: string) => 
    api.get('/ai/financial-insights', { params: { period } }),
  
  generateMessage: (data: Record<string, unknown>) => 
    api.post('/ai/message', data),
  
  sendFeedback: (interactionId: string, feedback: Record<string, unknown>) => 
    api.post('/ai/feedback', { interaction_id: interactionId, ...feedback }),
};

export const financialService = {
  getTransactions: (params?: Record<string, unknown>) => 
    api.get('/financial/transactions', { params }),
  
  createTransaction: (data: Record<string, unknown>) => 
    api.post('/financial/transactions', data),
  
  markAsPaid: (id: string) => 
    api.post(`/financial/transactions/${id}/pay`),
  
  getBudgets: (params?: Record<string, unknown>) => 
    api.get('/financial/budgets', { params }),
  
  createBudget: (data: Record<string, unknown>) => 
    api.post('/financial/budgets', data),
  
  approveBudget: (id: string) => 
    api.post(`/financial/budgets/${id}/approve`),
  
  getDashboard: () => 
    api.get('/financial/dashboard'),
  
  getCashFlow: (params?: Record<string, unknown>) => 
    api.get('/financial/cash-flow', { params }),
};

export const reportService = {
  getDashboard: () => 
    api.get('/reports/dashboard'),
  
  getAppointments: (params?: Record<string, unknown>) => 
    api.get('/reports/appointments', { params }),
  
  getFinancial: (params?: Record<string, unknown>) => 
    api.get('/reports/financial', { params }),
  
  export: (type: string, params?: Record<string, unknown>) => 
    api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};
