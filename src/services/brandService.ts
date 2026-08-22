import { apiRequest } from './apiClient';

export interface Brand {
  id?: number;
  companyId?: number;
  brandName: string;
  shortName?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export const brandService = {
  getBrands: async () => {
    const response = await apiRequest<{ success: boolean; data: Brand[] }>('/brands');
    return response.data || [];
  },
  createBrand: async (data: Brand) => {
    const response = await apiRequest<{ success: boolean; data: Brand }>('/brands', {
      method: 'POST',
      bodyData: data
    });
    return response.data;
  },
  updateBrand: async (id: number, data: Partial<Brand>) => {
    const response = await apiRequest<{ success: boolean; data: Brand }>('/brands/' + id, {
      method: 'PUT',
      bodyData: data
    });
    return response.data;
  },
  deleteBrand: async (id: number) => {
    const response = await apiRequest<{ success: boolean; message: string }>('/brands/' + id, {
      method: 'DELETE'
    });
    return response.success;
  }
};
