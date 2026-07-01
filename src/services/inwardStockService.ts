export interface InwardStockRecord {
  id: string;
  grnNo: string;
  date: string;
  supplier: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: "Draft" | "Pending QC" | "Completed" | "Rejected";
  products: any[];
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

const STORAGE_KEY = "inwardStockRecords";

export const inwardStockService = {
  getAll(): InwardStockRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAll(records: InwardStockRecord[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  },

  add(record: InwardStockRecord) {
    const records = this.getAll();
    records.unshift(record);
    this.saveAll(records);
  },

  update(id: string, record: InwardStockRecord) {
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