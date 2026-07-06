// src/services/barcodeService.ts
export interface BarcodeRecord {
  id: string;
  barcode: string;
  productCode: string;
  productName: string;
  type: string;
  assignedDate: string;
  generatedBy?: string;
  generatedDate?: string;
  status: 'Active' | 'Inactive' | 'Unassigned';
  remarks?: string;
}

const STORAGE_KEY = "barcodes";

export const barcodeService = {
  getAll(): BarcodeRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAll(barcodes: BarcodeRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(barcodes));
  },

  getBarcodeByProduct(productCode: string): BarcodeRecord | undefined {
    const barcodes = this.getAll();
    return barcodes.find(b => b.productCode === productCode && b.status === 'Active');
  },

  getBarcodeByValue(barcode: string): BarcodeRecord | undefined {
    const barcodes = this.getAll();
    return barcodes.find(b => b.barcode === barcode);
  },

  createBarcode(barcodeData: Omit<BarcodeRecord, "id">): BarcodeRecord {
    const barcodes = this.getAll();
    const newBarcode: BarcodeRecord = {
      ...barcodeData,
      id: Date.now().toString(),
    };
    barcodes.push(newBarcode);
    this.saveAll(barcodes);
    return newBarcode;
  },

  updateBarcode(id: string, updates: Partial<BarcodeRecord>): BarcodeRecord | undefined {
    const barcodes = this.getAll();
    const index = barcodes.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    
    barcodes[index] = { ...barcodes[index], ...updates };
    this.saveAll(barcodes);
    return barcodes[index];
  },

  deleteBarcode(id: string) {
    const barcodes = this.getAll();
    const filtered = barcodes.filter((b) => b.id !== id);
    this.saveAll(filtered);
  },

  barcodeExists(barcode: string): boolean {
    const barcodes = this.getAll();
    return barcodes.some(b => b.barcode.toLowerCase() === barcode.toLowerCase());
  },

  isBarcodeAssigned(productCode: string): boolean {
    const barcodes = this.getAll();
    return barcodes.some(b => b.productCode === productCode && b.status === 'Active');
  }
};