import { apiRequest } from './apiClient';

export interface FinanceData {
  category: string;
  item: string;
  amount: number;
}

export interface LedgerTransaction {
  id: string;
  voucherId: number;
  ledgerId: number;
  type: 'DR' | 'CR';
  amount: number;
  voucher: {
    voucherNumber: string;
    voucherType: string;
    voucherDate: string;
    narration: string;
  };
}

export interface Ledger {
  id: string;
  name: string;
  groupId: number;
  openingBalance: number;
  balanceType: 'DR' | 'CR';
  group?: {
    name: string;
    nature: string;
  };
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: string;
  voucherDate: string;
  amount: number;
  narration?: string;
  paymentMode?: string;
  paymentRef?: string;
  transactions: LedgerTransaction[];
}

export interface Commission {
  id: string;
  repId: number;
  month: string;
  salesAchieved: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  territory?: string;
}

export const financeService = {
  // Vouchers
  getVouchers: async (filters: any = {}): Promise<Voucher[]> => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await apiRequest<{ success: boolean; data: Voucher[] }>(`/finance/vouchers?${queryParams}`);
      return response?.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return [];
    }
  },

  createVoucher: async (data: Partial<Voucher>): Promise<any> => {
    return apiRequest('/finance/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Ledgers
  getLedgerGroups: async (): Promise<any[]> => {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/finance/groups');
      return response?.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching ledger groups:', error);
      return [];
    }
  },

  getLedgers: async (): Promise<Ledger[]> => {
    try {
      const response = await apiRequest<{ success: boolean; data: Ledger[] }>('/finance/ledgers');
      return response?.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      return [];
    }
  },

  getLedgerStatement: async (id: string): Promise<LedgerTransaction[]> => {
    try {
      const response = await apiRequest<{ success: boolean; data: LedgerTransaction[] }>(`/finance/ledgers/${id}/statement`);
      return response?.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching ledger statement:', error);
      return [];
    }
  },

  createLedger: async (data: Partial<Ledger>): Promise<any> => {
    return apiRequest('/finance/ledgers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reports
  getTrialBalance: async (): Promise<any[]> => {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/finance/reports/trial-balance');
      return response?.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      return [];
    }
  },

  getProfitLoss: async (): Promise<any> => {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>('/finance/reports/pnl');
      return response?.success ? response.data : null;
    } catch (error) {
      console.error('Error fetching P&L:', error);
      return null;
    }
  },

  getBalanceSheet: async (): Promise<any> => {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>('/finance/reports/balance-sheet');
      return response?.success ? response.data : null;
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      return null;
    }
  },

  // Commissions
  getCommissions: async (): Promise<Commission[]> => {
    try {
      const response = await apiRequest<{ success: boolean; data: Commission[] }>('/finance/commissions');
      return response?.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching commissions:', error);
      return [];
    }
  },

  createCommission: async (data: Partial<Commission>): Promise<any> => {
    return apiRequest('/finance/commissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCommissionStatus: async (id: string, status: string): Promise<any> => {
    return apiRequest(`/finance/commissions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
};
