import { apiRequest } from './apiClient';

export interface GSTRecord {
  id?: number | string;
  hsnCode: string;
  description: string;
  gstPercent: number;
  effectiveDate?: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const gstService = {
  getAll: async (): Promise<GSTRecord[]> => {
    const res = await apiRequest<any>('/gst');
    return res?.data || [];
  },

  create: async (data: Partial<GSTRecord>): Promise<GSTRecord> => {
    const res = await apiRequest<any>('/gst', {
      method: 'POST',
      bodyData: data,
    });
    return res?.data;
  },

  update: async (id: number | string, data: Partial<GSTRecord>): Promise<GSTRecord> => {
    const res = await apiRequest<any>(`/gst/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    return res?.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await apiRequest<any>(`/gst/${id}`, {
      method: 'DELETE',
    });
  },
};