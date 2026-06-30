export interface ChallanProduct {
  productName: string;
  batchNo: string;
  dispatchQty: number;
}

export interface Challan {
  id: string;
  challanNo: string;
  challanDate: string;
  dispatchNo: string;
  dispatchDate: string;
  orderNo?: string;
  customer: string;
  sourceWarehouse: string;
  transporter: string;
  vehicleNo: string;
  driverName?: string;
  driverMobile?: string;
  totalItems: number;
  totalQty: number;
  status: 'Generated' | 'In Transit' | 'Delivered' | 'Cancelled';
  products: ChallanProduct[];
  createdBy: string;
  createdDate: string;
  // POD Extensions
  podStatus?: 'Pending Upload' | 'Uploaded' | 'Verified' | 'Rejected';
  podUploadedBy?: string;
  podUploadedDate?: string;
  podReceivedBy?: string;
  podDesignation?: string;
  podFileUrl?: string;
  podFileName?: string;
  podFileType?: string;
  podRemarks?: string;
  actualDeliveryDate?: string;
}

export interface TimelineEvent {
  date: string;
  time: string;
  status: string;
}

export interface LRRecord {
  id: string;
  lrNumber: string;
  customer: string;
  transporter: string;
  dispatchDate: string;
  status: 'In Transit' | 'Pending' | 'Delivered' | 'Delayed';
  dispatchId: string;
  challanNo: string;
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  deliveryAddress: string;
  currentLocation: string;
  eta: string;
  lastUpdated: string;
  timeline: TimelineEvent[];
}

export interface DeliveryRecord {
  id: string;
  deliveryNo: string;
  customer: string;
  contactPerson: string;
  mobile: string;
  deliveryAddress: string;
  dispatchNo: string;
  lrNumber: string;
  challanNo: string;
  expectedDate: string;
  actualDate: string;
  status: 'In Transit' | 'Out For Delivery' | 'Delivered' | 'Delayed' | 'Returned';
  podStatus: 'Pending Upload' | 'Uploaded' | 'Verified' | 'Rejected';
  transporter: string;
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  delayReason?: string;
  podUploadedBy?: string;
  podUploadedDate?: string;
  podReceivedBy?: string;
  podDesignation?: string;
  podFileUrl?: string;
  podFileName?: string;
  podFileType?: string;
  remarks?: string;
  timeline: TimelineEvent[];
}

const STORAGE_KEY = 'pharma_erp_challans';
const DISPATCH_STORAGE_KEY = 'pharma_erp_dispatches';

