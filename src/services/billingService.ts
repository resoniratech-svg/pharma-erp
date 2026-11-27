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
  extraMargin?: number;
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
    const localInvoices = this.getInvoices();
    const localMap = new Map<string, GSTInvoice>();
    localInvoices.forEach(inv => {
      if (inv.invoiceNo) localMap.set(inv.invoiceNo, inv);
      if (inv.id) localMap.set(inv.id, inv);
    });

    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/invoices');
      if (response && response.success && Array.isArray(response.data)) {
        const mappedInvoices: GSTInvoice[] = response.data.map((inv: any) => {
          const invKey = inv.invoiceNumber || inv.invoiceNo || `GST-${inv.id}`;
          const localMatch = localMap.get(invKey) || localMap.get(String(inv.id));

          // 1. Resolve items: priority to localMatch.items if they exist and are non-empty
          let resolvedItems: InvoiceItem[] = [];
          if (localMatch && Array.isArray(localMatch.items) && localMatch.items.length > 0) {
            resolvedItems = localMatch.items;
          } else if (inv.jsonPayload && Array.isArray(inv.jsonPayload.items) && inv.jsonPayload.items.length > 0) {
            resolvedItems = inv.jsonPayload.items;
          } else if (Array.isArray(inv.invoiceItems) && inv.invoiceItems.length > 0) {
            resolvedItems = inv.invoiceItems.map((it: any, idx: number) => {
              const prod = it.product || {};
              return {
                id: String(it.id || idx + 1),
                productId: String(it.productId || prod.id || ''),
                productCode: it.productCode || prod.code || `PRD-${it.productId || idx}`,
                productName: it.productName || prod.name || 'Medicine Product',
                batchNo: it.batchNo || it.batchNumber || 'BAT-000001',
                qty: Number(it.quantity !== undefined ? it.quantity : (it.qty !== undefined ? it.qty : 1)),
                freeQty: Number(it.freeQty || 0),
                ptr: Number(it.rate !== undefined ? it.rate : (it.ptr !== undefined ? it.ptr : 0)),
                mrp: Number(it.mrp || prod.mrp || 0),
                discountPercent: Number(it.discountPercent || it.discount || 0),
                gstPercent: Number(it.gst !== undefined ? it.gst : (it.gstPercent !== undefined ? it.gstPercent : 12)),
                extraMargin: Number(it.extraMargin || 0),
                total: Number(it.amount !== undefined ? it.amount : (it.total !== undefined ? it.total : 0)),
                stock: Number(it.stock || 100),
                barcode: it.barcode || prod.barcode || '',
                hsnCode: it.hsnCode || prod.hsnCode || ''
              };
            });
          } else if (Array.isArray(inv.items) && inv.items.length > 0) {
            resolvedItems = inv.items;
          }

          // If still no items, but invoice has taxable/subTotal > 0, reconstruct line item so edit is never empty!
          const subTotalVal = Number(inv.subTotal || (localMatch ? localMatch.subTotal : 0));
          const totalVal = Number(inv.totalAmount || inv.grandTotal || (localMatch ? localMatch.grandTotal : 0));
          if (resolvedItems.length === 0 && (subTotalVal > 0 || totalVal > 0)) {
            const effectiveSub = subTotalVal > 0 ? subTotalVal : (totalVal / 1.12);
            const effectiveGstAmt = Math.max(0, totalVal - effectiveSub);
            const calcGst = effectiveSub > 0 ? Math.round((effectiveGstAmt / effectiveSub) * 100) : 12;

            resolvedItems = [{
              id: `ITEM-${inv.id || Date.now()}-1`,
              productId: '',
              productCode: 'PRD-MED',
              productName: 'Pharmaceutical Supplies (Preserved Order)',
              batchNo: 'BAT-000001',
              qty: 1,
              freeQty: 0,
              ptr: Number(effectiveSub.toFixed(2)),
              mrp: Number((effectiveSub * 1.2).toFixed(2)),
              discountPercent: 0,
              gstPercent: calcGst || 12,
              extraMargin: 0,
              total: Number(totalVal.toFixed(2)),
              stock: 100
            }];
          }

          return {
            id: String(inv.id),
            invoiceNo: invKey,
            customerId: String(inv.retailerId || (localMatch ? localMatch.customerId : '1')),
            customerName: inv.retailer ? inv.retailer.name : (localMatch ? localMatch.customerName : (inv.customerName || 'Walk-in Customer')),
            date: inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : (localMatch?.date || new Date().toISOString().split('T')[0]),
            dueDate: inv.dueDate || (localMatch?.dueDate || (inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])),
            items: resolvedItems,
            subTotal: subTotalVal,
            cgstTotal: Number(inv.cgstTotal || (inv.gstAmount ? inv.gstAmount / 2 : (localMatch ? localMatch.cgstTotal : 0))),
            sgstTotal: Number(inv.sgstTotal || (inv.gstAmount ? inv.gstAmount / 2 : (localMatch ? localMatch.sgstTotal : 0))),
            igstTotal: Number(inv.igstTotal || (localMatch ? localMatch.igstTotal : 0)),
            grandTotal: totalVal,
            paymentMode: inv.paymentMode || (localMatch ? localMatch.paymentMode : 'Credit'),
            status: inv.status || (localMatch ? localMatch.status : 'PAID')
          };
        });

        // Retain any local invoices not yet on the server
        localInvoices.forEach(loc => {
          if (!mappedInvoices.some(m => m.invoiceNo === loc.invoiceNo || m.id === loc.id)) {
            mappedInvoices.push(loc);
          }
        });

        // Sort descending: newest invoices ALWAYS on top!
        mappedInvoices.sort((a, b) => {
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          const numA = parseInt(a.id, 10);
          const numB = parseInt(b.id, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
          return (b.invoiceNo || b.id).localeCompare(a.invoiceNo || a.id);
        });

        localStorage.setItem(INVOICE_KEY, JSON.stringify(mappedInvoices));
        return mappedInvoices;
      }
    } catch (e) {
      console.error('Failed to load invoices from backend API:', e);
    }

    const fallbackLocal = this.getInvoices();
    fallbackLocal.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      if (timeB !== timeA) return timeB - timeA;
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
      return (b.invoiceNo || b.id).localeCompare(a.invoiceNo || a.id);
    });
    return fallbackLocal;
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
    const retailerId = !isNaN(parsedRetailerId) && parsedRetailerId > 0 ? parsedRetailerId : (invoice.customerId === 'RET-001' || (invoice.customerName && invoice.customerName.toLowerCase().includes('arun')) ? 25 : 1);

    apiRequest('/invoices', {
      method: 'POST',
      bodyData: {
        invoiceNumber: invoice.invoiceNo,
        retailerId: retailerId,
        subTotal: invoice.subTotal || 0,
        gstAmount: (invoice.cgstTotal || 0) + (invoice.sgstTotal || 0) + (invoice.igstTotal || 0),
        totalAmount: invoice.grandTotal || 0,
        status: invoice.status || 'PENDING',
        customerName: invoice.customerName,
        paymentMode: invoice.paymentMode,
        items: invoice.items
      },
    }).catch(err => {
      console.warn("Backend API sync warning for invoice:", invoice.invoiceNo, err.message);
    });
  },

  updateInvoice(id: string, updatedFields: Partial<GSTInvoice>) {
    const invoices = this.getInvoices();
    const existingIndex = invoices.findIndex((inv) => inv.id === id);
    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoices[existingIndex], ...updatedFields };
      localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
    }

    const numId = parseInt(id, 10);
    if (!isNaN(numId) && numId > 0) {
      const payload: any = {};
      if (updatedFields.status) payload.status = updatedFields.status;
      if (updatedFields.paymentMode) payload.paymentMode = updatedFields.paymentMode;
      if (updatedFields.grandTotal !== undefined) payload.totalAmount = updatedFields.grandTotal;
      if (updatedFields.subTotal !== undefined) payload.subTotal = updatedFields.subTotal;
      if (updatedFields.cgstTotal !== undefined || updatedFields.sgstTotal !== undefined || updatedFields.igstTotal !== undefined) {
        payload.gstAmount = (updatedFields.cgstTotal || 0) + (updatedFields.sgstTotal || 0) + (updatedFields.igstTotal || 0);
      }
      apiRequest(`/invoices/${numId}`, {
        method: 'PUT',
        bodyData: payload,
      }).catch(err => {
        console.warn("Backend API sync warning on update invoice:", id, err.message);
      });
    }
  },

  cancelInvoice(invoiceNo: string) {
    const invoices = this.getInvoices();
    const target = invoices.find(inv => inv.invoiceNo === invoiceNo);
    if (target) {
      target.status = 'Cancelled';
      localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
    }
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
