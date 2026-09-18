import axios, { AxiosError } from 'axios';

// Tarayıcı yerel depolama anahtarları
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

// İstek Araya Girici (Request Interceptor): JWT ve Kiracı Kimliğini (Tenant ID) ekle
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

// Yanıt Araya Girici (Response Interceptor): ApiResponse zarfını aç ve 401 yetkisiz durumunu yönet
apiClient.interceptors.response.use(
  (response) => {
    // Backend standart ApiResponse<T> ({ success: true, data: ... }) dönerse iç veriyi al
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
      // 401 oturum zaman aşımında yerel oturum bilgilerini temizle ve yönlendir
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
