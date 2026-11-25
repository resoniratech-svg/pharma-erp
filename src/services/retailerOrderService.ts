import { apiRequest } from './apiClient';

export interface RetailerOrderRecord {
  id: number;
  retailerId?: number;
  chemistId?: number;
  hospitalId?: number;
  stockistId?: number;
  mrId?: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  createdAt?: string;
  retailer?: {
    id?: number;
    name: string;
    code: string;
    mobile?: string;
    address?: string;
    contactPerson?: string;
  };
  chemist?: { name: string; mobile?: string };
  stockist?: {
    id?: number;
    name: string;
    code?: string;
    mobile?: string;
    address?: string;
  };
  hospital?: { name: string; mobile?: string };
  orderItems: Array<{
    id?: number;
    productId: number;
    quantity: number;
    rate: number;
    amount: number;
    product?: {
      id?: number;
      name: string;
      code?: string;
    };
  }>;
}

export const retailerOrderService = {
  async getRetailerOrders(): Promise<RetailerOrderRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: RetailerOrderRecord[] }>('/retailer-orders');
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.warn("Notice: could not load retailer orders from backend API:", e);
      return [];
    }
  },

  async addRetailerOrder(order: any): Promise<RetailerOrderRecord | null> {
    try {
      const response = await apiRequest<{ success: boolean; data: RetailerOrderRecord }>('/retailer-orders', {
        method: 'POST',
        bodyData: order,
      });
      if (response && response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to submit retailer order to backend API:', e);
      return null;
    }
  },

  async updateRetailerOrder(id: number | string, data: Partial<{ status: string; totalAmount: number; [key: string]: any }>): Promise<any> {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>(`/retailer-orders/${id}`, {
        method: 'PUT',
        bodyData: data,
      });
      if (response && response.success) {
        return response.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to update retailer order on backend API:', e);
      return null;
    }
  },

  async deleteRetailerOrder(id: number | string): Promise<boolean> {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(`/retailer-orders/${id}`, {
        method: 'DELETE',
      });
      return !!(response && response.success);
    } catch (e) {
      console.error('Failed to delete retailer order on backend API:', e);
      return false;
    }
  }
};
