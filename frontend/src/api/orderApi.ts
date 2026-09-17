import { apiClient } from './client';
import { Order, OrderStatus, OrderType, CreateOrderRequest } from '../types';

export const orderApi = {
  getOrders: async (type?: OrderType): Promise<Order[]> => {
    const res = await apiClient.get<Order[]>('/orders', { params: { type } });
    return Array.isArray(res.data) ? res.data : [];
  },

  getOrderById: async (id: number): Promise<Order> => {
    const res = await apiClient.get<Order>(`/orders/${id}`);
    return res.data;
  },

  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const res = await apiClient.post<Order>('/orders', data);
    return res.data;
  },

  updateOrder: async (id: number, data: CreateOrderRequest): Promise<Order> => {
    const res = await apiClient.put<Order>(`/orders/${id}`, data);
    return res.data;
  },

  convertQuotationToOrder: async (quotationId: number): Promise<Order> => {
    const res = await apiClient.post<Order>(`/orders/from-quotation/${quotationId}`);
    return res.data;
  },

  createOrderFromQuotation: async (quotationId: number): Promise<Order> => {
    const res = await apiClient.post<Order>(`/orders/from-quotation/${quotationId}`);
    return res.data;
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const res = await apiClient.patch<Order>(`/orders/${id}/status`, null, { params: { status } });
    return res.data;
  },
};
