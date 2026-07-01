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
  getAll(): ExpiryItem[] {
    const data =
      localStorage.getItem(STORAGE_KEY);

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