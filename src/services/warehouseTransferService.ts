// warehouseTransferService.ts
export interface WarehouseTransfer {
  id: string;

  transferNo: string;

  date: string;

  fromWarehouseId: string;
  fromWarehouseName: string;

  toWarehouseId: string;
  toWarehouseName: string;

  remarks: string;

  products: any[];

  itemsCount: number;
  totalQuantity: number;

  status:
    | "Draft"
    | "In Transit"
    | "Completed"
    | "Cancelled";

  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

export interface TimelineEvent {
  status: string;
  date: string;
  time?: string;
}

export interface TrackingRecord {
  id: string;
  transferNo: string;
  transferDate: string;
  fromWarehouse: string;
  toWarehouse: string;
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  totalItems: number;
  totalQuantity: number;
  currentStatus: 'Pending' | 'Approved' | 'Dispatched' | 'In Transit' | 'Received' | 'Completed' | 'Cancelled';
  timeline: TimelineEvent[];
}

const STORAGE_KEY = "warehouseTransfers";

export const warehouseTransferService = {
  getAll(): WarehouseTransfer[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAll(records: WarehouseTransfer[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  },

  addRecord(record: WarehouseTransfer) {
    const records = this.getAll();

    records.unshift(record);

    this.saveAll(records);
  },

  deleteRecord(id: string) {
    const records = this.getAll();

    this.saveAll(
      records.filter(r => r.id !== id)
    );
  },

  getAllTrackingRecords(): TrackingRecord[] {
    const records = this.getAll();
    
    return records.map(r => {
      let currentStatus: TrackingRecord['currentStatus'] = 'Pending';
      if (r.status === 'Draft') currentStatus = 'Pending';
      if (r.status === 'In Transit') currentStatus = 'In Transit';
      if (r.status === 'Completed') currentStatus = 'Completed';
      if (r.status === 'Cancelled') currentStatus = 'Cancelled';

      const dateStr = r.date || r.createdDate || new Date().toISOString().split('T')[0];
      const timeStr = '10:00 AM';
      
      const timeline: TimelineEvent[] = [
        { status: 'Transfer Created', date: dateStr, time: timeStr }
      ];

      if (currentStatus === 'In Transit' || currentStatus === 'Completed') {
        timeline.push({ status: 'Approved', date: dateStr, time: '11:00 AM' });
        timeline.push({ status: 'Dispatched', date: dateStr, time: '01:00 PM' });
        timeline.push({ status: 'In Transit', date: dateStr, time: '03:00 PM' });
      }

      if (currentStatus === 'Completed') {
        timeline.push({ status: 'Received', date: dateStr, time: '05:00 PM' });
        timeline.push({ status: 'Completed', date: dateStr, time: '06:00 PM' });
      }

      return {
        id: r.id,
        transferNo: r.transferNo,
        transferDate: r.date,
        fromWarehouse: r.fromWarehouseName,
        toWarehouse: r.toWarehouseName,
        vehicleNo: 'Not Assigned',
        driverName: 'Not Assigned',
        driverMobile: 'Not Assigned',
        totalItems: r.itemsCount || (r.products ? r.products.length : 0),
        totalQuantity: r.totalQuantity || 0,
        currentStatus,
        timeline
      };
    });
  }
};