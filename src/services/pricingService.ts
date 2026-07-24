import { apiRequest } from './apiClient';

export interface PricingMaster {
  id?: number | string;
  productId: number;
  mrp: number;
  ptr: number;
  pts: number;
  margin: number;
  effectiveDate?: string;
  effectiveTo?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const pricingService = {
  getAll: async (): Promise<PricingMaster[]> => {
    const res = await apiRequest<any>('/pricing');
    return res?.data || [];
  },

  create: async (data: Partial<PricingMaster>): Promise<PricingMaster> => {
    const res = await apiRequest<any>('/pricing', {
      method: 'POST',
      bodyData: data,
    });
    return res?.data;
  },

  update: async (id: number | string, data: Partial<PricingMaster>): Promise<PricingMaster> => {
    const res = await apiRequest<any>(`/pricing/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    return res?.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await apiRequest<any>(`/pricing/${id}`, {
      method: 'DELETE',
    });
  },
};