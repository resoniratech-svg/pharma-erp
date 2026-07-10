import { apiRequest } from './apiClient';

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
}

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: Supplier[] }>('/suppliers');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load suppliers:", e);
      return [];
    }
  },

  async add(name: string): Promise<Supplier | null> {
    try {
      const response = await apiRequest<{ success: boolean; data: Supplier }>('/suppliers', {
        method: 'POST',
        bodyData: { name },
      });
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (e) {
      console.error("Failed to add supplier:", e);
      return null;
    }
  }
};
