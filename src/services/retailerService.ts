import { apiRequest } from './apiClient';

export interface RetailerRecord {
  id: number;
  stockistId: number;
  name: string;
  code: string;
  mobile: string;
  email: string;
  address: string;
  isActive: boolean;
}

export const retailerService = {
  async getRetailers(): Promise<RetailerRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: RetailerRecord[] }>('/retailers');
      return response.success ? response.data : [];
    } catch (e) {
      console.error("Failed to load retailers from backend:", e);
      return [];
    }
  }
};
