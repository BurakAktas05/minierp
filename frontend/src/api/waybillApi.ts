import { apiClient, apiRequest, mockStore } from './client';
import { Waybill, WaybillStatus, WaybillType, CreateWaybillRequest } from '../types';

export const waybillApi = {
  getWaybills: async (type?: WaybillType): Promise<Waybill[]> => {
    return apiRequest(
      () => apiClient.get<Waybill[]>('/waybills', { params: { type } }),
      () => mockStore.getWaybills(type)
    );
  },

  getWaybillById: async (id: number): Promise<Waybill> => {
    return apiRequest(
      () => apiClient.get<Waybill>(`/waybills/${id}`),
      () => {
        const w = mockStore.getWaybills().find((item) => item.id === id);
        if (!w) throw new Error('İrsaliye bulunamadı');
        return w;
      }
    );
  },

  createWaybill: async (data: CreateWaybillRequest): Promise<Waybill> => {
    return apiRequest(
      () => apiClient.post<Waybill>('/waybills', data),
      () => {
        const newWaybill: Waybill = {
          id: Date.now(),
          waybillNumber: `IRS-2026-000${mockStore.getWaybills().length + 1}`,
          orderId: data.orderId,
          partnerId: 1,
          partnerTitle: 'Cari Hesap',
          type: 'DISPATCH',
          status: 'DRAFT',
          waybillDate: new Date().toISOString(),
          carrierInfo: data.carrierInfo,
          trackingNumber: data.trackingNumber,
          notes: data.notes,
          items: data.items.map((it) => ({
            variantId: it.variantId,
            quantity: it.quantity,
          })),
        };
        mockStore.getWaybills().unshift(newWaybill);
        return newWaybill;
      }
    );
  },

  createWaybillFromOrder: async (orderId: number): Promise<Waybill> => {
    return apiRequest(
      () => apiClient.post<Waybill>(`/waybills/from-order/${orderId}`),
      () => mockStore.createWaybillFromOrder(orderId)
    );
  },

  updateStatus: async (id: number, status: WaybillStatus): Promise<Waybill> => {
    return apiRequest(
      () => apiClient.patch<Waybill>(`/waybills/${id}/status`, null, { params: { status } }),
      () => mockStore.updateWaybillStatus(id, status)
    );
  },
};
