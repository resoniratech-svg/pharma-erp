import { apiRequest } from './apiClient';

export interface HSNCode {
  id?: number | string;
  code: string;
  description: string;
  status: 'Active' | 'Inactive';
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const hsnService = {
  getAll: async (): Promise<HSNCode[]> => {
    const res = await apiRequest<any>('/hsn');
    return res?.data || [];
  },

  getActive: async (): Promise<HSNCode[]> => {
    const all = await hsnService.getAll();
    return all.filter((item: HSNCode) => item.status === 'Active');
  },

  getByCode: async (code: string): Promise<HSNCode | undefined> => {
    const all = await hsnService.getAll();
    return all.find((item: HSNCode) => item.code === code);
  },

  create: async (data: Partial<HSNCode>): Promise<HSNCode> => {
    const res = await apiRequest<any>('/hsn', {
      method: 'POST',
      bodyData: data,
    });
    return res?.data;
  },

  update: async (id: number | string, data: Partial<HSNCode>): Promise<HSNCode> => {
    const res = await apiRequest<any>(`/hsn/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    return res?.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await apiRequest<any>(`/hsn/${id}`, {
      method: 'DELETE',
    });
  },
};
