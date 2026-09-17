import { apiClient } from './client';
import { AuthResponse, Tenant, CreateTenantRequest, User } from '../types';

export const authApi = {
  login: async (tenantId: string, username: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { tenantId, username, password });
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  getTenants: async (): Promise<Tenant[]> => {
    const res = await apiClient.get<Tenant[]>('/tenants');
    return res.data;
  },

  createTenant: async (data: CreateTenantRequest): Promise<Tenant> => {
    const res = await apiClient.post<Tenant>('/tenants', {
      tenantId: data.tenantId,
      companyName: data.name,
      schemaName: data.tenantId,
    });
    return res.data;
  },
};
