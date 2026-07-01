export interface InventoryRecord {
  id: string;

  // Product Information
  productCode: string;
  productName: string;

  // Batch Information
  batchNo: string;
  ptr: number;

  // Warehouse Information

  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;

  // Stock Information
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  blockedQty: number;
  expiredQty: number;

  // Audit
  lastUpdated: string;
}

const STORAGE_KEY = "inventoryRecords";

export const inventoryService = {
  getAll(): InventoryRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data) as InventoryRecord[];
    } catch {
      return [];
    }
  },

  saveAll(records: InventoryRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  },

  addRecord(record: InventoryRecord) {
    const records = this.getAll();

    records.unshift(record);

    this.saveAll(records);
  },

  updateRecord(id: string, updatedRecord: InventoryRecord) {
    const records = this.getAll();

    const updated = records.map((record) =>
      record.id === id ? updatedRecord : record,
    );

    this.saveAll(updated);
  },

  deleteRecord(id: string) {
    const records = this.getAll();

    const filtered = records.filter((record) => record.id !== id);

    this.saveAll(filtered);
  },

  getByBatch(batchNo: string) {
    return this.getAll().filter((record) => record.batchNo === batchNo);
  },

  getByWarehouse(warehouseId: string) {
    return this.getAll().filter((record) => record.warehouseId === warehouseId);
  },

  getByBatchAndWarehouse(batchNo: string, warehouseId: string) {
    return this.getAll().find(
      (record) =>
        record.batchNo === batchNo && record.warehouseId === warehouseId,
    );
  },
  getByProduct(productCode: string) {
    return this.getAll().filter((record) => record.productCode === productCode);
  },

  updateAvailableQty(batchNo: string, warehouseId: string, qty: number) {
    const records = this.getAll();

    const updated = records.map((record) => {
      if (record.batchNo === batchNo && record.warehouseId === warehouseId) {
        return {
          ...record,
          availableQty: qty,
          lastUpdated: new Date().toISOString(),
        };
      }

      return record;
    });

    this.saveAll(updated);
  },
};