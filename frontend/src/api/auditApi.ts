import { apiClient, apiRequest, mockStore } from './client';
import { AuditLog } from '../types';

export const auditApi = {
  getAllLogs: async (): Promise<AuditLog[]> => {
    return apiRequest(
      async () => {
        const res = await apiClient.get<any>('/audit-logs');
        const raw = res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data;
        const list = Array.isArray(raw) ? raw : [];
        const normalized: AuditLog[] = list.map((item: any) => ({
          id: item.id,
          username: item.username || item.performedBy || 'system',
          action: item.action,
          entityType: item.entityType,
          entityId: item.entityId,
          oldValue: item.oldValue,
          newValue: item.newValue,
          details: item.details || {},
          ipAddress: item.ipAddress || '127.0.0.1',
          timestamp: item.timestamp || item.performedAt || new Date().toISOString(),
        }));
        return { data: normalized };
      },
      () => mockStore.getAuditLogs()
    );
  },

  getLogsByEntity: async (type: string, id: number): Promise<AuditLog[]> => {
    return apiRequest(
      () => apiClient.get<AuditLog[]>('/audit-logs/entity', { params: { type, id } }),
      () => mockStore.getAuditLogs().filter((l) => l.entityType === type && l.entityId === id)
    );
  },

  getLogsByUser: async (username: string): Promise<AuditLog[]> => {
    return apiRequest(
      () => apiClient.get<AuditLog[]>('/audit-logs/user', { params: { username } }),
      () => mockStore.getAuditLogs().filter((l) => l.username.toLowerCase() === username.toLowerCase())
    );
  },
};

