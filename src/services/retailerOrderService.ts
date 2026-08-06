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
  retailer?: { name: string; mobile?: string };
  chemist?: { name: string; mobile?: string };
  stockist?: { name: string; mobile?: string };
  hospital?: { name: string; mobile?: string };
  orderItems: Array<{
    productId: number;
    quantity: number;
    rate: number;
    amount: number;
    product?: {
      name: string;
    };
  }>;
}

export const retailerOrderService = {
  async getRetailerOrders(): Promise<RetailerOrderRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/retailer-orders');
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load retailer orders from backend:", e);
      return [];
    }
  },

  async addRetailerOrder(order: any): Promise<any> {
    const response = await apiRequest<{ success: boolean; data: any }>('/retailer-orders', {
      method: 'POST',
      bodyData: order,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to submit order');
    }
    
    return response.data;
  },

  async updateRetailerOrder(id: number | string, data: Partial<{ status: string; totalAmount: number; [key: string]: any }>): Promise<any> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/retailer-orders/${id}`, {
      method: 'PUT',
      bodyData: data,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update order');
    }
    return response.data;
  },

  async deleteRetailerOrder(id: number | string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean; message: string }>(`/retailer-orders/${id}`, {
      method: 'DELETE',
    });
    return response.success;
  }
};
