import axios from 'axios';
import { auth } from './firebase';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (!response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = response;

    // Handle different error status codes
    switch (status) {
      case 401:
        // Unauthorized - token expired or invalid
        if (auth.currentUser) {
          // Redirect to login or refresh token
          toast.error('Session expired. Please login again.');
          // You can dispatch a logout action here
        }
        break;
      
      case 403:
        // Forbidden
        toast.error(data.message || 'Access forbidden');
        break;
      
      case 404:
        // Not found
        toast.error(data.message || 'Resource not found');
        break;
      
      case 409:
        // Conflict
        toast.error(data.message || 'Conflict error');
        break;
      
      case 422:
        // Validation errors
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            toast.error(err.message || err.msg);
          });
        } else {
          toast.error(data.message || 'Validation error');
        }
        break;
      
      case 429:
        // Rate limiting
        toast.error('Too many requests. Please try again later.');
        break;
      
      case 500:
        // Server error
        toast.error('Server error. Please try again later.');
        break;
      
      default:
        // Generic error
        toast.error(data.message || `Error: ${status}`);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    profile: '/api/auth/profile',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    deleteAccount: '/api/auth/account',
  },
  
  // Matches
  matches: {
    list: '/api/matches',
    create: '/api/matches',
    getById: (id) => `/api/matches/${id}`,
    update: (id) => `/api/matches/${id}`,
    delete: (id) => `/api/matches/${id}`,
    join: (id) => `/api/matches/${id}/join`,
    leave: (id) => `/api/matches/${id}/leave`,
    start: (id) => `/api/matches/${id}/start`,
    complete: (id) => `/api/matches/${id}/complete`,
  },
  
  // Payments
  payments: {
    createPaymentLink: '/api/payments/create-payment-link',
    verify: '/api/payments/verify',
    markCash: '/api/payments/mark-cash-payment',
    byMatch: (matchId) => `/api/payments/match/${matchId}`,
    byUser: '/api/payments/user',
    refund: '/api/payments/refund',
  },
  
  // Users
  users: {
    matches: '/api/users/matches',
    payments: '/api/users/payments',
    stats: '/api/users/stats',
    search: '/api/users/search',
    notifications: '/api/users/notifications',
    publicProfile: (id) => `/api/users/${id}/public`,
  },
  
  // Admin
  admin: {
    dashboard: '/api/admin/dashboard',
    users: '/api/admin/users',
    updateUser: (id) => `/api/admin/users/${id}`,
    matches: '/api/admin/matches',
    deleteMatch: (id) => `/api/admin/matches/${id}`,
    payments: '/api/admin/payments',
    analytics: '/api/admin/analytics',
  },
};

// Helper functions for common API calls
export const apiHelpers = {
  // Generic GET request
  get: (url, params = {}) => api.get(url, { params }),
  
  // Generic POST request
  post: (url, data = {}) => api.post(url, data),
  
  // Generic PUT request
  put: (url, data = {}) => api.put(url, data),
  
  // Generic DELETE request
  delete: (url) => api.delete(url),
  
  // Upload file
  upload: (url, formData) => api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Download file
  download: (url, filename) => {
    return api.get(url, { responseType: 'blob' })
      .then(response => {
        const blob = new Blob([response.data]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      });
  },
};

export default api;
