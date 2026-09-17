import { apiClient } from './client';
import { TreasuryAccount, CreateTreasuryAccountRequest } from '../types';

export const treasuryApi = {
  getAllAccounts: async (): Promise<TreasuryAccount[]> => {
    const res = await apiClient.get<TreasuryAccount[]>('/treasury/accounts');
    return Array.isArray(res.data) ? res.data : [];
  },

  getAccountById: async (id: number): Promise<TreasuryAccount> => {
    const res = await apiClient.get<TreasuryAccount>(`/treasury/accounts/${id}`);
    return res.data;
  },

  createAccount: async (data: CreateTreasuryAccountRequest): Promise<TreasuryAccount> => {
    const res = await apiClient.post<TreasuryAccount>('/treasury/accounts', data);
    return res.data;
  },

  updateAccount: async (id: number, data: CreateTreasuryAccountRequest): Promise<TreasuryAccount> => {
    const res = await apiClient.put<TreasuryAccount>(`/treasury/accounts/${id}`, data);
    return res.data;
  },

  deleteAccount: async (id: number): Promise<void> => {
    await apiClient.delete(`/treasury/accounts/${id}`);
  },
};
