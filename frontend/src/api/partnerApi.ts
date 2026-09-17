import { apiClient } from './client';
import { BusinessPartner, PartnerType, PartnerStatement } from '../types';

export const partnerApi = {
  getPartners: async (type?: PartnerType): Promise<BusinessPartner[]> => {
    const res = await apiClient.get<any>('/partners', { params: { type } });
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((item: any) => ({
      id: item.id,
      code: item.code || `CAR-00${item.id}`,
      title: item.title || item.companyTitle || item.name || 'Cari Hesap',
      type: item.type || item.partnerType || 'CUSTOMER',
      taxNumber: item.taxNumber,
      taxOffice: item.taxOffice,
      email: item.email,
      phone: item.phone,
      address: item.address,
      metadata: item.metadata || {},
      active: item.active !== false,
      totalDebit: item.totalDebit || 0,
      totalCredit: item.totalCredit || 0,
      balance: item.balance || 0,
      createdAt: item.createdAt,
    }));
  },

  getPartnerById: async (id: number): Promise<BusinessPartner> => {
    const res = await apiClient.get<any>(`/partners/${id}`);
    const item = res.data;
    return {
      id: item.id,
      code: item.code || `CAR-00${item.id}`,
      title: item.title || item.companyTitle || item.name || 'Cari Hesap',
      type: item.type || item.partnerType || 'CUSTOMER',
      taxNumber: item.taxNumber,
      taxOffice: item.taxOffice,
      email: item.email,
      phone: item.phone,
      address: item.address,
      metadata: item.metadata || {},
      active: item.active !== false,
      totalDebit: item.totalDebit || 0,
      totalCredit: item.totalCredit || 0,
      balance: item.balance || 0,
      createdAt: item.createdAt,
    };
  },

  getPartnerStatement: async (id: number): Promise<PartnerStatement> => {
    const res = await apiClient.get<PartnerStatement>(`/partners/${id}/statement`);
    return res.data;
  },

  createPartner: async (data: Omit<BusinessPartner, 'id'>): Promise<BusinessPartner> => {
    const payload = {
      ...data,
      name: data.title,
      companyTitle: data.title,
      partnerType: data.type,
    };
    const res = await apiClient.post<BusinessPartner>('/partners', payload);
    return res.data;
  },

  updatePartner: async (id: number, data: Partial<BusinessPartner>): Promise<BusinessPartner> => {
    const payload: any = { ...data };
    if (data.title) {
      payload.name = data.title;
      payload.companyTitle = data.title;
    }
    if (data.type) {
      payload.partnerType = data.type;
    }
    const res = await apiClient.put<BusinessPartner>(`/partners/${id}`, payload);
    return res.data;
  },
};
