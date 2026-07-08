const STORAGE_KEY = 'pharma_erp_orders';

export const orderService = {
  getAll: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
  createOrder: (order: any) => {
    const orders = orderService.getAll();
    orders.push(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  },
  updateOrder: (id: string, updatedOrder: any) => {
    const orders = orderService.getAll();
    const index = orders.findIndex((o: any) => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updatedOrder };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  },
  updateOrderStatus: (id: string, status: string) => {
    orderService.updateOrder(id, { status });
  },
  deleteDraftOrder: (id: string) => {
    let orders = orderService.getAll();
    const index = orders.findIndex((o: any) => o.id === id);
    if (index !== -1 && orders[index].status === 'Draft') {
      orders.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  },
  getPendingOrders: () => orderService.getByStatus('Submitted'),
  getApprovedOrders: () => orderService.getByStatus('Approved'),
  getRejectedOrders: () => orderService.getByStatus('Rejected'),
  getFulfilledOrders: () => orderService.getByStatus('Fulfilled')
};
