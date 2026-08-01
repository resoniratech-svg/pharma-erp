import { apiRequest } from './apiClient';

export interface AgingPartyRecord {
  id: string;
  partyName: string;
  partyType: 'Customer' | 'Supplier' | 'Distributor' | 'Vendor';
  creditDays: number;
  lastPaymentDate: string;
  invoices: {
    id: string;
    invoiceNo: string;
    date: string;
    dueDate: string;
    amount: number;
    paidAmount: number;
  }[];
}

export interface FinanceData {
  category: string;
  item: string;
  amount: number;
}

export const financeService = {
  // Mock fallback data for Aging Report
  fallbackAgingData: [
    {
      id: '1',
      partyName: 'Metro Pharma Distributors',
      partyType: 'Distributor',
      creditDays: 30,
      lastPaymentDate: '15-Oct-2026',
      invoices: [
        { id: 'inv1', invoiceNo: 'INV-2026-991', date: '2026-09-01', dueDate: '2026-10-01', amount: 150000, paidAmount: 50000 },
        { id: 'inv2', invoiceNo: 'INV-2026-992', date: '2026-08-15', dueDate: '2026-09-15', amount: 80000, paidAmount: 0 },
      ]
    },
    {
      id: '2',
      partyName: 'Apollo Pharmacy',
      partyType: 'Customer',
      creditDays: 15,
      lastPaymentDate: '10-Oct-2026',
      invoices: [
        { id: 'inv3', invoiceNo: 'SAL-2026-001', date: '2026-10-05', dueDate: '2026-10-20', amount: 45000, paidAmount: 0 },
        { id: 'inv4', invoiceNo: 'SAL-2026-002', date: '2026-07-10', dueDate: '2026-07-25', amount: 120000, paidAmount: 0 },
      ]
    },
  ] as AgingPartyRecord[],

  // Get Aging Data
  getAgingData: async (): Promise<AgingPartyRecord[]> => {
    try {
      // In a real scenario we might fetch from /api/outstanding or /api/invoices and group by party
      const response = await apiRequest<{ success: boolean; data: any[] }>('/invoices');
      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        // Group invoices by party
        const partiesMap = new Map<string, AgingPartyRecord>();
        
        response.data.forEach(inv => {
          const partyId = inv.retailerId || inv.distributorId || 'unknown';
          const partyName = inv.retailerName || inv.distributorName || inv.customerName || 'Unknown Party';
          const partyType = inv.retailerId ? 'Customer' : (inv.distributorId ? 'Distributor' : 'Vendor');
          
          if (!partiesMap.has(String(partyId))) {
            partiesMap.set(String(partyId), {
              id: String(partyId),
              partyName,
              partyType: partyType as any,
              creditDays: 30, // Default or fetch from party model
              lastPaymentDate: 'N/A', // Ideally fetched from latest payment receipt
              invoices: []
            });
          }
          
          partiesMap.get(String(partyId))!.invoices.push({
            id: String(inv.id),
            invoiceNo: inv.invoiceNo || `INV-${inv.id}`,
            date: inv.date || inv.createdAt,
            dueDate: inv.dueDate || inv.createdAt, // If no due date, fallback to createdAt
            amount: Number(inv.grandTotal || inv.amount || 0),
            paidAmount: Number(inv.paidAmount || 0)
          });
        });
        
        return Array.from(partiesMap.values());
      }
    } catch (error) {
      console.warn("Failed to fetch aging invoices from backend", error);
    }
    
    // Fallback to local storage if API fails or is empty
    const data = localStorage.getItem('pharma_erp_aging_reports');
    if (!data) {
      localStorage.setItem('pharma_erp_aging_reports', JSON.stringify(financeService.fallbackAgingData));
      return financeService.fallbackAgingData;
    }
    return JSON.parse(data);
  },

  // Get Profit & Loss Data
  getProfitLossData: async (): Promise<{ incomeData: FinanceData[], expenseData: FinanceData[] }> => {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>('/accounting/profit-loss');
      if (response && response.success && response.data) {
        // Map backend response if it exists
        return {
          incomeData: response.data.income || [],
          expenseData: response.data.expense || []
        };
      }
    } catch (err) {
      console.warn('Failed to fetch profit and loss from API', err);
    }
    
    return {
      incomeData: [],
      expenseData: []
    };
  },

  // Get Balance Sheet Data
  getBalanceSheetData: async (): Promise<{ assets: FinanceData[], liabilities: FinanceData[] }> => {
    // In a full implementation, you'd call a dedicated endpoint like `/accounting/balance-sheet`
    // Returning empty array since no backend exists yet, so UI shows 0 instead of mock data
    return {
      assets: [],
      liabilities: []
    };
  }
};
