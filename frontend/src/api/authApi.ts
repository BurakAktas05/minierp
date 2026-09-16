import { apiClient, apiRequest, mockStore, TOKEN_KEY, TENANT_KEY, USER_KEY } from './client';
import { AuthResponse, Tenant, CreateTenantRequest, User } from '../types';

export const authApi = {
  login: async (tenantId: string, username: string, password: string): Promise<AuthResponse> => {
    return apiRequest(
      () => apiClient.post<AuthResponse>('/auth/login', { tenantId, username, password }),
      () => {
        // Mock login response
        const role = username.toLowerCase().includes('admin')
          ? 'ROLE_ADMIN'
          : username.toLowerCase().includes('manager')
          ? 'ROLE_MANAGER'
          : 'ROLE_USER';

        const mockResponse: AuthResponse = {
          token: 'mock-jwt-token-' + Date.now(),
          tokenType: 'Bearer',
          username,
          email: `${username}@${tenantId}.com`,
          role,
          tenantId,
        };
        return mockResponse;
      }
    );
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest(
      () => apiClient.get<User>('/auth/me'),
      () => {
        const saved = localStorage.getItem(USER_KEY);
        if (saved) return JSON.parse(saved);
        return {
          username: 'admin',
          role: 'ROLE_ADMIN',
          tenantId: localStorage.getItem(TENANT_KEY) || 'tenant_tekstil',
        };
      }
    );
  },

  getTenants: async (): Promise<Tenant[]> => {
    return apiRequest(
      () => apiClient.get<Tenant[]>('/tenants'),
      () => mockStore.getTenants()
    );
  },

  createTenant: async (data: CreateTenantRequest): Promise<Tenant> => {
    return apiRequest(
      () =>
        apiClient.post<Tenant>('/tenants', {
          tenantId: data.tenantId,
          companyName: data.name,
          schemaName: data.tenantId,
        }),
      () => {
        const newTenant: Tenant = {
          id: data.tenantId,
          name: data.name,
          schemaName: data.tenantId,
          active: true,
          createdAt: new Date().toISOString(),
        };
        return mockStore.addTenant(newTenant);
      }
    );
  },

};
