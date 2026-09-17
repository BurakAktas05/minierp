import { apiClient } from './client';
import { Waybill, WaybillStatus, WaybillType, CreateWaybillRequest } from '../types';

export const waybillApi = {
  getWaybills: async (type?: WaybillType): Promise<Waybill[]> => {
    const res = await apiClient.get<Waybill[]>('/waybills', { params: { type } });
    return Array.isArray(res.data) ? res.data : [];
  },

  getWaybillById: async (id: number): Promise<Waybill> => {
    const res = await apiClient.get<Waybill>(`/waybills/${id}`);
    return res.data;
  },

  createWaybill: async (data: CreateWaybillRequest): Promise<Waybill> => {
    const res = await apiClient.post<Waybill>('/waybills', data);
    return res.data;
  },

  createWaybillFromOrder: async (orderId: number): Promise<Waybill> => {
    const res = await apiClient.post<Waybill>(`/waybills/from-order/${orderId}`);
    return res.data;
  },

  updateStatus: async (id: number, status: WaybillStatus): Promise<Waybill> => {
    const res = await apiClient.patch<Waybill>(`/waybills/${id}/status`, null, { params: { status } });
    return res.data;
  },
};
