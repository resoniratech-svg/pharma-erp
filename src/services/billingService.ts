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

  saveInvoice(invoice: GSTInvoice) {
    const invoices = this.getInvoices();
    const existingIndex = invoices.findIndex((inv) => inv.id === invoice.id);
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.unshift(invoice);
    }
    localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
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
    const sales = JSON.parse(localStorage.getItem(SALES_REGISTER_KEY) || "[]");
    sales.push(invoice);
    localStorage.setItem(SALES_REGISTER_KEY, JSON.stringify(sales));
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
    const data = this.getEInvoices();
    data[invoiceNo] = metadata;
    localStorage.setItem(EINVOICE_KEY, JSON.stringify(data));
  },

  cancelInvoice(invoiceNo: string) {
    const invoices = this.getInvoices();
    const match = invoices.find(inv => inv.invoiceNo === invoiceNo);
    if (match) {
      match.status = 'Cancelled';
      this.saveAllInvoices(invoices);
    }

    // Also update sales register
    const sales = JSON.parse(localStorage.getItem(SALES_REGISTER_KEY) || "[]");
    const saleMatch = sales.find((s: any) => s.invoiceNo === invoiceNo);
    if (saleMatch) {
      saleMatch.status = 'Cancelled';
      localStorage.setItem(SALES_REGISTER_KEY, JSON.stringify(sales));
    }
  }
};
