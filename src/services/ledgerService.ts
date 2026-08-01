import { apiRequest } from './apiClient';

export interface LedgerEntry {
  id: string;
  date: string;
  distributor: string;
  distributorCode: string;
  contactPerson: string;
  refNo: string;
  type: 'Invoice' | 'Payment' | 'Credit Note' | 'Debit Note' | string;
  debitAmount: number;
  creditAmount: number;
  balanceAmount: number;
  balanceType: 'Dr' | 'Cr';
}

const fallbackMockData: LedgerEntry[] = [
  { id: '1', date: '15-Oct-2026', distributor: 'Metro Pharma Distributors', distributorCode: 'DIST-001', contactPerson: 'Rahul Sharma', refNo: 'INV-2026-991', type: 'Invoice', debitAmount: 150000, creditAmount: 0, balanceAmount: 360000, balanceType: 'Dr' },
  { id: '2', date: '14-Oct-2026', distributor: 'Metro Pharma Distributors', distributorCode: 'DIST-001', contactPerson: 'Rahul Sharma', refNo: 'RCPT-1002', type: 'Payment', debitAmount: 0, creditAmount: 50000, balanceAmount: 210000, balanceType: 'Dr' },
  { id: '3', date: '10-Oct-2026', distributor: 'Global Health Supply', distributorCode: 'DIST-002', contactPerson: 'Amit Patel', refNo: 'CN-2026-04', type: 'Credit Note', debitAmount: 0, creditAmount: 12000, balanceAmount: 43000, balanceType: 'Dr' },
];

function formatDate(dateObj: string | Date): string {
  const d = new Date(dateObj);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
}

export const ledgerService = {
  getAll: async (): Promise<LedgerEntry[]> => {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/ledgers');
      
      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map(item => ({
          id: String(item.id),
          date: formatDate(item.createdAt || item.date || new Date()),
          distributor: item.retailer?.name || item.distributor || 'Unknown Party',
          distributorCode: item.retailer?.code || item.distributorCode || 'Unknown',
          contactPerson: item.retailer?.contactPerson || item.contactPerson || 'N/A',
          refNo: item.referenceNumber || item.refNo || 'N/A',
          type: item.transactionType || item.type || 'Invoice',
          debitAmount: Number(item.debit) || 0,
          creditAmount: Number(item.credit) || 0,
          balanceAmount: Math.abs(Number(item.balance)) || 0,
          balanceType: (Number(item.balance) || 0) >= 0 ? 'Dr' : 'Cr'
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch ledger entries from backend", error);
    }

    // Fallback to local storage if API fails or is empty
    const data = localStorage.getItem('erp_ledger_entries');
    if (!data) {
      localStorage.setItem('erp_ledger_entries', JSON.stringify(fallbackMockData));
      return fallbackMockData;
    }
    return JSON.parse(data);
  },

  addTransaction: async (entry: Omit<LedgerEntry, 'id' | 'balanceAmount' | 'balanceType'>): Promise<LedgerEntry> => {
    // Attempt backend save first
    try {
       // We only mock the retailer ID or find it if we can in a real app,
       // but for now we pass standard structure hoping backend accepts or ignores
       const payload = {
         retailerId: 1, // hardcoded for test if not provided
         transactionType: entry.type,
         referenceNumber: entry.refNo,
         debit: entry.debitAmount,
         credit: entry.creditAmount,
         balance: entry.debitAmount - entry.creditAmount, // Simplified balance logic for backend payload
         remarks: entry.distributor + ' ' + entry.distributorCode,
       };
       
       const response = await apiRequest<{ success: boolean; data: any }>('/ledgers', {
         method: 'POST',
         bodyData: payload
       });

       if (response && response.success && response.data) {
          const item = response.data;
          return {
             id: String(item.id),
             date: formatDate(item.createdAt || new Date()),
             distributor: entry.distributor,
             distributorCode: entry.distributorCode,
             contactPerson: entry.contactPerson,
             refNo: item.referenceNumber,
             type: item.transactionType,
             debitAmount: Number(item.debit),
             creditAmount: Number(item.credit),
             balanceAmount: Math.abs(Number(item.balance)),
             balanceType: Number(item.balance) >= 0 ? 'Dr' : 'Cr'
          };
       }
    } catch(err) {
      console.warn('Failed to save ledger to backend, saving to local', err);
    }

    // Local fallback
    const currentEntriesRaw = localStorage.getItem('erp_ledger_entries');
    let currentEntries: LedgerEntry[] = currentEntriesRaw ? JSON.parse(currentEntriesRaw) : fallbackMockData;
    
    // Clean out mock data items if they exist to prevent mixing dummy values with real data
    const filteredEntries = currentEntries.filter(
      item => !['INV-2026-991', 'RCPT-1002', 'CN-2026-04'].includes(item.refNo)
    );

    // Calculate the running balance correctly by searching for the last true entry matching this specific distributor
    const distributorEntries = filteredEntries.filter(e => e.distributorCode === entry.distributorCode);
    
    let previousBalance = 0;
    if (distributorEntries.length > 0) {
      // Safely access the record using explicit typing mapping
      const lastRecord = distributorEntries[0] as LedgerEntry;
      previousBalance = lastRecord.balanceType === 'Dr' ? lastRecord.balanceAmount : -lastRecord.balanceAmount;
    }

    // Add debit values (dues) and subtract credit values (payments received)
    const newBalance = previousBalance + entry.debitAmount - entry.creditAmount;

    const newRecord: LedgerEntry = {
      ...entry,
      id: Date.now().toString(),
      balanceAmount: Math.abs(newBalance),
      balanceType: newBalance >= 0 ? 'Dr' : 'Cr'
    };

    // Store the clean entries list with the newest action placed right at the top
    localStorage.setItem('erp_ledger_entries', JSON.stringify([newRecord, ...filteredEntries]));
    return newRecord;
  },

  // Helper method to completely reset storage back to clean state
  clearLedger: () => {
    localStorage.removeItem('erp_ledger_entries');
  }
};