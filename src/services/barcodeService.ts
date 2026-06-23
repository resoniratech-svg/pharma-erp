const STORAGE_KEY = "barcodes";

export const barcodeService = {
  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAll(barcodes: any[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(barcodes)
    );
  },
};