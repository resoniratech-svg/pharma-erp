import { apiRequest } from './apiClient';

export interface Manufacturer {
  id?: number;
  companyId?: number;
  name: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
}

export const manufacturerService = {
  getManufacturers: async () => {
    const response = await apiRequest<{ success: boolean; data: Manufacturer[] }>('/manufacturers');
    return response.data || [];
  },
  createManufacturer: async (data: Manufacturer) => {
    const response = await apiRequest<{ success: boolean; data: Manufacturer }>('/manufacturers', {
      method: 'POST',
      bodyData: data
    });
    return response.data;
  },
  updateManufacturer: async (id: number, data: Partial<Manufacturer>) => {
    const response = await apiRequest<{ success: boolean; data: Manufacturer }>('/manufacturers/' + id, {
      method: 'PUT',
      bodyData: data
    });
    return response.data;
  },
  deleteManufacturer: async (id: number) => {
    const response = await apiRequest<{ success: boolean; message: string }>('/manufacturers/' + id, {
      method: 'DELETE'
    });
    return response.success;
  }
};
