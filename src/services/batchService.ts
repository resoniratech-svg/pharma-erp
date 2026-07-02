export interface BatchRecord {
  id: string;

  // Product Information
  productId: string;
  productCode: string;
  productName: string;
  hsnCode?: string;
  barcode?: string;
  unit?: string;
  manufacturer?: string;

  // Batch Information
  batchNo: string;
  mfgDate: string;
  expDate: string;

  // Pricing
  ptr: number;
  mrp: number;

  // Stock
  availableQty: number;
  receivedQty?: number;

  // Batch Status
  status: string;
}

const STORAGE_KEY = "batchRecords";

export const batchService = {
  getAll(): BatchRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data) as BatchRecord[];
    } catch {
      return [];
    }
  },

  saveAll(records: BatchRecord[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  },
};