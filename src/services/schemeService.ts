import { apiRequest } from './apiClient';

export interface SchemeMaster {
  id?: number | string;
  code: string;
  name: string;
  productId: number;
  buyQty: number;
  freeQty: number;
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export const schemeService = {
  getAll: async (): Promise<SchemeMaster[]> => {
    const res = await apiRequest<any>('/schemes');
    return res?.data || [];
  },

  create: async (data: Partial<SchemeMaster>): Promise<SchemeMaster> => {
    const res = await apiRequest<any>('/schemes', {
      method: 'POST',
      bodyData: data,
    });
    return res?.data;
  },

  update: async (id: number | string, data: Partial<SchemeMaster>): Promise<SchemeMaster> => {
    const res = await apiRequest<any>(`/schemes/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    return res?.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await apiRequest<any>(`/schemes/${id}`, {
      method: 'DELETE',
    });
  },
};