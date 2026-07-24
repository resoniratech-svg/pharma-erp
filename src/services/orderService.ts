import { apiRequest } from './apiClient';

const STORAGE_KEY = 'pharma_erp_orders';

const initialOrdersSeed: any[] = [
  {
    id: '1', orderNo: 'ORD-2026-1001', distributorName: 'Metro Pharma Distributors', distributorCode: 'DIST-001',
    date: '15-10-2026', expectedDeliveryDate: '18-10-2026', status: 'Pending',
    deliveryLocation: 'Mumbai Central', warehouse: 'West Zone Hub', remarks: 'Urgent delivery required',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', packType: '10x10 Tablets', ptr: 110, quantity: 50, scheme: '10+1 Free', amount: 5500 },
      { productCode: 'PRD-003', productName: 'Vitamin C 1000mg', packType: '20 Tablets Tube', ptr: 180, quantity: 20, scheme: '5% Off', amount: 3600 }
    ]
  },
  {
    id: '2', orderNo: 'ORD-2026-1002', distributorName: 'Metro Pharma Distributors', distributorCode: 'DIST-001',
    date: '16-10-2026', expectedDeliveryDate: '19-10-2026', status: 'Draft',
    deliveryLocation: 'Mumbai Central', warehouse: 'West Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-002', productName: 'Paracetamol 650mg', packType: '15x10 Tablets', ptr: 45, quantity: 100, scheme: 'No Scheme', amount: 4500 }
    ]
  },
  {
    id: '3', orderNo: 'ORD-2026-1003', distributorName: 'Global Health Supply', distributorCode: 'DIST-002',
    date: '10-10-2026', expectedDeliveryDate: '14-10-2026', status: 'Approved',
    deliveryLocation: 'Delhi North', warehouse: 'North Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-005', productName: 'Ibuprofen 400mg', packType: '10x10 Tablets', ptr: 75, quantity: 200, scheme: 'No Scheme', amount: 15000 }
    ]
  },
  {
    id: '4', orderNo: 'ORD-2026-1004', distributorName: 'Carewell Agencies', distributorCode: 'DIST-003',
    date: '05-10-2026', expectedDeliveryDate: '08-10-2026', status: 'Fulfilled',
    deliveryLocation: 'Bangalore South', warehouse: 'South Zone Hub', remarks: '',
    items: [
      { productCode: 'PRD-001', productName: 'Amoxicillin 500mg', packType: '10x10 Tablets', ptr: 110, quantity: 100, scheme: '10+1 Free', amount: 11000 }
    ]
  }
];

export const orderService = {
  getAll: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initialOrdersSeed;
  },

  async loadOrders(): Promise<any[]> {
    let apiOrders: any[] = [];
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/retailer-orders');
      if (response && response.success && Array.isArray(response.data)) {
        apiOrders = response.data.map((o: any) => ({
          id: String(o.id),
          orderNo: o.orderNumber || o.orderNo || `ORD-${o.id}`,
          distributor: o.retailer ? o.retailer.name : (o.distributorName || 'Distributor'),
          distributorName: o.retailer ? o.retailer.name : (o.distributorName || 'Distributor'),
          distributorCode: o.retailer ? o.retailer.code : (o.distributorCode || ''),
          date: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          expectedDeliveryDate: o.expectedDeliveryDate || new Date().toISOString().split('T')[0],
          totalAmount: Number(o.totalAmount || 0),
          status: o.status === 'PENDING' ? 'Pending' : o.status === 'APPROVED' ? 'Approved' : (o.status || 'Pending'),
          items: (o.orderItems || o.items || []).map((i: any) => ({
            productId: i.productId,
            productCode: i.product?.code || i.productCode || `PRD-${i.productId}`,
            productName: i.product?.name || i.productName || 'Unknown Product',
            packType: i.product?.packType || i.packType || '-',
            ptr: Number(i.rate || i.ptr || 0),
            quantity: Number(i.quantity || 0),
            amount: Number(i.amount || 0),
            scheme: i.scheme || 'No Scheme'
          }))
        }));
      }
    } catch (e) {
      console.error('Failed to load orders from backend:', e);
    }

    const localStored = localStorage.getItem(STORAGE_KEY);
    const localOrders: any[] = localStored ? JSON.parse(localStored) : [];

    const mergedOrders = [...apiOrders];
    localOrders.forEach(lo => {
      if (!mergedOrders.some(mo => mo.orderNo === lo.orderNo || mo.id === lo.id)) {
        mergedOrders.unshift(lo);
      }
    });

    const finalOrders = mergedOrders.length > 0 ? mergedOrders : initialOrdersSeed;
    finalOrders.sort((a: any, b: any) => {
      const idA = parseInt(String(a.id).replace(/\D/g, '') || '0', 10);
      const idB = parseInt(String(b.id).replace(/\D/g, '') || '0', 10);
      return idB - idA;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOrders));
    return finalOrders;
  },

  getById: (id: string) => {
    return orderService.getAll().find((o: any) => o.id === id);
  },

  getByDistributor: (distributor: string) => {
    return orderService.getAll().filter((o: any) => 
      o.distributorName === distributor || 
      o.distributor === distributor || 
      o.distributorCode === distributor
    );
  },

  getByStatus: (status: string) => {
    return orderService.getAll().filter((o: any) => o.status === status);
  },

  async createOrder(order: any): Promise<any> {
    const orders = orderService.getAll();
    const existingIndex = orders.findIndex((o: any) => o.orderNo === order.orderNo || o.id === order.id);
    if (existingIndex !== -1) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));

    try {
      const formattedItems = (order.items || []).map((i: any) => ({
        productId: i.productId ? Number(i.productId) : 1,
        quantity: Number(i.quantity || 1),
        rate: Number(i.ptr || i.rate || 100),
        amount: Number(i.amount || (i.quantity || 1) * (i.ptr || i.rate || 100))
      }));

      const totalAmount = (order.items || []).reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

      const response = await apiRequest<{ success: boolean; data: any }>('/retailer-orders', {
        method: 'POST',
        bodyData: {
          totalAmount: totalAmount,
          orderItems: formattedItems
        }
      });

      if (response && response.success && response.data) {
        order.id = String(response.data.id);
        if (response.data.orderNumber) {
          order.orderNo = response.data.orderNumber;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      }
    } catch (e) {
      console.warn("Backend order creation warning:", e);
    }

    return order;
  },

  updateOrder: (id: string, updatedOrder: any) => {
    const orders = orderService.getAll();
    const index = orders.findIndex((o: any) => o.id === id || o.orderNo === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updatedOrder };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  },

  updateOrderStatus: (id: string, status: string) => {
    orderService.updateOrder(id, { status });
  },

  async deleteOrder(id: string): Promise<void> {
    let orders = orderService.getAll();
    orders = orders.filter((o: any) => o.id !== id && o.orderNo !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));

    const numericId = String(id).replace(/\D/g, '');
    if (numericId) {
      try {
        await apiRequest(`/retailer-orders/${numericId}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn("Backend API DELETE order warning:", e);
      }
    }
  },

  deleteDraftOrder: (id: string) => {
    orderService.deleteOrder(id);
  },

  getPendingOrders: () => orderService.getByStatus('Submitted'),
  getApprovedOrders: () => orderService.getByStatus('Approved'),
  getRejectedOrders: () => orderService.getByStatus('Rejected'),
  getFulfilledOrders: () => orderService.getByStatus('Fulfilled')
};
