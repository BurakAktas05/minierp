import { apiClient } from './client';
import {
  Invoice,
  InvoiceStatus,
  InvoiceType,
  CreateInvoiceRequest,
  Payment,
  CreatePaymentRequest,
} from '../types';

export const invoiceApi = {
  getInvoices: async (type?: InvoiceType): Promise<Invoice[]> => {
    const res = await apiClient.get<Invoice[]>('/invoices', { params: { type } });
    return Array.isArray(res.data) ? res.data : [];
  },

  getInvoiceById: async (id: number): Promise<Invoice> => {
    const res = await apiClient.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },

  createInvoice: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>('/invoices', data);
    return res.data;
  },

  createInvoiceFromWaybill: async (waybillId: number): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>(`/invoices/from-waybill/${waybillId}`);
    return res.data;
  },

  createInvoiceFromOrder: async (orderId: number): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>(`/invoices/from-order/${orderId}`);
    return res.data;
  },

  updateInvoice: async (id: number, data: CreateInvoiceRequest): Promise<Invoice> => {
    const res = await apiClient.put<Invoice>(`/invoices/${id}`, data);
    return res.data;
  },

  updateInvoiceStatus: async (id: number, status: InvoiceStatus): Promise<Invoice> => {
    const res = await apiClient.patch<Invoice>(`/invoices/${id}/status`, null, { params: { status } });
    return res.data;
  },

  updateStatus: async (id: number, status: InvoiceStatus): Promise<Invoice> => {
    const res = await apiClient.patch<Invoice>(`/invoices/${id}/status`, null, { params: { status } });
    return res.data;
  },

  addPayment: async (invoiceId: number, data: CreatePaymentRequest): Promise<Payment> => {
    const res = await apiClient.post<Payment>(`/invoices/${invoiceId}/payments`, data);
    return res.data;
  },

  getPaymentsByInvoice: async (invoiceId: number): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>(`/invoices/${invoiceId}/payments`);
    return Array.isArray(res.data) ? res.data : [];
  },

  getAllPayments: async (): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>('/invoices/payments');
    return Array.isArray(res.data) ? res.data : [];
  },
};
