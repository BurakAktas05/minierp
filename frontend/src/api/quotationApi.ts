import { apiClient, apiRequest, mockStore } from './client';
import { Quotation, QuotationStatus, QuotationType, CreateQuotationRequest } from '../types';

export const quotationApi = {
  getQuotations: async (type?: QuotationType): Promise<Quotation[]> => {
    return apiRequest(
      () => apiClient.get<Quotation[]>('/quotations', { params: { type } }),
      () => mockStore.getQuotations(type)
    );
  },

  getQuotationById: async (id: number): Promise<Quotation> => {
    return apiRequest(
      () => apiClient.get<Quotation>(`/quotations/${id}`),
      () => {
        const q = mockStore.getQuotations().find((item) => item.id === id);
        if (!q) throw new Error('Teklif bulunamadı');
        return q;
      }
    );
  },

  createQuotation: async (data: CreateQuotationRequest): Promise<Quotation> => {
    return apiRequest(
      () => apiClient.post<Quotation>('/quotations', data),
      () => mockStore.addQuotation(data)
    );
  },

  updateStatus: async (id: number, status: QuotationStatus): Promise<Quotation> => {
    return apiRequest(
      () => apiClient.patch<Quotation>(`/quotations/${id}/status`, null, { params: { status } }),
      () => mockStore.updateQuotationStatus(id, status)
    );
  },
};
