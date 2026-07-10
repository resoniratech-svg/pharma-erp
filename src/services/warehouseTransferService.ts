import { apiRequest } from './apiClient';

export interface WarehouseTransferRecord {
  id?: string;
  transferNo: string;
  date: string;
  fromWarehouseId: number;
  toWarehouseId: number;
  status: string;
  itemsCount: number;
  totalQuantity: number;
  remarks?: string;
  items: Array<{
    productId: number;
    batchId: number;
    quantity: number;
  }>;
}

export const warehouseTransferService = {
  async getAll(): Promise<WarehouseTransferRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/warehouse-transfers');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load warehouse transfers:", e);
      return [];
    }
  },

  async add(record: WarehouseTransferRecord): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>('/warehouse-transfers', {
        method: 'POST',
        bodyData: record,
      });
      return response.success;
    } catch (e) {
      console.error("Failed to save warehouse transfer:", e);
      return false;
    }
  }
};