import { orderService } from './orderService';
import { inventoryService } from './inventoryService';
import activityLogService from './activityLogService';

export interface DispatchTrackingRecord {
  id: string;
  dispatchId: string;
  orderId: string;
  distributorId?: string;
  distributorCode?: string;
  distributorName?: string;
  status: 'In Transit' | 'Delivered' | 'Returned' | 'Pending Dispatch' | 'Ready to Ship' | 'Packed' | 'Dispatched';
  currentLocation: string;
  expectedDelivery: string;
  transporter: string;
  driverName?: string;
  driverMobile?: string;
  lrNumber: string;
  vehicleNumber?: string;
  lastUpdated: string;
  updatedBy: string;
  milestones: any[];
}

export const distributorDispatchService = {
  getApprovedOrders() {
    // Only return orders with status 'Approved'
    return orderService.getApprovedOrders();
  },

  processDispatch(dispatchData: any, currentUser: any) {
    const {
      dispatchId,
      date,
      dispatchType,
      orderId,
      client,
      distributorId,
      distributorCode,
      distributorName,
      sourceWarehouse,
      products,
      transporter,
      lrNumber,
      vehicleNumber,
      driverName,
      driverMobile,
      remarks,
      totalItems,
      totalQuantity,
      orderData // The raw order object passed from UI
    } = dispatchData;

    const newDispatch: any = {
      id: Date.now().toString(),
      dispatchId,
      date,
      dispatchType,
      orderId,
      client,
      distributorId,
      distributorCode,
      distributorName,
      dispatchDate: date,
      dispatchStatus: 'Ready to Ship',
      podStatus: 'Pending',
      sourceWarehouse,
      totalItems,
      totalQuantity,
      status: 'Ready to Ship',
      products,
      transporter,
      lrNumber,
      vehicleNumber,
      driverName,
      driverMobile,
      remarks,
      createdBy: currentUser?.fullName || 'System User',
      createdDate: new Date().toISOString().split('T')[0],
      orderGrossAmount: orderData?.items?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
    };

    const dispatches = localStorage.getItem('pharma_erp_dispatches');
    const dispatchList = dispatches ? JSON.parse(dispatches) : [];
    const updatedDispatches = [newDispatch, ...dispatchList];
    localStorage.setItem('pharma_erp_dispatches', JSON.stringify(updatedDispatches));

    // 2. Deduct inventory
    const warehousesStr = localStorage.getItem('pharma_erp_warehouses');
    const warehouses = warehousesStr ? JSON.parse(warehousesStr) : [];
    const wh = warehouses.find((w: any) => w.name === sourceWarehouse);
    
    if (wh) {
      products.forEach((p: any) => {
        inventoryService.updateAvailableQty(p.batchNo, wh.id, -p.dispatchQty);
      });
    }

    // 3. Update Order Status to Dispatched
    if (orderData && orderData.id) {
      orderService.updateOrderStatus(orderData.id, 'Dispatched');
    }

    // 4. Create Dispatch Tracking Record
    const trackingStr = localStorage.getItem('pharma_erp_dispatch_tracking');
    const trackingList = trackingStr ? JSON.parse(trackingStr) : [];
    
    const newTracking: DispatchTrackingRecord = {
      id: Date.now().toString() + '-track',
      dispatchId,
      orderId,
      distributorId,
      distributorCode,
      distributorName,
      status: 'Ready to Ship',
      currentLocation: sourceWarehouse,
      expectedDelivery: orderData?.expectedDeliveryDate || 'TBD',
      transporter,
      driverName,
      driverMobile,
      lrNumber,
      vehicleNumber,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.fullName || 'System User',
      milestones: [
        {
          id: Date.now().toString() + '-m1',
          status: 'Ready to Ship',
          location: sourceWarehouse,
          date: new Date().toISOString(),
          remarks: 'Dispatch created and ready to ship',
          updatedBy: currentUser?.fullName || 'System User'
        }
      ]
    };

    const updatedTracking = [newTracking, ...trackingList];
    localStorage.setItem('pharma_erp_dispatch_tracking', JSON.stringify(updatedTracking));

    // 5. Log Activity
    try {
      activityLogService.addLog({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'System User',
        action: `Created Dispatch ${dispatchId} for Approved Order ${orderId}`,
        module: 'Dispatch Management'
      });
    } catch(e) {}

    return newDispatch;
  }
};
