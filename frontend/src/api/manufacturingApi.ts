import { apiClient } from './client';
import {
  BillOfMaterials,
  CreateBomRequest,
  WorkOrder,
  CreateWorkOrderRequest,
  WorkOrderStatus,
  SectorTemplate,
  ProductVariant,
} from '../types';

export const manufacturingApi = {
  // 1. Üretim Reçeteleri (BOM)
  getBoms: async (industryType?: string): Promise<BillOfMaterials[]> => {
    const res = await apiClient.get<BillOfMaterials[]>('/manufacturing/boms', {
      params: { industryType },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  getBomById: async (id: number): Promise<BillOfMaterials> => {
    const res = await apiClient.get<BillOfMaterials>(`/manufacturing/boms/${id}`);
    return res.data;
  },

  createBom: async (data: CreateBomRequest): Promise<BillOfMaterials> => {
    const res = await apiClient.post<BillOfMaterials>('/manufacturing/boms', data);
    return res.data;
  },

  getManufacturableVariants: async (): Promise<ProductVariant[]> => {
    const res = await apiClient.get<ProductVariant[]>('/manufacturing/manufacturable-variants');
    return Array.isArray(res.data) ? res.data : [];
  },

  getComponentVariants: async (): Promise<ProductVariant[]> => {
    const res = await apiClient.get<ProductVariant[]>('/manufacturing/component-variants');
    return Array.isArray(res.data) ? res.data : [];
  },

  // 2. Üretim İş Emirleri (Work Orders)
  getWorkOrders: async (status?: WorkOrderStatus): Promise<WorkOrder[]> => {
    const res = await apiClient.get<WorkOrder[]>('/manufacturing/work-orders', {
      params: { status },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  getWorkOrderById: async (id: number): Promise<WorkOrder> => {
    const res = await apiClient.get<WorkOrder>(`/manufacturing/work-orders/${id}`);
    return res.data;
  },

  createWorkOrder: async (data: CreateWorkOrderRequest): Promise<WorkOrder> => {
    const res = await apiClient.post<WorkOrder>('/manufacturing/work-orders', data);
    return res.data;
  },

  updateWorkOrderStatus: async (id: number, status: WorkOrderStatus): Promise<WorkOrder> => {
    const res = await apiClient.patch<WorkOrder>(`/manufacturing/work-orders/${id}/status`, null, {
      params: { status },
    });
    return res.data;
  },

  // 3. 10 Sektör Şablonları & Parametreleri
  getSectorTemplates: async (): Promise<SectorTemplate[]> => {
    const res = await apiClient.get<SectorTemplate[]>('/manufacturing/sectors');
    return Array.isArray(res.data) ? res.data : [];
  },
};
