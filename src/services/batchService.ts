import { apiRequest } from './apiClient';
import { productService } from './productService';

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

  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

let batchCache: BatchRecord[] = [];

function mapToUi(b: any): BatchRecord {
  const products = productService.getProducts();
  const productCode = b.product ? b.product.code : (b.productCode || "");
  const matchedProduct = products.find(p => p.code === productCode || p.id === String(b.productId));
  const resolvedType = matchedProduct ? matchedProduct.type : (b.product ? b.product.type : b.unit) || "Pack";

  return {
    id: String(b.id),
    productId: String(b.productId),
    productCode: productCode,
    productName: b.product ? b.product.name : (b.productName || ""),
    hsnCode: b.product ? b.product.hsnCode : (b.hsnCode || ""),
    barcode: b.product ? b.product.barcode : (b.barcode || ""),
    unit: resolvedType,
    manufacturer: b.product ? b.product.manufacturer : (b.manufacturer || ""),
    batchNo: b.batchNumber || b.batchNo || "",
    mfgDate: b.manufacturingDate || b.mfgDate || new Date().toISOString(),
    expDate: b.expiryDate || b.expDate || new Date().toISOString(),
    ptr: b.product ? Number(b.product.ptr || 0) : Number(b.ptr || 0),
    mrp: b.product ? Number(b.product.mrp || 0) : Number(b.mrp || 0),
    availableQty: Number(b.quantity || b.availableQty || 0),
    receivedQty: Number(b.receivedQty || b.quantity || 0),
    status: b.status || "Active",
    createdBy: b.createdBy || "System",
    createdDate: b.createdAt || b.createdDate || new Date().toISOString(),
  };
}

// Load initial batches from localStorage on initialization as a fallback
try {
  const data = localStorage.getItem("batchRecords");
  if (data) {
    batchCache = JSON.parse(data);
  }
} catch (err) {
  console.error("Failed to parse cached batches:", err);
}

export const batchService = {
  // Synchronous method for backward compatibility
  getAll(): BatchRecord[] {
    return batchCache;
  },

  // Asynchronous method to load batches from database and refresh cache
  async loadBatches(): Promise<BatchRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/batches');
      if (response.success && Array.isArray(response.data)) {
        batchCache = response.data.map(mapToUi);
        localStorage.setItem("batchRecords", JSON.stringify(batchCache));
      }
    } catch (err) {
      console.error("Failed to fetch batches from backend, using cache:", err);
    }
    return batchCache;
  },

  async addBatch(record: Omit<BatchRecord, 'id'>): Promise<BatchRecord> {
    const products = productService.getProducts();
    const matchedProduct = products.find(p => p.code === record.productCode);
    if (!matchedProduct) {
      throw new Error(`Product ${record.productCode} does not exist`);
    }
    const response = await apiRequest<{ success: boolean; data: any }>('/batches', {
      method: 'POST',
      bodyData: {
        batchNumber: record.batchNo,
        productId: Number(matchedProduct.id),
        manufacturingDate: record.mfgDate,
        expiryDate: record.expDate,
        quantity: Number(record.availableQty),
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create batch');
    }
    const created = mapToUi(response.data);
    batchCache = [created, ...batchCache];
    localStorage.setItem("batchRecords", JSON.stringify(batchCache));
    return created;
  },

  async updateBatch(id: string, record: Partial<BatchRecord>): Promise<BatchRecord> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/batches/${id}`, {
      method: 'PUT',
      bodyData: {
        batchNumber: record.batchNo,
        manufacturingDate: record.mfgDate,
        expiryDate: record.expDate,
        quantity: record.availableQty !== undefined ? Number(record.availableQty) : undefined,
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update batch');
    }
    const updated = mapToUi(response.data);
    batchCache = batchCache.map(b => b.id === id ? updated : b);
    localStorage.setItem("batchRecords", JSON.stringify(batchCache));
    return updated;
  },

  async deleteBatch(id: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/batches/${id}`, {
      method: 'DELETE',
    });
    if (response.success) {
      batchCache = batchCache.filter(b => b.id !== id);
      localStorage.setItem("batchRecords", JSON.stringify(batchCache));
    }
    return response.success;
  },

  saveAll(records: BatchRecord[]) {
    batchCache = records;
    localStorage.setItem("batchRecords", JSON.stringify(records));
  },

  generateNextBatchNumber(): string {
    const records = this.getAll();
    let max = 0;
    records.forEach((r) => {
      if (r.batchNo && r.batchNo.startsWith("BAT-")) {
        const numStr = r.batchNo.substring(4);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > max) {
          max = num;
        }
      }
    });
    return `BAT-${String(max + 1).padStart(6, "0")}`;
  },
};