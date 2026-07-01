const STORAGE_KEY = "stockLedgerRecords";

export const stockLedgerService = {
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

  deleteRecord(id: string) {
    const records = this.getAll();

    const filtered = records.filter(
      (record) => record.id !== id
    );

    this.saveAll(filtered);
  },
};