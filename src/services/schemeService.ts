// services/schemeService.ts

const STORAGE_KEY = "schemeRecords";

export const schemeService = {
  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAll(records: any[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  },
};