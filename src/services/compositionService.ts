const STORAGE_KEY = "compositions";

export const compositionService = {
  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAll(compositions: any[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(compositions)
    );
  },
};