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
  warehouseCode?: string;
  warehouseName?: string;
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
      const response = await apiRequest<any>('/outward-stock');
      let data = response;
      if (response && response.success && response.data) {
        data = response.data;
      }
      if (Array.isArray(data)) {
        return data.map(item => ({
          ...item,
          warehouseCode: item.warehouse ? item.warehouse.code : "",
          warehouseName: item.warehouse ? item.warehouse.name : "",
        }));
      }
      return [];
    } catch (e) {
      console.error("Failed to load outward stock:", e);
      return [];
    }
  },

  async add(record: OutwardStockRecord): Promise<boolean> {
    try {
      const response = await apiRequest<any>('/outward-stock', {
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
      console.error("Failed to save outward stock:", e);
      return false;
    }
  }
};