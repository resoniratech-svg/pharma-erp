import { apiRequest } from './apiClient';
import { batchService } from './batchService';

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

let inventoryCache: InventoryRecord[] = [];

function mapToUi(inv: any): InventoryRecord {
  return {
    id: String(inv.id),
    productCode: inv.batch && inv.batch.product ? inv.batch.product.code : "",
    productName: inv.batch && inv.batch.product ? inv.batch.product.name : "",
    batchNo: inv.batch ? (inv.batch.batchNumber || inv.batch.batchNo || "") : "",
    ptr: inv.batch && inv.batch.product ? Number(inv.batch.product.ptr || 0) : 0,
    warehouseId: String(inv.warehouseId),
    warehouseCode: inv.warehouse ? inv.warehouse.code : "",
    warehouseName: inv.warehouse ? inv.warehouse.name : "",
    availableQty: Number(inv.quantity),
    reservedQty: 0,
    damagedQty: 0,
    blockedQty: 0,
    expiredQty: 0,
    lastUpdated: inv.updatedAt || new Date().toISOString(),
  };
}

// Load initial inventory from localStorage on initialization as a fallback
try {
  const data = localStorage.getItem("inventoryRecords");
  if (data) {
    inventoryCache = JSON.parse(data);
  }
} catch (err) {
  console.error("Failed to parse cached inventory:", err);
}

export const inventoryService = {
  // Synchronous method for backward compatibility
  getAll(): InventoryRecord[] {
    return inventoryCache;
  },

  // Asynchronous method to load inventory from database and refresh cache
  async loadInventory(): Promise<InventoryRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/inventory');
      if (response.success && Array.isArray(response.data)) {
        inventoryCache = response.data.map(mapToUi);
        localStorage.setItem("inventoryRecords", JSON.stringify(inventoryCache));
      }
    } catch (err) {
      console.error("Failed to fetch inventory from backend, using cache:", err);
    }
    return inventoryCache;
  },

  async addRecord(record: InventoryRecord): Promise<InventoryRecord> {
    const batches = batchService.getAll();
    const matchedBatch = batches.find(b => b.batchNo === record.batchNo && b.productCode === record.productCode);
    if (!matchedBatch) {
      throw new Error(`Batch ${record.batchNo} for product ${record.productCode} does not exist`);
    }
    
    const response = await apiRequest<{ success: boolean; data: any }>('/inventory', {
      method: 'POST',
      bodyData: {
        batchId: Number(matchedBatch.id),
        warehouseId: Number(record.warehouseId),
        quantity: Number(record.availableQty),
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create inventory record');
    }
    const created = mapToUi(response.data);
    inventoryCache = [created, ...inventoryCache];
    localStorage.setItem("inventoryRecords", JSON.stringify(inventoryCache));
    return created;
  },

  async updateRecord(id: string, updatedRecord: InventoryRecord): Promise<InventoryRecord> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/inventory/${id}`, {
      method: 'PUT',
      bodyData: {
        quantity: Number(updatedRecord.availableQty),
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update inventory record');
    }
    const updated = mapToUi(response.data);
    inventoryCache = inventoryCache.map(i => i.id === id ? updated : i);
    localStorage.setItem("inventoryRecords", JSON.stringify(inventoryCache));
    return updated;
  },

  async deleteRecord(id: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/inventory/${id}`, {
      method: 'DELETE',
    });
    if (response.success) {
      inventoryCache = inventoryCache.filter(i => i.id !== id);
      localStorage.setItem("inventoryRecords", JSON.stringify(inventoryCache));
    }
    return response.success;
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

  async updateAvailableQty(batchNo: string, warehouseId: string, qty: number): Promise<void> {
    const matched = this.getByBatchAndWarehouse(batchNo, warehouseId);
    if (matched) {
      const updatedRecord = { ...matched, availableQty: qty };
      await this.updateRecord(matched.id, updatedRecord);
    }
  },

  saveAll(records: InventoryRecord[]) {
    inventoryCache = records;
    localStorage.setItem("inventoryRecords", JSON.stringify(records));
  }
};