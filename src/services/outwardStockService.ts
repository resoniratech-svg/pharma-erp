export interface OutwardStockRecord {
  id: string;

  dispatchNo: string;

  date: string;

  client: string;

  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;

  referenceNumber?: string;

  itemsCount: number;
  totalQuantity: number;
  totalValue: number;

  status: "Draft" | "Processing" | "Dispatched" | "Cancelled";

  products: any[];

  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

const STORAGE_KEY = "outwardStockRecords";

export const outwardStockService = {
 getAll(): OutwardStockRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAll(records: OutwardStockRecord[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  },

  add(record: OutwardStockRecord) {
    const records = this.getAll();
    records.unshift(record);
    this.saveAll(records);
  },

  update(id: string, record: OutwardStockRecord) {
    const records = this.getAll();

    const updated = records.map((r) =>
      r.id === id ? record : r
    );

    this.saveAll(updated);
  },

  delete(id: string) {
    const records = this.getAll();

    this.saveAll(
      records.filter((r) => r.id !== id)
    );
  },
};