import axios from 'axios';
import { User, UserFormData, Equipment, Ticket, DepartmentFormData } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ajout d'un intercepteur pour inclure le token dans les en-têtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('API Request to:', config.url);
  console.log('Token present:', token ? 'Yes' : 'No');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set');
  } else {
    console.log('No token found, request will fail authentication');
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    
    if (error.response?.status === 401 && error.config.url !== '/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (userData: UserFormData) =>
    api.post('/auth/register', userData),
  deleteUser: (userId: string) =>
    api.delete(`/users/${userId}`),
  updateProfile: (profileData: Partial<User>) => api.put('/users/profile', profileData),
  updatePassword: (passwordData: { currentPassword: string; newPassword: string }) => api.put('/users/password', passwordData),
  updateAvatar: (avatarUrl: string) => api.put('/users/avatar', { avatarUrl }),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (userData: UserFormData) => api.post('/users', userData),
  update: (id: string, userData: Partial<User>) => api.put(`/users/${id}`, userData),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (departmentData: DepartmentFormData) => api.post('/departments', departmentData),
  update: (id: string, departmentData: DepartmentFormData) => api.put(`/departments/${id}`, departmentData),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const equipmentAPI = {
  getAll: () => api.get('/equipment'),
  getById: (id: string) => api.get(`/equipment/${id}`),
  create: (equipmentData: Omit<Equipment, 'id' | 'created_at'>) => api.post('/equipment', equipmentData),
  update: (id: string, updates: Partial<Equipment>) => api.put(`/equipment/${id}`, updates),
  delete: (id: string) => api.delete(`/equipment/${id}`),
  assign: (id: string, userId: string) => api.put(`/equipment/${id}/assign`, { userId }),
  unassign: (id: string) => api.put(`/equipment/${id}/unassign`),
};

export const ticketsAPI = {
  getAll: () => api.get('/tickets'),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => api.post('/tickets', ticketData),
  update: (id: string, updates: Partial<Ticket>) => api.put(`/tickets/${id}`, updates),
  delete: (id: string) => api.delete(`/tickets/${id}`),
  assign: (id: string, userId: string) => api.put(`/tickets/${id}/assign`, { userId }),
  close: (id: string) => api.put(`/tickets/${id}/close`),
  escalate: (id: string) => api.put(`/tickets/${id}/escalate`),
  getComments: (id: string) => api.get(`/tickets/${id}/comments`),
  addComment: (id: string, content: string) => api.post(`/tickets/${id}/comments`, { content }),
  updateComment: (id: string, commentId: string, content: string) => api.put(`/tickets/${id}/comments/${commentId}`, { content }),
  deleteComment: (id: string, commentId: string) => api.delete(`/tickets/${id}/comments/${commentId}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  create: (notificationData: { type: string; title: string; message: string; user_id: number }) => 
    api.post('/notifications', notificationData),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;