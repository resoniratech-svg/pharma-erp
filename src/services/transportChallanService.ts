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
  dispatchType?: string;
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
  dispatchType: string;
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

const mockChallans: Challan[] = [
  {
    id: 'CHL-1001',
    challanNo: 'CHL-2026-1001',
    challanDate: '2026-07-20',
    dispatchNo: 'DSP-2026-0881',
    dispatchDate: '2026-07-20',
    dispatchType: 'Outward Stock',
    orderNo: 'ORD-9921',
    customer: 'Apollo Pharmacy Ltd - Mumbai Central Branch',
    sourceWarehouse: 'Bhiwandi Central Warehouse',
    transporter: 'VRL Logistics',
    vehicleNo: 'MH-04-JK-9912',
    driverName: 'Ramesh Kumar',
    driverMobile: '+91 98230 11223',
    totalItems: 3,
    totalQty: 1200,
    status: 'In Transit',
    products: [
      { productName: 'Paracetamol 500mg Tablets', batchNo: 'PCM-2026-01', dispatchQty: 500 },
      { productName: 'Amoxicillin 250mg Capsules', batchNo: 'AMX-2026-04', dispatchQty: 300 },
      { productName: 'Azithromycin 500mg Tablets', batchNo: 'AZT-2026-02', dispatchQty: 400 }
    ],
    createdBy: 'System Administrator',
    createdDate: '2026-07-20',
    podStatus: 'Pending Upload'
  },
  {
    id: 'CHL-1002',
    challanNo: 'CHL-2026-1002',
    challanDate: '2026-07-18',
    dispatchNo: 'DSP-2026-0875',
    dispatchDate: '2026-07-18',
    dispatchType: 'Warehouse Transfer',
    orderNo: 'TRF-4412',
    customer: 'MedPlus Pharma - Hyderabad Hub',
    sourceWarehouse: 'Hyderabad Regional Depot',
    transporter: 'SafeXpress Logistics',
    vehicleNo: 'TS-09-UB-4421',
    driverName: 'Srinivas Rao',
    driverMobile: '+91 98490 88712',
    totalItems: 2,
    totalQty: 850,
    status: 'Delivered',
    products: [
      { productName: 'Cetirizine 10mg Syrup', batchNo: 'CTR-2026-09', dispatchQty: 450 },
      { productName: 'Pantoprazole 40mg Injection', batchNo: 'PNT-2026-03', dispatchQty: 400 }
    ],
    createdBy: 'Warehouse Manager',
    createdDate: '2026-07-18',
    podStatus: 'Verified',
    actualDeliveryDate: '2026-07-19'
  },
  {
    id: 'CHL-1003',
    challanNo: 'CHL-2026-1003',
    challanDate: '2026-07-21',
    dispatchNo: 'DSP-2026-0890',
    dispatchDate: '2026-07-21',
    dispatchType: 'Outward Stock',
    orderNo: 'ORD-9945',
    customer: 'SunLife Pharmaceuticals Distributor',
    sourceWarehouse: 'Ahmedabad Warehouse',
    transporter: 'TCI Freight',
    vehicleNo: 'GJ-01-XX-7812',
    driverName: 'Patel Jignesh',
    driverMobile: '+91 99099 22341',
    totalItems: 2,
    totalQty: 600,
    status: 'Generated',
    products: [
      { productName: 'Metformin 500mg SR Tablets', batchNo: 'MTF-2026-01', dispatchQty: 300 },
      { productName: 'Atorvastatin 10mg Tablets', batchNo: 'ATV-2026-11', dispatchQty: 300 }
    ],
    createdBy: 'System Administrator',
    createdDate: '2026-07-21',
    podStatus: 'Pending Upload'
  }
];

