import { apiRequest } from './apiClient';

export interface DispatchRecord {
  id: number;
  dispatchNo: string;
  dispatchType: string;
  orderId: string;
  customerName: string;
  sourceWarehouse: string;
  warehouseId: number;
  totalItems: number;
  totalQuantity: number;
  status: string;
  remarks?: string;
  transporter?: string;
  lrNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverMobile?: string;
  createdBy?: string;
  createdDate?: string;
  products?: any;
  createdAt: string;
}

export const dispatchService = {
  async getAll(): Promise<DispatchRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/dispatches');
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load dispatches from backend:", e);
      return [];
    }
  },

  async getById(id: string | number): Promise<DispatchRecord | null> {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>('/dispatches/' + id);
      if (response && response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (e) {
      console.error("Failed to load dispatch detail from backend:", e);
      return null;
    }
  },

  async updateDispatchStatus(id: string | number, status: string, extraData?: any): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean }>('/dispatches/' + id, {
        method: 'PATCH',
        bodyData: { status, ...extraData }
      });
      return !!(response && response.success);
    } catch (e) {
      console.error("Failed to update dispatch status on backend:", e);
      return false;
    }
  }
};
