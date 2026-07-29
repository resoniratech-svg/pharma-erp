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
  againstInvoiceId?: number | string;
  againstInvoiceNo?: string;
  customerName?: string;
  taxableAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
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
  againstInvoiceId: number | string | null;
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

function formatDate(raw: any): string {
  if (!raw) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  } catch (e) {
    return String(raw);
  }
}

function mapToUi(cn: any): CreditNoteData {
  let customerName = cn.customerName || 'General Customer';
  let customerType = 'Customer';
  
  if (cn.distributor && cn.distributor.name) {
    customerName = cn.distributor.name;
    customerType = 'Distributor';
  } else if (cn.retailer && cn.retailer.name) {
    customerName = cn.retailer.name;
    customerType = 'Retailer';
  } else if (cn.mr && cn.mr.name) {
    customerName = cn.mr.name;
    customerType = 'MR';
  } else if (cn.againstInvoice && cn.againstInvoice.customerName) {
    customerName = cn.againstInvoice.customerName;
  }

  let againstInvNo = 'N/A';
  if (cn.againstInvoiceNo && cn.againstInvoiceNo !== 'N/A' && !/^\d{10,}$/.test(String(cn.againstInvoiceNo))) {
    againstInvNo = String(cn.againstInvoiceNo);
  } else if (cn.againstInvoice && cn.againstInvoice.invoiceNumber) {
    againstInvNo = cn.againstInvoice.invoiceNumber;
  } else if (cn.remarks && cn.remarks.includes('Against Invoice:')) {
    againstInvNo = cn.remarks.replace('Against Invoice:', '').trim();
  }

  return {
    id: String(cn.id),
    cnNo: cn.cnNo || `CN/26/${Math.floor(1000 + Math.random() * 9000)}`,
    cnDate: formatDate(cn.cnDate),
    status: (cn.status as CNStatus) || 'PAID',
    cnType: cn.cnType || 'Sales Return',
    reason: cn.reason || 'Sales Return',
    remarks: cn.remarks || null,
    retailerId: cn.retailerId || null,
    distributorId: cn.distributorId || null,
    mrId: cn.mrId || null,
    againstInvoiceId: cn.againstInvoiceId || null,
    taxableAmount: Number(cn.taxableAmount || 0),
    gstAmount: Number(cn.gstAmount || 0),
    totalAmount: Number(cn.totalAmount || 0),
    amountSettled: Number(cn.amountSettled || cn.totalAmount || 0),
    customerName,
    customerType,
    againstInvoiceNo: againstInvNo,
    invoiceDate: cn.invoiceDate || (cn.againstInvoice && cn.againstInvoice.invoiceDate 
      ? formatDate(cn.againstInvoice.invoiceDate)
      : 'N/A'),
    items: cn.items || []
  };
}

export const creditNoteService = {
  async getCreditNotes(filters: { status?: string; section?: string } = {}): Promise<CreditNoteData[]> {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.section) params.append('section', filters.section);
      
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/credit-notes?${params.toString()}`);
      if (response && response.success && Array.isArray(response.data)) {
        return response.data.map(mapToUi);
      }
    } catch (err) {
      console.warn("Credit note backend fetch error:", err);
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
    let backendError: string | null = null;
    try {
      const response = await apiRequest<{ success: boolean; data: any }>('/credit-notes', {
        method: 'POST',
        bodyData: input
      });
      if (response && response.success && response.data) {
        const record = mapToUi(response.data);
        if (input.customerName) record.customerName = input.customerName;
        if (input.againstInvoiceNo) record.againstInvoiceNo = input.againstInvoiceNo;
        return record;
      }
      backendError = (response as any)?.message || 'Backend returned an error';
    } catch (err: any) {
      backendError = err?.message || 'Network error';
      console.warn("Backend credit-note create API failed:", backendError);
    }

    // Local Storage Fallback — saves locally when backend is unavailable
    try {
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      const localRecord: CreditNoteData = {
        id: `cn-local-${Date.now()}`,
        cnNo: `CN/26/${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: input.customerName || 'Walk-in Customer',
        customerType: 'Distributor / Retailer',
        againstInvoiceNo: input.againstInvoiceNo || 'N/A',
        invoiceDate: dateStr,
        cnDate: dateStr,
        cnType: input.cnType,
        reason: input.reason,
        remarks: input.remarks || null,
        retailerId: input.retailerId || null,
        distributorId: input.distributorId || null,
        mrId: input.mrId || null,
        againstInvoiceId: input.againstInvoiceId || null,
        taxableAmount: input.taxableAmount || 0,
        gstAmount: input.gstAmount || 0,
        totalAmount: input.totalAmount || 0,
        amountSettled: input.totalAmount || 0,
        status: 'PAID',
        items: []
      };
      // Read existing local records safely
      const existingRaw = localStorage.getItem("pharma_erp_credit_notes");
      const existingData: CreditNoteData[] = existingRaw ? JSON.parse(existingRaw) : [];
      existingData.unshift(localRecord);
      localStorage.setItem("pharma_erp_credit_notes", JSON.stringify(existingData));
      return localRecord;
    } catch (localErr: any) {
      throw new Error(backendError || localErr?.message || 'Failed to create credit note');
    }
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
