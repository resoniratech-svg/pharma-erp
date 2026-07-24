import { apiRequest } from './apiClient';

export interface ExportOrderRecord {
  id: string;
  exportOrderNo: string;
  customerName: string;
  destinationCountry: string;
  invoiceNo: string;
  shipmentNo: string;
  orderValue: string;
  orderValueNumber: number;
  dispatchDate: string;
  expectedDelivery: string;
  customsStatus: string;
  status: 'Processing' | 'Customs' | 'Shipped' | 'Delivered' | 'Cancelled';
}

const STORAGE_KEY = 'pharma_erp_export_orders';

const initialSeed: ExportOrderRecord[] = [
  { id: '1', exportOrderNo: 'EXP-2026-001', customerName: 'MediGlobal Healthcare', destinationCountry: 'United States', invoiceNo: 'INV/EXP/26/01', shipmentNo: 'AWB-883921', orderValue: '$ 45,000', orderValueNumber: 45000, dispatchDate: '2026-10-28', expectedDelivery: '2026-11-05', customsStatus: 'Cleared', status: 'Shipped' },
  { id: '2', exportOrderNo: 'EXP-2026-002', customerName: 'NHS Supplies UK', destinationCountry: 'United Kingdom', invoiceNo: 'INV/EXP/26/02', shipmentNo: 'AWB-883922', orderValue: '£ 32,500', orderValueNumber: 32500, dispatchDate: '2026-10-30', expectedDelivery: '2026-11-10', customsStatus: 'Pending', status: 'Customs' },
  { id: '3', exportOrderNo: 'EXP-2026-003', customerName: 'Gulf Pharma LLC', destinationCountry: 'UAE', invoiceNo: 'INV/EXP/26/03', shipmentNo: 'TBD', orderValue: '$ 18,200', orderValueNumber: 18200, dispatchDate: '2026-11-15', expectedDelivery: '2026-11-20', customsStatus: 'Not Initiated', status: 'Processing' },
  { id: '4', exportOrderNo: 'EXP-2026-004', customerName: 'SingHealth Pharmacy', destinationCountry: 'Singapore', invoiceNo: 'INV/EXP/26/04', shipmentNo: 'AWB-883910', orderValue: '$ 22,000', orderValueNumber: 22000, dispatchDate: '2026-10-15', expectedDelivery: '2026-10-22', customsStatus: 'Cleared', status: 'Delivered' },
  { id: '5', exportOrderNo: 'EXP-2026-005', customerName: 'EuroMed Germany', destinationCountry: 'Germany', invoiceNo: 'INV/EXP/26/05', shipmentNo: 'N/A', orderValue: '€ 15,000', orderValueNumber: 15000, dispatchDate: '', expectedDelivery: '', customsStatus: 'Rejected', status: 'Cancelled' },
];

let cache: ExportOrderRecord[] = [];

try {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    cache = JSON.parse(data);
  } else {
    cache = initialSeed;
  }
} catch (e) {
  cache = initialSeed;
}

export const exportOrderService = {
  getAll(): ExportOrderRecord[] {
    return cache;
  },

  async loadOrders(): Promise<ExportOrderRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/export-orders');
      if (response && response.success && Array.isArray(response.data)) {
        cache = response.data.map((o: any) => ({
          ...o,
          id: String(o.id)
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      }
    } catch (e) {
      console.warn("Failed to fetch export orders from API, using cache/mock", e);
    }
    return cache;
  },

  addOrder(order: Omit<ExportOrderRecord, 'id'>): ExportOrderRecord {
    const newOrder = {
      ...order,
      id: Date.now().toString()
    };
    cache = [newOrder, ...cache];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    return newOrder;
  },

  updateOrder(id: string, updates: Partial<ExportOrderRecord>): ExportOrderRecord | null {
    const idx = cache.findIndex(o => o.id === id);
    if (idx !== -1) {
      cache[idx] = { ...cache[idx], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      return cache[idx];
    }
    return null;
  }
};
