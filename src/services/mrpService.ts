export interface MRPRecord {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  productType?: string;
  manufacturer?: string;
  previousMrp?: number;
  currentMrp: number;
  effectiveFrom: string;
  revisionReason?: string;
  remarks?: string;
  status: 'Active' | 'Scheduled' | 'Expired' | 'Draft' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

const STORAGE_KEY = 'pharma_erp_mrp_records';

export const mrpService = {
  getAll(): MRPRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAll(records: MRPRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  },

  getMRPHistory(productCode: string): MRPRecord[] {
    const all = this.getAll();
    return all
      .filter((item: MRPRecord) => item.productCode === productCode)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  },

  getCurrentMRP(productCode: string): MRPRecord | undefined {
    const history = this.getMRPHistory(productCode);
    return history.find(item => item.status === 'Active');
  },

  hasActiveMRP(productCode: string): boolean {
    return !!this.getCurrentMRP(productCode);
  },

  validateDuplicateVersion(productCode: string, effectiveFrom: string, excludeId?: string): boolean {
    const all = this.getAll();
    return all.some(item => 
      item.productCode === productCode && 
      item.effectiveFrom === effectiveFrom && 
      item.id !== excludeId &&
      item.status !== 'Cancelled' && 
      item.status !== 'Draft'
    );
  },

  expirePreviousActiveMRP(records: MRPRecord[], productCode: string, excludeId: string): MRPRecord[] {
    return records.map(item => {
      if (item.productCode === productCode && item.status === 'Active' && item.id !== excludeId) {
        return { ...item, status: 'Expired', updatedAt: new Date().toISOString() };
      }
      return item;
    });
  },

  activateScheduledMRPs(records: MRPRecord[]): MRPRecord[] {
    const todayStr = new Date().toISOString().split('T')[0];
    let changed = false;
    
    let updatedData = records.map(item => {
      if (item.status === 'Scheduled' && item.effectiveFrom <= todayStr) {
        changed = true;
        return { ...item, status: 'Active' as const, updatedAt: new Date().toISOString() };
      }
      return item;
    });

    if (changed) {
      const productsWithActive = Array.from(new Set(updatedData.filter(i => i.status === 'Active').map(i => i.productCode)));
      productsWithActive.forEach(code => {
        const activeItems = updatedData.filter(i => i.productCode === code && i.status === 'Active');
        if (activeItems.length > 1) {
          activeItems.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
          const latestActiveId = activeItems[0].id;
          updatedData = updatedData.map(item => {
            if (item.productCode === code && item.status === 'Active' && item.id !== latestActiveId) {
              return { ...item, status: 'Expired', updatedAt: new Date().toISOString() };
            }
            return item;
          });
        }
      });
    }

    return updatedData;
  },

  createInitialMRP(mrpData: Omit<MRPRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>): MRPRecord {
    const todayStr = new Date().toISOString().split('T')[0];
    const status = mrpData.effectiveFrom > todayStr ? 'Scheduled' : 'Active';
    
    return {
      ...mrpData,
      id: Date.now().toString(),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  createMRPVersion(mrpData: Omit<MRPRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>): MRPRecord {
    const todayStr = new Date().toISOString().split('T')[0];
    const status = mrpData.effectiveFrom > todayStr ? 'Scheduled' : 'Active';

    return {
      ...mrpData,
      id: Date.now().toString(),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};