import { apiRequest } from './apiClient';

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

  async loadBarcodes(): Promise<BarcodeRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/products');
      if (response && response.success && Array.isArray(response.data)) {
        const existingBarcodes = this.getAll();
        const inactiveHistory = existingBarcodes.filter(b => b.status === 'Inactive');

        const mappedBarcodes: BarcodeRecord[] = response.data
          .filter((p: any) => (p.code || p.name) && !!p.barcode)
          .map((p: any) => {
            // Try to match with an existing active barcode to preserve its ID and type if it hasn't changed
            const existingActive = existingBarcodes.find(b => b.productCode === (p.code || `PRD-${p.id}`) && b.status === 'Active' && b.barcode === p.barcode);
            
            return {
              id: existingActive ? existingActive.id : String(p.id),
              barcode: p.barcode,
              productCode: p.code || `PRD-${p.id}`,
              productName: p.name || `Product ${p.id}`,
              type: existingActive ? existingActive.type : 'Primary GS1-128',
              assignedDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              status: 'Active' as const
            };
          });

        const combinedBarcodes = [...inactiveHistory, ...mappedBarcodes];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(combinedBarcodes));
        return combinedBarcodes;
      }
    } catch (e) {
      console.error('Failed to load barcodes from backend:', e);
    }
    return this.getAll();
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