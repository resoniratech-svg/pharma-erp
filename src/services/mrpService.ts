const STORAGE_KEY =  "mrpManagement";

export const mrpService = {
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