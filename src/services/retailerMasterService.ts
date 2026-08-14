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
  dlNumber?: string;
  companyPan?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
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
          assignedDistributors: r.stockist ? [{ code: r.stockist.code || 'N/A', name: r.stockist.name }] : (r.assignedDistributors || []),
          status: (r.status === 'Inactive' || r.isActive === false) ? 'Inactive' : 'Active',
          createdDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dlNumber: r.drugLicenseNumber || r.dlNumber || '',
          companyPan: r.companyPan || '',
          bankName: r.bankName || '',
          accountName: r.accountName || '',
          accountNumber: r.accountNumber || '',
          ifscCode: r.ifscCode || ''
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

  create: async (record: Omit<RetailerMasterRecord, 'id' | 'code' | 'createdDate'>, password?: string): Promise<RetailerMasterRecord> => {
    const records = retailerMasterService.getAll();
    
    const newRecord: RetailerMasterRecord = {
      ...record,
      id: Date.now().toString(),
      code: retailerMasterService.generateCode(),
      createdDate: new Date().toISOString().split('T')[0]
    };

    try {
      await apiRequest('/retailers', {
        method: 'POST',
        bodyData: {
          code: newRecord.code,
          name: newRecord.name,
          contactPerson: newRecord.contactPerson,
          mobile: newRecord.mobileNumber,
          email: newRecord.emailAddress,
          assignedDistributors: newRecord.assignedDistributors,
          status: newRecord.status,
          password: password || '123456',
          drugLicenseNumber: newRecord.dlNumber,
          companyPan: newRecord.companyPan,
          bankName: newRecord.bankName,
          accountName: newRecord.accountName,
          accountNumber: newRecord.accountNumber,
          ifscCode: newRecord.ifscCode
        }
      });
    } catch (e) {
      console.warn("Backend API retailer save warning:", e);
    }
    
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

  update: async (id: string, updates: Partial<RetailerMasterRecord>): Promise<void> => {
    try {
      await apiRequest(`/retailers/${id}`, {
        method: 'PUT',
        bodyData: {
          name: updates.name,
          contactPerson: updates.contactPerson,
          mobile: updates.mobileNumber,
          email: updates.emailAddress,
          assignedDistributors: updates.assignedDistributors,
          status: updates.status,
          drugLicenseNumber: updates.dlNumber,
          companyPan: updates.companyPan,
          bankName: updates.bankName,
          accountName: updates.accountName,
          accountNumber: updates.accountNumber,
          ifscCode: updates.ifscCode
        }
      });
    } catch (e) {
      console.warn("Backend API retailer update warning:", e);
    }

    const records = retailerMasterService.getAll();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      
      // Update auth user
      const authUsers = JSON.parse(localStorage.getItem('pharma_erp_users') || '[]');
      const authIndex = authUsers.findIndex((u: any) => String(u.id) === String(id));
      if (authIndex !== -1) {
        if (updates.name) authUsers[authIndex].fullName = updates.name;
        if (updates.status) authUsers[authIndex].status = updates.status;
        localStorage.setItem('pharma_erp_users', JSON.stringify(authUsers));
      }
    }
  },

  updateStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<void> => {
    await retailerMasterService.update(id, { status });
  }
};
