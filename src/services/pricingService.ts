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
    const data = res?.data || [];
    const meta = JSON.parse(localStorage.getItem('pricing_meta') || '{}');
    return data.map((item: any) => ({
      ...item,
      effectiveTo: meta[item.id]?.effectiveTo,
      remarks: meta[item.id]?.remarks,
    }));
  },

  create: async (data: Partial<PricingMaster>): Promise<PricingMaster> => {
    const res = await apiRequest<any>('/pricing', {
      method: 'POST',
      bodyData: data,
    });
    if (res?.data?.id) {
      const meta = JSON.parse(localStorage.getItem('pricing_meta') || '{}');
      meta[res.data.id] = { effectiveTo: data.effectiveTo, remarks: data.remarks };
      localStorage.setItem('pricing_meta', JSON.stringify(meta));
    }
    return { ...res?.data, effectiveTo: data.effectiveTo, remarks: data.remarks };
  },

  update: async (id: number | string, data: Partial<PricingMaster>): Promise<PricingMaster> => {
    const res = await apiRequest<any>(`/pricing/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    const updated = res?.data || { id };
    const meta = JSON.parse(localStorage.getItem('pricing_meta') || '{}');
    meta[updated.id] = { effectiveTo: data.effectiveTo, remarks: data.remarks };
    localStorage.setItem('pricing_meta', JSON.stringify(meta));
    return { ...updated, effectiveTo: data.effectiveTo, remarks: data.remarks };
  },

  delete: async (id: number | string): Promise<void> => {
    await apiRequest<any>(`/pricing/${id}`, {
      method: 'DELETE',
    });
    const meta = JSON.parse(localStorage.getItem('pricing_meta') || '{}');
    delete meta[id];
    localStorage.setItem('pricing_meta', JSON.stringify(meta));
  },
};