import { apiClient, apiRequest, mockStore } from './client';
import { Order, OrderStatus, OrderType, CreateOrderRequest } from '../types';

export const orderApi = {
  getOrders: async (type?: OrderType): Promise<Order[]> => {
    return apiRequest(
      () => apiClient.get<Order[]>('/orders', { params: { type } }),
      () => mockStore.getOrders(type)
    );
  },

  getOrderById: async (id: number): Promise<Order> => {
    return apiRequest(
      () => apiClient.get<Order>(`/orders/${id}`),
      () => {
        const o = mockStore.getOrders().find((item) => item.id === id);
        if (!o) throw new Error('Sipariş bulunamadı');
        return o;
      }
    );
  },

  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    return apiRequest(
      () => apiClient.post<Order>('/orders', data),
      () => mockStore.addOrder(data)
    );
  },

  createOrderFromQuotation: async (quotationId: number): Promise<Order> => {
    return apiRequest(
      () => apiClient.post<Order>(`/orders/from-quotation/${quotationId}`),
      () => mockStore.convertQuotationToOrder(quotationId)
    );
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    return apiRequest(
      () => apiClient.patch<Order>(`/orders/${id}/status`, null, { params: { status } }),
      () => mockStore.updateOrderStatus(id, status)
    );
  },
};
