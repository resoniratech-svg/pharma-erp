const STORAGE_KEY = "inventoryRecords";

export const inventoryService = {
  getAll(): any[] {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAll(records: any[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  },

  addRecord(record: any) {
    const records = this.getAll();

    records.unshift(record);

    this.saveAll(records);
  },

  updateRecord(
    id: string,
    updatedRecord: any
  ) {
    const records = this.getAll();

    const updated = records.map((record) =>
      record.id === id
        ? updatedRecord
        : record
    );

    this.saveAll(updated);
  },

  deleteRecord(id: string) {
    const records = this.getAll();

    const filtered = records.filter(
      (record) => record.id !== id
    );

    this.saveAll(filtered);
  },
};