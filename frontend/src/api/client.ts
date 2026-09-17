import axios, { AxiosError } from 'axios';

// Storage keys
export const TOKEN_KEY = 'minierp_token';
export const TENANT_KEY = 'minierp_tenant_id';
export const USER_KEY = 'minierp_user';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT and Tenant ID
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const tenantId = localStorage.getItem(TENANT_KEY) || 'tenant_tekstil';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});

// Response Interceptor: Unwrap ApiResponse<T> (res.data.data) and handle 401
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns ApiResponse<T> { success: true, data: ... }
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear credentials on 401
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
