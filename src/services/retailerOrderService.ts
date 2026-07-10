import { apiRequest } from './apiClient';

export interface RetailerOrderRecord {
  id: number;
  retailerId: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  retailer?: {
    name: string;
    mobile: string;
  };
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
        const mapped = response.data.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerType: 'Retailer',
          customerName: o.retailer?.name || 'Retailer',
          customerMobile: o.retailer?.mobile || '',
          productName: o.orderItems && o.orderItems.length > 0 ? o.orderItems[0].product?.name || 'Product' : 'Product',
          quantity: o.orderItems && o.orderItems.length > 0 ? o.orderItems[0].quantity : 0,
          rate: o.orderItems && o.orderItems.length > 0 ? o.orderItems[0].rate : 0,
          totalAmount: o.totalAmount,
          remarks: o.remarks || '',
          status: o.status === 'PENDING' ? 'Booked' : (o.status === 'DELIVERED' ? 'Delivered' : o.status === 'CANCELLED' ? 'Cancelled' : 'Booked'),
          dateFormatted: o.orderDate ? o.orderDate.split('T')[0] : new Date().toISOString().split('T')[0],
          date: o.orderDate ? o.orderDate.split('T')[0] : new Date().toISOString().split('T')[0],
          mrId: o.mrId,
        }));
        localStorage.setItem('web_orders', JSON.stringify(mapped));
        return response.data;
      }
      return [];
    } catch (e) {
      console.error("Failed to load retailer orders from backend:", e);
      return [];
    }
  },

  async addRetailerOrder(order: {
    retailerId: number;
    totalAmount: number;
    status?: string;
    orderItems: Array<{
      productId: number;
      quantity: number;
      rate: number;
      amount: number;
    }>;
  }): Promise<any> {
    const response = await apiRequest<{ success: boolean; data: any }>('/retailer-orders', {
      method: 'POST',
      bodyData: order,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to submit order');
    }
    
    // Refresh web_orders locally after adding an order
    try {
      await this.getRetailerOrders();
    } catch (e) {}

    return response.data;
  }
};
