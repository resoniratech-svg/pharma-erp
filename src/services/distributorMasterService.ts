export interface DistributorMasterRecord {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  mobileNumber: string;
  emailAddress?: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  password?: string;
}

const STORAGE_KEY = 'pharma_erp_distributor_master';

export const distributorMasterService = {
  getAll: (): DistributorMasterRecord[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  getById: (id: string): DistributorMasterRecord | undefined => {
    return distributorMasterService.getAll().find(d => d.id === id);
  },

  generateCode: (): string => {
    const records = distributorMasterService.getAll();
    if (records.length === 0) return 'DSP000001';
    
    let maxNumber = 0;
    for (const r of records) {
      if (r.code && r.code.startsWith('DSP')) {
        const num = parseInt(r.code.substring(3));
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    return `DSP${String(maxNumber + 1).padStart(6, '0')}`;
  },

  create: (record: Omit<DistributorMasterRecord, 'id' | 'code' | 'createdDate'>, password?: string): DistributorMasterRecord => {
    const records = distributorMasterService.getAll();
    
    const newRecord: DistributorMasterRecord = {
      ...record,
      id: Date.now().toString(),
      code: distributorMasterService.generateCode(),
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
      role: 'Distributor',
      status: newRecord.status,
      contactNo: newRecord.mobileNumber,
      email: newRecord.emailAddress || '',
      distributorCode: newRecord.code
    };
    authUsers.push(newAuthUser);
    localStorage.setItem('pharma_erp_users', JSON.stringify(authUsers));
    
    return newRecord;
  },

  update: (id: string, updates: Partial<DistributorMasterRecord>): void => {
    const records = distributorMasterService.getAll();
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
    distributorMasterService.update(id, { status });
  }
};
