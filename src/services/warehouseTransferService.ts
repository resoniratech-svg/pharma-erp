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
  }
};