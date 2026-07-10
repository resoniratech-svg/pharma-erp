import { apiRequest } from './apiClient';

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

interface DbDispatch {
  id: number;
  dispatchNo: string | null;
  dispatchType: string | null;
  orderId: string | null;
  customerName: string | null;
  sourceWarehouse: string | null;
  totalItems: number | null;
  totalQuantity: number | null;
  status: string;
  transporter: string | null;
  lrNumber: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  driverMobile: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdDate: string | null;
  products: any;
}

interface DbChallan {
  id: number;
  dispatchNo: string | null;
  challanNo: string | null;
  challanDate: string | null;
  dispatchDate: string | null;
  orderNo: string | null;
  customer: string | null;
  sourceWarehouse: string | null;
  transporterName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  driverMobile: string | null;
  totalItems: number | null;
  totalQty: number | null;
  status: string | null;
  products: any;
  createdBy: string | null;
  createdDate: string | null;
  podStatus: string | null;
  podUploadedBy: string | null;
  podUploadedDate: string | null;
  podReceivedBy: string | null;
  podDesignation: string | null;
  podFileUrl: string | null;
  podFileName: string | null;
  podFileType: string | null;
  podRemarks: string | null;
  actualDeliveryDate: string | null;
}

function mapDispatchToUi(db: DbDispatch): any {
  return {
    id: String(db.id),
    dispatchId: db.dispatchNo || `DSP-${db.id}`,
    date: db.createdDate || new Date().toISOString().split('T')[0],
    dispatchType: db.dispatchType || 'Outward Stock',
    orderId: db.orderId || '',
    client: db.customerName || '',
    sourceWarehouse: db.sourceWarehouse || '',
    totalItems: db.totalItems || 0,
    totalQuantity: db.totalQuantity || 0,
    status: db.status || 'Ready to Ship',
    products: db.products || [],
    transporter: db.transporter || '',
    lrNumber: db.lrNumber || '',
    vehicleNumber: db.vehicleNumber || '',
    driverName: db.driverName || '',
    driverMobile: db.driverMobile || '',
    remarks: db.remarks || '',
    createdBy: db.createdBy || '',
    createdDate: db.createdDate || ''
  };
}

function mapChallanToUi(db: DbChallan): Challan {
  return {
    id: String(db.id),
    challanNo: db.challanNo || `CHL-${db.id}`,
    challanDate: db.challanDate || '',
    dispatchNo: db.dispatchNo || '',
    dispatchDate: db.dispatchDate || '',
    orderNo: db.orderNo || '',
    customer: db.customer || '',
    sourceWarehouse: db.sourceWarehouse || '',
    transporter: db.transporterName || '',
    vehicleNo: db.vehicleNumber || '',
    driverName: db.driverName || '',
    driverMobile: db.driverMobile || '',
    totalItems: db.totalItems || 0,
    totalQty: db.totalQty || 0,
    status: (db.status || 'Generated') as any,
    products: db.products || [],
    createdBy: db.createdBy || '',
    createdDate: db.createdDate || '',
    podStatus: (db.podStatus || 'Pending Upload') as any,
    podUploadedBy: db.podUploadedBy || '',
    podUploadedDate: db.podUploadedDate || '',
    podReceivedBy: db.podReceivedBy || '',
    podDesignation: db.podDesignation || '',
    podFileUrl: db.podFileUrl || '',
    podFileName: db.podFileName || '',
    podFileType: db.podFileType || '',
    podRemarks: db.podRemarks || '',
    actualDeliveryDate: db.actualDeliveryDate || ''
  };
}

let challanCache: Challan[] = [];
let dispatchCache: any[] = [];

export const transportChallanService = {
  async loadDispatches(): Promise<any[]> {
    try {
      const stored = localStorage.getItem(DISPATCH_STORAGE_KEY);
      if (stored) {
        dispatchCache = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse dispatches from local storage', e);
    }
    return dispatchCache;
  },

  async createDispatch(dispatch: any): Promise<any> {
    const newDispatch = {
      ...dispatch,
      id: dispatch.id || Date.now().toString(),
      status: dispatch.status || 'Ready to Ship'
    };
    
    // Ensure we have the latest cache before updating
    await this.loadDispatches();
    dispatchCache = [newDispatch, ...dispatchCache];
    localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(dispatchCache));
    return newDispatch;
  },

  async loadChallans(): Promise<Challan[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        challanCache = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load challans from local storage', e);
    }
    return challanCache;
  },

  async createChallan(challan: Challan): Promise<Challan> {
    const newChallan = {
      ...challan,
      id: challan.id || Date.now().toString(),
      status: challan.status || 'Generated',
      podStatus: challan.podStatus || 'Pending Upload'
    };
    
    await this.loadChallans();
    challanCache = [newChallan, ...challanCache];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challanCache));
    return newChallan;
  },

  async updateChallan(id: string, updatedData: Partial<Challan>): Promise<Challan> {
    await this.loadChallans();
    const index = challanCache.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Challan not found');
    }
    
    const updated = { ...challanCache[index], ...updatedData };
    challanCache[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challanCache));
    return updated;
  },

  getAllChallans: (): Challan[] => {
    if (challanCache.length === 0) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        challanCache = stored ? JSON.parse(stored) : [];
      } catch (e) {}
    }
    return challanCache;
  },

  getChallanById: (id: string): Challan | undefined => {
    const challans = transportChallanService.getAllChallans();
    return challans.find(c => c.id === id);
  },

  generateNextChallanNumber: (): string => {
    const challans = transportChallanService.getAllChallans();
    return `CHL-${new Date().getFullYear()}-${String(challans.length + 1001)}`;
  },

  getAllDispatches: (): any[] => {
    if (dispatchCache.length === 0) {
      try {
        const stored = localStorage.getItem(DISPATCH_STORAGE_KEY);
        dispatchCache = stored ? JSON.parse(stored) : [];
      } catch (e) {}
    }
    return dispatchCache;
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