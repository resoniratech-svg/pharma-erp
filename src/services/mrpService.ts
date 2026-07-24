import { apiRequest } from './apiClient';

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

  async loadMRPs(): Promise<MRPRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/pricing');
      if (response && response.success && Array.isArray(response.data)) {
        let mapped: MRPRecord[] = response.data.map(p => ({
          id: String(p.id),
          productCode: p.product ? p.product.code : (p.productCode || `PRD-${p.productId || p.id}`),
          productName: p.product ? p.product.name : (p.productName || `Product ${p.productId || p.id}`),
          category: p.product && p.product.category ? p.product.category.name : (p.category || 'Pharmaceuticals'),
          currentMrp: Number(p.mrp || p.price || 0),
          previousMrp: Number(p.previousMrp || 0),
          effectiveFrom: p.effectiveFrom ? new Date(p.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: p.status === 'Active' ? 'Active' : (p.status || 'Active'),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          createdBy: p.createdBy || 'System',
          updatedBy: p.updatedBy || 'System'
        }));

        // Try to read existing local storage to preserve previousMrp for records that only have one backend entry
        const existingLocalStr = localStorage.getItem(STORAGE_KEY);
        const existingLocal: MRPRecord[] = existingLocalStr ? JSON.parse(existingLocalStr) : [];

        // Calculate previous MRP based on history
        const groupedByProduct = mapped.reduce((acc, curr) => {
          if (!acc[curr.productCode]) acc[curr.productCode] = [];
          acc[curr.productCode].push(curr);
          return acc;
        }, {} as Record<string, MRPRecord[]>);

        mapped = [];
        for (const code in groupedByProduct) {
          const productRecords = groupedByProduct[code].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          for (let i = 0; i < productRecords.length; i++) {
            if (i > 0 && productRecords[i].previousMrp === 0) {
              productRecords[i].previousMrp = productRecords[i - 1].currentMrp;
            }
            // Try to restore missing fields from localStorage
            const localRecords = existingLocal.filter(l => l.productCode === productRecords[i].productCode);
            if (localRecords.length > 0) {
              localRecords.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
              if (productRecords[i].previousMrp === 0 && localRecords[0].previousMrp) {
                productRecords[i].previousMrp = localRecords[0].previousMrp;
              }
              if (!productRecords[i].remarks && localRecords[0].remarks) {
                productRecords[i].remarks = localRecords[0].remarks;
              }
              if (!productRecords[i].revisionReason && localRecords[0].revisionReason) {
                productRecords[i].revisionReason = localRecords[0].revisionReason;
              }
            }
          }
          mapped.push(...productRecords);
        }

        // Sort everything back by latest updated
        mapped.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.error("Failed to fetch MRP records from backend:", e);
    }
    return this.getAll();
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
  },

  async syncMRPToBackend(mrp: MRPRecord, productId?: number): Promise<void> {
    try {
      const payload = {
        productId: productId || parseInt(mrp.id), // If we don't have the real ID, fallback to something
        mrp: mrp.currentMrp,
        ptr: 0,
        pts: 0,
        margin: 0,
        effectiveDate: new Date(mrp.effectiveFrom).toISOString(),
        status: mrp.status
      };
      
      await apiRequest('/pricing', { method: 'POST', bodyData: payload });
    } catch (e) {
      console.error("Failed to sync MRP to backend:", e);
    }
  },

  async deleteMRPFromBackend(id: string): Promise<void> {
    try {
      await apiRequest(`/pricing/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete MRP from backend:", e);
    }
  }
};