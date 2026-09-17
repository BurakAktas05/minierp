import { apiClient } from './client';
import { AuditLog } from '../types';

export const auditApi = {
  getAllLogs: async (): Promise<AuditLog[]> => {
    const res = await apiClient.get<any>('/audit-logs');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((item: any) => ({
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
  },

  getLogsByEntity: async (type: string, id: number): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>('/audit-logs/entity', { params: { type, id } });
    return Array.isArray(res.data) ? res.data : [];
  },

  getLogsByUser: async (username: string): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>('/audit-logs/user', { params: { username } });
    return Array.isArray(res.data) ? res.data : [];
  },
};
