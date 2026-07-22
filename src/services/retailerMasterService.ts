import { apiRequest } from './apiClient';

export interface AssignedDistributor {
  code: string;
  name: string;
}

export interface RetailerMasterRecord {
  id: string;
  code: string;
  name: string;
  assignedDistributors: AssignedDistributor[];
  contactPerson: string;
  mobileNumber: string;
  emailAddress?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

const STORAGE_KEY = 'pharma_erp_retailer_master';

export const retailerMasterService = {
  getAll: (): RetailerMasterRecord[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async fetchFromApi(): Promise<RetailerMasterRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/retailers');
      if (response && response.success && Array.isArray(response.data)) {
        const mapped: RetailerMasterRecord[] = response.data.map(r => ({
          id: String(r.id),
          code: r.code || `RET${String(r.id).padStart(6, '0')}`,
          name: r.name,
          contactPerson: r.contactPerson || r.name,
          mobileNumber: r.mobile || r.mobileNumber || '-',
          emailAddress: r.email || r.emailAddress || '',
          assignedDistributors: r.assignedDistributors || [],
          status: r.status === 'Inactive' ? 'Inactive' : 'Active',
          createdDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn("Failed to fetch retailers from API, using fallback:", err);
    }
    return this.getAll();
  },
  
  getById: (id: string): RetailerMasterRecord | undefined => {
    return retailerMasterService.getAll().find(r => r.id === id);
  },

  generateCode: (): string => {
    const records = retailerMasterService.getAll();
    if (records.length === 0) return 'RET000001';
    
    let maxNumber = 0;
    for (const r of records) {
      if (r.code && r.code.startsWith('RET')) {
        const num = parseInt(r.code.substring(3));
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    return `RET${String(maxNumber + 1).padStart(6, '0')}`;
  },

  create: (record: Omit<RetailerMasterRecord, 'id' | 'code' | 'createdDate'>, password?: string): RetailerMasterRecord => {
    const records = retailerMasterService.getAll();
    
    const newRecord: RetailerMasterRecord = {
      ...record,
      id: Date.now().toString(),
      code: retailerMasterService.generateCode(),
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    // Add to auth users
    const authUsers = JSON.parse(localStorage.getItem('pharma_erp_users') || '[]');
    const newAuthUser = {
      id: newRecord.id,
      fullName: newRecord.name,
      username: newRecord.code,
      password: password || '123456',
      role: 'Retailer',
      status: newRecord.status,
      contactNo: newRecord.mobileNumber,
      email: newRecord.emailAddress || '',
      distributorCode: newRecord.assignedDistributors && newRecord.assignedDistributors.length > 0 ? newRecord.assignedDistributors[0].code : ''
    };
    authUsers.push(newAuthUser);
    localStorage.setItem('pharma_erp_users', JSON.stringify(authUsers));
    
    return newRecord;
  },

  update: (id: string, updates: Partial<RetailerMasterRecord>): void => {
    const records = retailerMasterService.getAll();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      
      // Update auth user
      const authUsers = JSON.parse(localStorage.getItem('pharma_erp_users') || '[]');
      const authIndex = authUsers.findIndex((u: any) => u.id === id);
      if (authIndex !== -1) {
        if (updates.name) authUsers[authIndex].fullName = updates.name;
        if (updates.status) authUsers[authIndex].status = updates.status;
        localStorage.setItem('pharma_erp_users', JSON.stringify(authUsers));
      }
    }
  },

  updateStatus: (id: string, status: 'Active' | 'Inactive'): void => {
    retailerMasterService.update(id, { status });
  }
};
