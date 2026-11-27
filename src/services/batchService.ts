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
  gst?: string;
  composition?: string;
  packingType?: string;
  scheme?: string;

  // Batch Information
  batchNo: string;
  mfgDate: string;
  expDate: string;

  // Pricing
  ptr: number;
  mrp: number;
  pts?: number;

  // Stock
  availableQty: number;
  receivedQty?: number;

  // Additional Information
  remarks?: string;

  // Batch Status
  status: string;

  createdBy?: string;
  createdDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedDate?: string;
}

const DEFAULT_BATCHES: BatchRecord[] = [
  {
    id: "1",
    productId: "1",
    productCode: "PRD-001",
    productName: "Amoxicillin 500mg Capsules",
    batchNo: "AMX-2026-01",
    mfgDate: "2026-01-01",
    expDate: "12/28",
    ptr: 85,
    mrp: 120,
    availableQty: 250,
    status: "Active"
  },
  {
    id: "2",
    productId: "2",
    productCode: "PRD-002",
    productName: "Paracetamol 650mg Tablets",
    batchNo: "PAR-2026-02",
    mfgDate: "2026-01-01",
    expDate: "11/28",
    ptr: 22,
    mrp: 35,
    availableQty: 500,
    status: "Active"
  },
  {
    id: "3",
    productId: "3",
    productCode: "PRD-003",
    productName: "Azithromycin 500mg Tablets",
    batchNo: "AZT-2026-03",
    mfgDate: "2026-01-01",
    expDate: "10/28",
    ptr: 98,
    mrp: 135,
    availableQty: 180,
    status: "Active"
  }
];

let batchCache: BatchRecord[] = [...DEFAULT_BATCHES];

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
    gst: matchedProduct ? matchedProduct.gst : (b.product ? b.product.gst : ""),
    composition: matchedProduct ? matchedProduct.composition : (b.product ? b.product.composition : ""),
    packingType: matchedProduct ? matchedProduct.packingType : (b.product ? b.product.packingType : ""),
    scheme: matchedProduct ? matchedProduct.scheme : (b.product ? b.product.scheme : ""),
    batchNo: b.batchNumber || b.batchNo || "",
    mfgDate: b.manufacturingDate || b.mfgDate || new Date().toISOString(),
    expDate: b.expiryDate || b.expDate || new Date().toISOString(),
    ptr: b.product ? Number(b.product.ptr || 0) : Number(b.ptr || 0),
    mrp: b.product ? Number(b.product.mrp || 0) : Number(b.mrp || 0),
    pts: matchedProduct ? Number(matchedProduct.pts || 0) : Number(b.product?.pts || 0),
    availableQty: Number(b.quantity || b.availableQty || 0),
    receivedQty: Number(b.receivedQty || b.quantity || 0),
    remarks: b.remarks || "",
    status: b.status || "Active",
    createdBy: b.createdBy || "System",
    createdDate: b.createdAt || b.createdDate || new Date().toISOString(),
  };
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
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        batchCache = response.data.map(mapToUi);
      } else if (batchCache.length === 0) {
        batchCache = [...DEFAULT_BATCHES];
      }
    } catch (err) {
      console.warn("Failed to fetch batches from backend, using active inventory:", err);
      if (batchCache.length === 0) {
        batchCache = [...DEFAULT_BATCHES];
      }
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
        remarks: record.remarks,
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to create batch');
    }
    const created = mapToUi(response.data);
    batchCache = [created, ...batchCache];
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
        remarks: record.remarks,
      },
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to update batch');
    }
    const updated = mapToUi(response.data);
    batchCache = batchCache.map(b => b.id === id ? updated : b);
    return updated;
  },

  async deleteBatch(id: string): Promise<boolean> {
    const response = await apiRequest<{ success: boolean }>(`/batches/${id}`, {
      method: 'DELETE',
    });
    if (response.success) {
      batchCache = batchCache.filter(b => b.id !== id);
    }
    return response.success;
  },

  saveAll(records: BatchRecord[]) {
    batchCache = records;
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