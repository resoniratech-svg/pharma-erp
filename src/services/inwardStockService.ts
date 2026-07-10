import { apiRequest } from './apiClient';

export interface InwardStockRecord {
  id?: string;
  grnNo: string;
  date: string;
  supplierId: number;
  warehouseId: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: string;
  remarks?: string;
  items: Array<{
    productId: number;
    batchNo: string;
    mfgDate?: string;
    expiryDate?: string;
    quantity: number;
    ptr: number;
    mrp: number;
  }>;
}

export const inwardStockService = {
  async getAll(): Promise<InwardStockRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/inward-stock');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load inward stock:", e);
      return [];
    }
  },

  async add(record: InwardStockRecord): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>('/inward-stock', {
        method: 'POST',
        bodyData: record,
      });
      return response.success;
    } catch (e) {
      console.error("Failed to save inward stock:", e);
      return false;
    }
  }
};