import { apiRequest } from './apiClient';

export interface PackingType {
  id?: number | string;
  name: string;
  code: string;
  uom: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export const packingTypeService = {
  getAll: async (): Promise<PackingType[]> => {
    const res = await apiRequest<any>('/packing-types');
    return res?.data || [];
  },

  create: async (data: Partial<PackingType>): Promise<PackingType> => {
    const res = await apiRequest<any>('/packing-types', {
      method: 'POST',
      bodyData: data,
    });
    return res?.data;
  },

  update: async (id: number | string, data: Partial<PackingType>): Promise<PackingType> => {
    const res = await apiRequest<any>(`/packing-types/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    return res?.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await apiRequest<any>(`/packing-types/${id}`, {
      method: 'DELETE',
    });
  },
};