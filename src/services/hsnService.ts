export interface HSNCode {
  id: string;
  code: string;
  description: string;
  status: 'Active' | 'Inactive';
  remarks?: string;
  createdOn: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'pharma_erp_hsn_master';

export const hsnService = {
  getAll(): HSNCode[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getActive(): HSNCode[] {
    const all = this.getAll();
    return all.filter((item: HSNCode) => item.status === 'Active');
  },

  getByCode(code: string): HSNCode | undefined {
    const all = this.getAll();
    return all.find((item: HSNCode) => item.code === code);
  },

  saveAll(records: HSNCode[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  },
};
