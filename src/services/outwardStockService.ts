import { apiRequest } from './apiClient';

export interface OutwardStockRecord {
  id?: string;
  dispatchNo: string;
  date: string;
  client: string;
  warehouseId: number;
  referenceNumber?: string;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: string;
  remarks?: string;
  items: Array<{
    productId: number;
    batchId: number;
    quantity: number;
    rate: number;
  }>;
}

export const outwardStockService = {
  async getAll(): Promise<OutwardStockRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/outward-stock');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load outward stock:", e);
      return [];
    }
  },

  async add(record: OutwardStockRecord): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>('/outward-stock', {
        method: 'POST',
        bodyData: record,
      });
      return response.success;
    } catch (e) {
      console.error("Failed to save outward stock:", e);
      return false;
    }
  }
};