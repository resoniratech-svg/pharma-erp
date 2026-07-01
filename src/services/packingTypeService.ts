const STORAGE_KEY = "packingTypes";

export const packingTypeService = {
  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAll(items: any[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );
  },
};