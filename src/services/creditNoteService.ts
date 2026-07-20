import { apiRequest } from './apiClient';

export type CNStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

export interface CreditNoteItemInput {
  productId: number;
  batchId: number;
  quantity: number;
  disposition: string; // 'SALABLE' | 'EXPIRED_DUMP' | 'DESTRUCTION'
}

export interface CreditNoteInput {
  cnType: string;
  reason: string;
  remarks?: string;
  retailerId?: number;
  distributorId?: number;
  mrId?: number;
  againstInvoiceId?: number;
  items?: CreditNoteItemInput[];
}

export interface CreditNoteData {
  id: string;
  cnNo: string;
  cnDate: string;
  status: CNStatus;
  cnType: string;
  reason: string;
  remarks: string | null;
  retailerId: number | null;
  distributorId: number | null;
  mrId: number | null;
  againstInvoiceId: number | null;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  amountSettled: number;
  
  // Relations mapped from backend
  customerName: string;
  customerType: string;
  againstInvoiceNo: string;
  invoiceDate: string;
  items: Array<{
    id: number;
    productId: number;
    batchId: number;
    quantity: number;
    rate: number;
    gstPercent: number;
    totalAmount: number;
    disposition: string;
    product: {
      id: number;
      name: string;
      code: string;
    };
    batch: {
      id: number;
      batchNumber: string;
    };
  }>;
}

function mapToUi(cn: any): CreditNoteData {
  let customerName = 'General';
  let customerType = 'N/A';
  
  if (cn.retailer) {
    customerName = cn.retailer.name;
    customerType = 'Retailer';
  } else if (cn.distributor) {
    customerName = cn.distributor.name;
    customerType = 'Distributor';
  } else if (cn.mr) {
    customerName = cn.mr.name;
    customerType = 'MR';
  }

  return {
    id: String(cn.id),
    cnNo: cn.cnNo,
    cnDate: new Date(cn.cnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
    status: cn.status as CNStatus,
    cnType: cn.cnType,
    reason: cn.reason,
    remarks: cn.remarks,
    retailerId: cn.retailerId,
    distributorId: cn.distributorId,
    mrId: cn.mrId,
    againstInvoiceId: cn.againstInvoiceId,
    taxableAmount: Number(cn.taxableAmount || 0),
    gstAmount: Number(cn.gstAmount || 0),
    totalAmount: Number(cn.totalAmount || 0),
    amountSettled: Number(cn.amountSettled || 0),
    customerName,
    customerType,
    againstInvoiceNo: cn.againstInvoice ? cn.againstInvoice.invoiceNumber : 'N/A',
    invoiceDate: cn.againstInvoice && cn.againstInvoice.invoiceDate 
      ? new Date(cn.againstInvoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
      : 'N/A',
    items: cn.items || []
  };
}

export const creditNoteService = {
  async getCreditNotes(filters: { status?: string; section?: string } = {}): Promise<CreditNoteData[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.section) params.append('section', filters.section);
    
    const response = await apiRequest<{ success: boolean; data: any[] }>(`/credit-notes?${params.toString()}`);
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(mapToUi);
    }
    return [];
  },

  async getCreditNoteById(id: string): Promise<CreditNoteData> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/credit-notes/${id}`);
    if (response.success && response.data) {
      return mapToUi(response.data);
    }
    throw new Error('Credit Note not found');
  },

  async createCreditNote(input: CreditNoteInput): Promise<CreditNoteData> {
    const response = await apiRequest<{ success: boolean; data: any }>('/credit-notes', {
      method: 'POST',
      bodyData: input
    });
    if (response.success && response.data) {
      return mapToUi(response.data);
    }
    throw new Error('Failed to create Credit Note');
  },

  async settleCreditNote(id: string, settlementAmount: number, remarks?: string): Promise<CreditNoteData> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/credit-notes/${id}/settle`, {
      method: 'POST',
      bodyData: { settlementAmount, remarks }
    });
    if (response.success && response.data) {
      return mapToUi(response.data);
    }
    throw new Error('Failed to settle Credit Note');
  },

  // Helper to query available invoices for the create form
  async getInvoices(): Promise<any[]> {
    const response = await apiRequest<{ success: boolean; data: any[] }>('/invoices');
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  // Helper to fetch details of a specific invoice
  async getInvoiceById(id: number): Promise<any> {
    const response = await apiRequest<{ success: boolean; data: any }>(`/invoices/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }
};