export const transportChallanService = {
  getAllChallans: (): Challan[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  getChallanById: (id: string): Challan | undefined => {
    const challans = transportChallanService.getAllChallans();
    return challans.find(c => c.id === id);
  },

  createChallan: (challan: Challan): Challan[] => {
    const challans = transportChallanService.getAllChallans();
    const updated = [challan, ...challans];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  updateChallan: (id: string, updatedData: Partial<Challan>): Challan[] => {
    const challans = transportChallanService.getAllChallans();
    const updated = challans.map(c => c.id === id ? { ...c, ...updatedData } : c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteChallan: (id: string): Challan[] => {
    const challans = transportChallanService.getAllChallans();
    const updated = challans.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  generateNextChallanNumber: (): string => {
    const challans = transportChallanService.getAllChallans();
    return `CHL-${new Date().getFullYear()}-${String(challans.length + 1001)}`;
  },

  getAllDispatches: (): any[] => {
    try {
      const stored = localStorage.getItem(DISPATCH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  getCurrentUser: (): any => {
    try {
      const user = localStorage.getItem('authUser');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  getAllLRRecords: (): LRRecord[] => {
    const challans = transportChallanService.getAllChallans();
    return challans.map(challan => {
      let lrStatus: LRRecord['status'] = 'Pending';
      if (challan.status === 'In Transit') lrStatus = 'In Transit';
      else if (challan.status === 'Delivered') lrStatus = 'Delivered';
      else if (challan.status === 'Cancelled') lrStatus = 'Delayed'; 

      const dateStr = challan.challanDate || new Date().toISOString().split('T')[0];
      const timeStr = '10:00 AM';

      const timeline: TimelineEvent[] = [
        { date: dateStr, time: timeStr, status: 'Dispatch Created' }
      ];

      if (lrStatus === 'In Transit' || lrStatus === 'Delivered' || lrStatus === 'Delayed') {
        timeline.push({ date: dateStr, time: '12:00 PM', status: 'Picked Up' });
        timeline.push({ date: dateStr, time: '02:00 PM', status: 'In Transit' });
      }
      
      if (lrStatus === 'Delivered') {
        timeline.push({ date: dateStr, time: '04:00 PM', status: 'Reached Hub' });
        timeline.push({ date: dateStr, time: '06:00 PM', status: 'Out For Delivery' });
        timeline.push({ date: dateStr, time: '08:00 PM', status: 'Delivered' });
      }

      return {
        id: challan.id,
        lrNumber: challan.challanNo.replace('CHL-', 'LR-'),
        customer: challan.customer,
        transporter: challan.transporter,
        dispatchDate: challan.dispatchDate,
        status: lrStatus,
        dispatchId: challan.dispatchNo,
        challanNo: challan.challanNo,
        vehicleNo: challan.vehicleNo,
        driverName: challan.driverName || '—',
        driverMobile: challan.driverMobile || '—',
        deliveryAddress: 'Customer Delivery Address (From Master)',
        currentLocation: lrStatus === 'Delivered' ? 'Delivered' : lrStatus === 'In Transit' ? 'In Transit' : 'Awaiting Pickup',
        eta: 'ETA updates dynamically',
        lastUpdated: challan.createdDate,
        timeline
      };
    });
  },

  getAllDeliveryRecords: (): DeliveryRecord[] => {
    const challans = transportChallanService.getAllChallans();
    return challans.map(challan => {
      let dStatus: DeliveryRecord['status'] = 'In Transit';
      if (challan.status === 'Generated') dStatus = 'In Transit';
      else if (challan.status === 'In Transit') dStatus = 'In Transit';
      else if (challan.status === 'Delivered') dStatus = 'Delivered';
      else if (challan.status === 'Cancelled') dStatus = 'Returned'; 

      const dateStr = challan.challanDate || new Date().toISOString().split('T')[0];
      const timeStr = '10:00 AM';

      const timeline: TimelineEvent[] = [
        { status: 'Dispatch Created', date: dateStr, time: timeStr }
      ];

      if (dStatus === 'In Transit' || dStatus === 'Delivered') {
        timeline.push({ status: 'Picked Up', date: dateStr, time: '12:00 PM' });
        timeline.push({ status: 'In Transit', date: dateStr, time: '02:00 PM' });
      }
      
      if (dStatus === 'Delivered') {
        timeline.push({ status: 'Out For Delivery', date: dateStr, time: '04:00 PM' });
        timeline.push({ status: 'Delivered', date: challan.actualDeliveryDate || dateStr, time: '06:00 PM' });
      }

      return {
        id: challan.id,
        deliveryNo: challan.challanNo.replace('CHL', 'DEL'),
        customer: challan.customer,
        contactPerson: 'Contact Person', // Defaults
        mobile: '9876543210', // Defaults
        deliveryAddress: 'Customer Delivery Address', // Defaults
        dispatchNo: challan.dispatchNo,
        lrNumber: challan.challanNo.replace('CHL', 'LR'),
        challanNo: challan.challanNo,
        expectedDate: dateStr,
        actualDate: challan.actualDeliveryDate || '—',
        status: dStatus,
        podStatus: challan.podStatus || 'Pending Upload',
        transporter: challan.transporter,
        vehicleNo: challan.vehicleNo,
        driverName: challan.driverName || '—',
        driverMobile: challan.driverMobile || '—',
        podUploadedBy: challan.podUploadedBy,
        podUploadedDate: challan.podUploadedDate,
        podReceivedBy: challan.podReceivedBy,
        podDesignation: challan.podDesignation,
        podFileUrl: challan.podFileUrl,
        podFileName: challan.podFileName,
        podFileType: challan.podFileType,
        remarks: challan.podRemarks,
        timeline
      };
    });
  }
};