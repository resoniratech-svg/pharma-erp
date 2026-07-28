import { apiRequest } from './apiClient';

export interface DistributorMasterRecord {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  mobileNumber: string;
  emailAddress?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  state?: string;
  password?: string;
}

const STORAGE_KEY = 'pharma_erp_distributor_master';

export const distributorMasterService = {
  getAll(): DistributorMasterRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async fetchFromApi(): Promise<DistributorMasterRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/distributors');
      if (response && response.success && Array.isArray(response.data)) {
        const mapped: DistributorMasterRecord[] = response.data.map(d => ({
          id: String(d.id),
          code: d.code || `DIST-${String(d.id).padStart(3, '0')}`,
          name: d.name,
          contactPerson: d.contactPerson || d.name,
          mobileNumber: d.mobile || d.mobileNumber || '-',
          emailAddress: d.emailAddress || d.email || '',
          password: d.password || d.pass || '',
          state: d.state || '',
          status: d.status === 'Inactive' ? 'Inactive' : 'Active',
          createdDate: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn("Failed to fetch distributors from API, using fallback:", err);
    }
    return this.getAll();
  },

  getById(id: string): DistributorMasterRecord | undefined {
    return this.getAll().find(d => d.id === id);
  },

  generateCode(): string {
    const records = this.getAll();
    if (records.length === 0) return 'DIST-001';
    
    let maxNumber = 0;
    for (const r of records) {
      if (r.code && (r.code.startsWith('DIST-') || r.code.startsWith('DSP'))) {
        const numStr = r.code.replace('DIST-', '').replace('DSP', '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    return `DIST-${String(maxNumber + 1).padStart(3, '0')}`;
  },

  create(record: Omit<DistributorMasterRecord, 'id' | 'code' | 'createdDate'>, password?: string): DistributorMasterRecord {
    const records = this.getAll();
    const generatedCode = this.generateCode();

    const newRecord: DistributorMasterRecord = {
      ...record,
      password: password || record.password || '',
      id: Date.now().toString(),
      code: generatedCode,
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    // Asynchronously send to PostgreSQL database via API
    apiRequest('/distributors', {
      method: 'POST',
      bodyData: {
        code: generatedCode,
        name: record.name,
        contactPerson: record.contactPerson,
        mobileNumber: record.mobileNumber,
        emailAddress: record.emailAddress,
        state: record.state,
        status: record.status
      }
    }).catch(err => {
      console.warn("Backend API sync warning for distributor:", newRecord.name, err.message);
    });

    return newRecord;
  },

  async update(id: string, updates: Partial<DistributorMasterRecord>): Promise<DistributorMasterRecord | null> {
    const records = this.getAll();
    const index = records.findIndex(r => r.id === id || r.code === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      try {
        await apiRequest(`/distributors/${numId}`, {
          method: 'PUT',
          bodyData: updates
        });
      } catch (err: any) {
        console.warn("Backend API sync warning:", err.message);
      }
    }
    return index !== -1 ? records[index] : null;
  },

  updateStatus(id: string, status: 'Active' | 'Inactive'): void {
    this.update(id, { status });
  }
};
