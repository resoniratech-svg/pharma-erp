const STORAGE_KEY = "stockLedgerRecords";

export const stockLedgerService = {
  async getAll(): Promise<any[]> {
    try {
      const { apiRequest } = await import('./apiClient');
      const response = await apiRequest<{ success: boolean; data: any[] }>('/stock-movements');
      if (response && response.success && Array.isArray(response.data)) {
        const mapped = response.data.map((m: any) => ({
          id: String(m.id),
          date: m.movementDate ? m.movementDate.split('T')[0] : new Date().toISOString().split('T')[0],
          productCode: m.product?.code || `PRD-${m.productId}`,
          productName: m.product?.name || `Product ${m.productId}`,
          batchNo: m.batch?.batchNumber || `BAT-${m.batchId}`,
          transactionType: m.type, // e.g. 'INWARD', 'OUTWARD'
          referenceNo: m.reference || m.referenceId || '-',
          quantity: m.quantity,
          closingStock: m.quantity // Note: precise closing stock logic requires historical accumulation, but we put quantity here for now as a fallback
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn("Failed to fetch stock movements from backend:", e);
    }
    
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