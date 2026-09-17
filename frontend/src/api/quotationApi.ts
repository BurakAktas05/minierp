import { apiClient } from './client';
import { Quotation, QuotationStatus, QuotationType } from '../types';

export const quotationApi = {
  getQuotations: async (type?: QuotationType): Promise<Quotation[]> => {
    const res = await apiClient.get<Quotation[]>('/quotations', { params: { type } });
    return Array.isArray(res.data) ? res.data : [];
  },

  getQuotationById: async (id: number): Promise<Quotation> => {
    const res = await apiClient.get<Quotation>(`/quotations/${id}`);
    return res.data;
  },

  createQuotation: async (data: any): Promise<Quotation> => {
    const res = await apiClient.post<Quotation>('/quotations', data);
    return res.data;
  },

  updateQuotation: async (id: number, data: any): Promise<Quotation> => {
    const res = await apiClient.put<Quotation>(`/quotations/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: number, status: QuotationStatus): Promise<Quotation> => {
    const res = await apiClient.patch<Quotation>(`/quotations/${id}/status`, null, { params: { status } });
    return res.data;
  },
};
