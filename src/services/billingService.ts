import { apiRequest } from './apiClient';

// Billing Storage Service
export interface InvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  batchNo: string;
  qty: number;
  freeQty: number;
  ptr: number;
  mrp?: number;
  discountPercent: number;
  gstPercent: number;
  total: number;
  stock: number;
  barcode?: string;
  hsnCode?: string;
}

export interface GSTInvoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  paymentMode: string;
  status: string;
}

const INVOICE_KEY = "billing_gst_invoices";
const LEDGER_KEY = "finance_ledger";
const OUTSTANDING_KEY = "finance_outstanding";
const SALES_REGISTER_KEY = "sales_register";
const COUNTER_KEY = "billing_invoice_counter";
const EINVOICE_KEY = "billing_einvoices";

export const billingService = {
  getInvoices(): GSTInvoice[] {
    const data = localStorage.getItem(INVOICE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data) as GSTInvoice[];
    } catch {
      return [];
    }
  },

  async loadInvoices(): Promise<GSTInvoice[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/invoices');
      if (response && response.success && Array.isArray(response.data)) {
        const mappedInvoices: GSTInvoice[] = response.data.map((inv: any) => ({
          id: String(inv.id),
          invoiceNo: inv.invoiceNumber || inv.invoiceNo || `GST-${inv.id}`,
          customerId: String(inv.retailerId || inv.customerId || '1'),
          customerName: inv.retailer ? inv.retailer.name : (inv.customerName || 'Walk-in Customer'),
          date: inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: inv.dueDate || (inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          items: inv.items || [],
          subTotal: Number(inv.subTotal || 0),
          cgstTotal: Number(inv.cgstTotal || (inv.gstAmount ? inv.gstAmount / 2 : 0)),
          sgstTotal: Number(inv.sgstTotal || (inv.gstAmount ? inv.gstAmount / 2 : 0)),
          igstTotal: Number(inv.igstTotal || 0),
          grandTotal: Number(inv.totalAmount || inv.grandTotal || 0),
          paymentMode: inv.paymentMode || 'Cash',
          status: inv.status || 'PAID'
        }));

        localStorage.setItem(INVOICE_KEY, JSON.stringify(mappedInvoices));
        return mappedInvoices;
      }
    } catch (e) {
      console.error('Failed to load invoices from backend API:', e);
    }
    return this.getInvoices();
  },

  saveInvoice(invoice: GSTInvoice) {
    // 1. Instant local storage save
    const invoices = this.getInvoices();
    const existingIndex = invoices.findIndex((inv) => inv.id === invoice.id);
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.unshift(invoice);
    }
    localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));

    // 2. Asynchronous backend persistence to PostgreSQL
    const parsedRetailerId = parseInt(invoice.customerId, 10);
    const retailerId = !isNaN(parsedRetailerId) && parsedRetailerId > 0 ? parsedRetailerId : 1;

    apiRequest('/invoices', {
      method: 'POST',
      bodyData: {
        invoiceNumber: invoice.invoiceNo,
        retailerId: retailerId,
        subTotal: invoice.subTotal || 0,
        gstAmount: (invoice.cgstTotal || 0) + (invoice.sgstTotal || 0) + (invoice.igstTotal || 0),
        totalAmount: invoice.grandTotal || 0,
        status: invoice.status || 'PENDING',
      },
    }).catch(err => {
      console.warn("Backend API sync warning for invoice:", invoice.invoiceNo, err.message);
    });
  },

  saveAllInvoices(invoices: GSTInvoice[]) {
    localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
  },

  getNextInvoiceNo(): string {
    const counter = parseInt(localStorage.getItem(COUNTER_KEY) || "1", 10);
    const todayStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    return `GST-${todayStr}-${String(counter).padStart(4, "0")}`;
  },

  incrementCounter() {
    const counter = parseInt(localStorage.getItem(COUNTER_KEY) || "1", 10);
    localStorage.setItem(COUNTER_KEY, String(counter + 1));
  },

  saveLedger(entry: {
    id: string;
    date: string;
    partyName: string;
    particulars: string;
    debit: number;
    credit: number;
    balance: number;
  }) {
    const ledger = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]");
    ledger.push(entry);
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  },

  saveOutstanding(outstanding: {
    id: string;
    invoiceNo: string;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    status: string;
  }) {
    const outstandings = JSON.parse(localStorage.getItem(OUTSTANDING_KEY) || "[]");
    outstandings.push(outstanding);
    localStorage.setItem(OUTSTANDING_KEY, JSON.stringify(outstandings));
  },

  saveSalesRegister(invoice: GSTInvoice) {
    const register = JSON.parse(localStorage.getItem(SALES_REGISTER_KEY) || "[]");
    register.push(invoice);
    localStorage.setItem(SALES_REGISTER_KEY, JSON.stringify(register));
  },

  getEInvoices(): Record<string, any> {
    const data = localStorage.getItem(EINVOICE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  saveEInvoiceMetadata(invoiceNo: string, metadata: any) {
    const current = this.getEInvoices();
    current[invoiceNo] = metadata;
    localStorage.setItem(EINVOICE_KEY, JSON.stringify(current));
  }
};
