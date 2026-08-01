export interface ExpiryItem {
  id: string;

  batchNo: string;
  productName: string;

  productType: string;

  mfgDate?: string;
  expDate: string;

  qty: number;

  daysLeft: number;

  storageLocation?: string;

  status?: string;
}

const STORAGE_KEY = "expiryTracking";

export const expiryTrackingService = {
  async getAll(): Promise<ExpiryItem[]> {
    try {
      const { apiRequest } = await import('./apiClient');
      const response = await apiRequest<{ success: boolean; data: any[] }>('/alerts/expiring-batches');
      if (response && response.success && Array.isArray(response.data)) {
        const mapped = response.data.map((b: any) => {
          const expDate = new Date(b.expiryDate);
          const today = new Date();
          const diffTime = Math.abs(expDate.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const status = diffDays <= 0 ? 'Expired' : diffDays <= 90 ? 'Critical' : 'Safe';
          
          return {
            id: String(b.id),
            batchNo: b.batchNumber || b.batchNo || '-',
            productName: b.product?.name || 'Unknown Product',
            productType: b.product?.packType || 'General',
            mfgDate: b.manufacturingDate ? b.manufacturingDate.split('T')[0] : '',
            expDate: b.expiryDate ? b.expiryDate.split('T')[0] : '',
            qty: b.currentQuantity || b.qty || 0,
            daysLeft: diffDays,
            storageLocation: b.warehouse?.name || 'Main Warehouse',
            status: status
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn("Failed to fetch expiring batches from backend, using fallback:", e);
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAll(data: ExpiryItem[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  },
};