// src/services/ledgerService.ts

export interface LedgerEntry {
  id: string;
  date: string;
  distributor: string;
  distributorCode: string;
  contactPerson: string;
  refNo: string;
  type: 'Invoice' | 'Payment' | 'Credit Note' | 'Debit Note';
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

export const ledgerService = {
  getAll: (): LedgerEntry[] => {
    const data = localStorage.getItem('erp_ledger_entries');
    if (!data) {
      localStorage.setItem('erp_ledger_entries', JSON.stringify(fallbackMockData));
      return fallbackMockData;
    }
    return JSON.parse(data);
  },

  saveAll: (data: LedgerEntry[]) => {
    localStorage.setItem('erp_ledger_entries', JSON.stringify(data));
  },

  addTransaction: (entry: Omit<LedgerEntry, 'id' | 'balanceAmount' | 'balanceType'>) => {
    const currentEntries = ledgerService.getAll();
    
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