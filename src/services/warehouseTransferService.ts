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
      const response = await apiRequest<any>('/warehouse-transfers');
      let data = response;
      if (response && response.success && response.data) {
        data = response.data;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load warehouse transfers:", e);
      return [];
    }
  },

  async add(record: WarehouseTransferRecord): Promise<boolean> {
    try {
      const response = await apiRequest<any>('/warehouse-transfers', {
        method: 'POST',
        bodyData: record,
      });
      if (response && response.id) {
        return true;
      }
      if (response && response.success) {
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to save warehouse transfer:", e);
      return false;
    }
  },

  async updateStatus(id: string, status: string): Promise<boolean> {
    try {
      const response = await apiRequest<any>(`/warehouse-transfers/${id}/status`, {
        method: 'PUT',
        bodyData: { status },
      });
      return !!(response && response.success);
    } catch (e) {
      console.error(`Failed to update status for transfer ${id}:`, e);
      return false;
    }
  }
};