const mockDispatches: any[] = [
  {
    id: 'DSP-2026-0881',
    dispatchId: 'DSP-2026-0881',
    date: '2026-07-20',
    dispatchType: 'Outward Stock',
    orderId: 'ORD-9921',
    client: 'Apollo Pharmacy Ltd - Mumbai Central Branch',
    sourceWarehouse: 'Bhiwandi Central Warehouse',
    totalItems: 3,
    totalQuantity: 1200,
    status: 'In Transit',
    transporter: 'VRL Logistics',
    lrNumber: 'LR-2026-1001',
    vehicleNumber: 'MH-04-JK-9912',
    driverName: 'Ramesh Kumar',
    driverMobile: '+91 98230 11223',
    remarks: 'Express Cold-Chain Dispatch',
    createdBy: 'System Administrator',
    createdDate: '2026-07-20',
    products: [
      { productName: 'Paracetamol 500mg Tablets', batchNo: 'PCM-2026-01', dispatchQty: 500 },
      { productName: 'Amoxicillin 250mg Capsules', batchNo: 'AMX-2026-04', dispatchQty: 300 },
      { productName: 'Azithromycin 500mg Tablets', batchNo: 'AZT-2026-02', dispatchQty: 400 }
    ]
  },
  {
    id: 'DSP-2026-0875',
    dispatchId: 'DSP-2026-0875',
    date: '2026-07-18',
    dispatchType: 'Warehouse Transfer',
    orderId: 'TRF-4412',
    client: 'MedPlus Pharma - Hyderabad Hub',
    sourceWarehouse: 'Hyderabad Regional Depot',
    totalItems: 2,
    totalQuantity: 850,
    status: 'Delivered',
    transporter: 'SafeXpress Logistics',
    lrNumber: 'LR-2026-1002',
    vehicleNumber: 'TS-09-UB-4421',
    driverName: 'Srinivas Rao',
    driverMobile: '+91 98490 88712',
    remarks: 'Inter-depot transfer',
    createdBy: 'Warehouse Manager',
    createdDate: '2026-07-18',
    products: [
      { productName: 'Cetirizine 10mg Syrup', batchNo: 'CTR-2026-09', dispatchQty: 450 },
      { productName: 'Pantoprazole 40mg Injection', batchNo: 'PNT-2026-03', dispatchQty: 400 }
    ]
  },
  {
    id: 'DSP-2026-0890',
    dispatchId: 'DSP-2026-0890',
    date: '2026-07-21',
    dispatchType: 'Outward Stock',
    orderId: 'ORD-9945',
    client: 'SunLife Pharmaceuticals Distributor',
    sourceWarehouse: 'Ahmedabad Warehouse',
    totalItems: 2,
    totalQuantity: 600,
    status: 'Ready to Ship',
    transporter: 'TCI Freight',
    lrNumber: 'LR-2026-1003',
    vehicleNumber: 'GJ-01-XX-7812',
    driverName: 'Patel Jignesh',
    driverMobile: '+91 99099 22341',
    remarks: 'Packed and ready for pickup',
    createdBy: 'System Administrator',
    createdDate: '2026-07-21',
    products: [
      { productName: 'Metformin 500mg SR Tablets', batchNo: 'MTF-2026-01', dispatchQty: 300 },
      { productName: 'Atorvastatin 10mg Tablets', batchNo: 'ATV-2026-11', dispatchQty: 300 }
    ]
  }
];

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
      const response = await apiRequest<{ success: boolean; data: any[] }>('/dispatches');
      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        dispatchCache = response.data.map(mapDispatchToUi);
        localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(dispatchCache));
        return dispatchCache;
      }
    } catch (e) {
      console.error('Failed to load dispatches from backend:', e);
    }
    try {
      const stored = localStorage.getItem(DISPATCH_STORAGE_KEY);
      if (stored) {
        dispatchCache = JSON.parse(stored);
      }
    } catch (e) {}

    if (dispatchCache.length === 0) {
      dispatchCache = mockDispatches;
      localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(mockDispatches));
    }
    return dispatchCache;
  },

  async createDispatch(dispatch: any): Promise<any> {
    const newDispatch = {
      ...dispatch,
      id: dispatch.id || Date.now().toString(),
      status: dispatch.status || 'Ready to Ship'
    };
    
    try {
      await apiRequest('/dispatches', {
        method: 'POST',
        bodyData: {
          dispatchNo: newDispatch.dispatchId,
          dispatchType: newDispatch.dispatchType,
          orderId: newDispatch.orderId,
          customerName: newDispatch.client,
          sourceWarehouse: newDispatch.sourceWarehouse,
          totalItems: newDispatch.totalItems,
          totalQuantity: newDispatch.totalQuantity,
          status: newDispatch.status === 'Ready to Ship' ? 'PENDING' : newDispatch.status,
          transporter: newDispatch.transporter,
          lrNumber: newDispatch.lrNumber,
          vehicleNumber: newDispatch.vehicleNumber,
          driverName: newDispatch.driverName,
          driverMobile: newDispatch.driverMobile,
          remarks: newDispatch.remarks,
          createdBy: newDispatch.createdBy,
          createdDate: newDispatch.createdDate,
          products: newDispatch.products
        }
      });
    } catch (e) {
      console.warn("Backend API dispatch save warning:", e);
    }

    await this.loadDispatches();
    dispatchCache = [newDispatch, ...dispatchCache.filter((d: any) => d.dispatchId !== newDispatch.dispatchId)];
    localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(dispatchCache));
    return newDispatch;
  },

  async updateDispatch(id: string, updatedData: any): Promise<any> {
    try {
      await apiRequest(`/dispatches/${id}`, {
        method: 'PATCH',
        bodyData: updatedData
      });
    } catch (e) {
      console.warn("Backend API dispatch update warning:", e);
    }

    await this.loadDispatches();
    const index = dispatchCache.findIndex((d: any) => d.id === id || d.dispatchId === id);
    if (index !== -1) {
      dispatchCache[index] = { ...dispatchCache[index], ...updatedData };
      localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(dispatchCache));
      return dispatchCache[index];
    }
    return null;
  },

  async loadChallans(): Promise<Challan[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/transport-challans');
      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        challanCache = response.data.map(mapChallanToUi);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(challanCache));
        return challanCache;
      }
    } catch (e) {
      console.error('Failed to fetch transport-challans from backend:', e);
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        challanCache = JSON.parse(stored);
      }
    } catch (e) {}

    if (challanCache.length === 0) {
      challanCache = mockChallans;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockChallans));
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
    
    try {
      await apiRequest('/transport-challans', {
        method: 'POST',
        bodyData: {
          challanNo: newChallan.challanNo,
          challanDate: newChallan.challanDate,
          dispatchNo: newChallan.dispatchNo,
          dispatchDate: newChallan.dispatchDate,
          orderNo: newChallan.orderNo,
          customer: newChallan.customer,
          sourceWarehouse: newChallan.sourceWarehouse,
          transporterName: newChallan.transporter,
          vehicleNumber: newChallan.vehicleNo,
          driverName: newChallan.driverName,
          driverMobile: newChallan.driverMobile,
          totalItems: newChallan.totalItems,
          totalQty: newChallan.totalQty,
          status: newChallan.status,
          products: newChallan.products,
          createdBy: newChallan.createdBy,
          createdDate: newChallan.createdDate
        }
      });
    } catch (e) {
      console.warn("Backend API challan save warning:", e);
    }

    await this.loadChallans();
    challanCache = [newChallan, ...challanCache.filter(c => c.id !== newChallan.id)];
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
        challanCache = stored ? JSON.parse(stored) : mockChallans;
      } catch (e) {
        challanCache = mockChallans;
      }
    }
    
    // Retroactively enrich dispatchType from dispatches for older records
    const dispatches = transportChallanService.getAllDispatches();
    return challanCache.map(c => {
      if (!c.dispatchType) {
        const d = dispatches.find(d => d.dispatchId === c.dispatchNo || d.dispatchNo === c.dispatchNo);
        c.dispatchType = d?.dispatchType || (c.orderNo ? 'Customer Order' : 'Warehouse Transfer');
      }
      return c;
    });
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
        dispatchCache = stored ? JSON.parse(stored) : mockDispatches;
      } catch (e) {
        dispatchCache = mockDispatches;
      }
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
        dispatchType: challan.dispatchType || 'Outward Stock',
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
        contactPerson: 'Contact Person',
        mobile: '9876543210',
        deliveryAddress: 'Customer Delivery Address',
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