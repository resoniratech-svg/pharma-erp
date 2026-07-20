import { jsPDF } from 'jspdf';
import { applyInvoiceTemplate } from '../documents/templates/InvoiceTemplate';

export interface SalesInvoiceItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  rate: number;
  discountPct?: number;
  discountAmount?: number;
  taxableValue: number;
  gstPct: number;
  gstAmount: number;
  lineAmount: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNo: string;
  orderNo: string;
  dispatchNo: string;
  date: string;
  dueDate: string;
  distributorId: string;
  distributorCode: string;
  distributorName: string;
  retailerId: string;
  retailerCode: string;
  retailerName: string;
  billingAddress: string;
  shippingAddress: string;
  items: SalesInvoiceItem[];
  taxableAmount: number;
  totalDiscount: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  paymentStatus: 'Pending' | 'Paid' | 'Partial' | 'Unpaid';
  paidAmount?: number;
  outstandingAmount?: number;
  invoiceType?: 'Sales' | 'Purchase';
}

const STORAGE_KEY = 'pharma_erp_sales_invoices';
const GLOBAL_INVOICES_KEY = 'pharma_erp_invoices';

export const salesInvoiceService = {
  getAll: (): SalesInvoice[] => {
    // 1. Check if sales invoices exist
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== '[]') {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing sales invoices", e);
      }
    }

    // 2. Fallback: Parse global invoices and extract/filter Sales invoices
    const globalStored = localStorage.getItem(GLOBAL_INVOICES_KEY);
    let salesInvoices: SalesInvoice[] = [];
    if (globalStored) {
      try {
        const globalInvoices = JSON.parse(globalStored);
        salesInvoices = globalInvoices
          .filter((inv: any) => inv.invoiceType === 'Sales' || inv.invoiceNo?.startsWith('SAL-INV'))
          .map((inv: any) => ({
            ...inv,
            id: inv.id || `sales-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            paymentStatus: inv.paymentStatus || inv.status || 'Pending',
            grandTotal: inv.grandTotal || inv.amount || 0,
            retailerName: inv.retailerName || inv.retailer || '',
            retailerCode: inv.retailerCode || inv.retailerCode || '',
            invoiceType: 'Sales'
          }));
      } catch (e) {
        console.error("Error parsing global invoices", e);
      }
    }

    // Save to sales invoices storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(salesInvoices));
    return salesInvoices;
  },

  saveAll: (invoices: SalesInvoice[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    
    // Also sync back to global invoices
    try {
      const globalStored = localStorage.getItem(GLOBAL_INVOICES_KEY);
      let globalInvoices = globalStored ? JSON.parse(globalStored) : [];
      
      // Update or insert sales invoices in the global list
      invoices.forEach(saleInv => {
        const idx = globalInvoices.findIndex((inv: any) => inv.invoiceNo === saleInv.invoiceNo);
        const mappedGlobal = {
          ...saleInv,
          amount: saleInv.grandTotal,
          status: saleInv.paymentStatus === 'Paid' ? 'Paid' : (saleInv.paymentStatus === 'Partial' ? 'Partially Paid' : 'Unpaid'),
          invoiceType: 'Sales'
        };
        if (idx !== -1) {
          globalInvoices[idx] = { ...globalInvoices[idx], ...mappedGlobal };
        } else {
          globalInvoices.unshift(mappedGlobal);
        }
      });
      
      localStorage.setItem(GLOBAL_INVOICES_KEY, JSON.stringify(globalInvoices));
    } catch (e) {
      console.error("Error syncing to global invoices", e);
    }
  },

  getDistributorSalesInvoices: (distributorCode: string): SalesInvoice[] => {
    return salesInvoiceService.getAll().filter(inv => inv.distributorCode === distributorCode);
  },

  checkInvoiceExists: (dispatchNo: string): boolean => {
    return salesInvoiceService.getAll().some(inv => inv.dispatchNo === dispatchNo);
  },

  createSalesInvoice: (invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNo' | 'dueDate'>): SalesInvoice => {
    const invoices = salesInvoiceService.getAll();
    
    // Generate invoice number e.g. SAL-INV-2026-0001
    const year = new Date().getFullYear();
    const salesInThisYear = invoices.filter(inv => inv.invoiceNo.startsWith(`SAL-INV-${year}`));
    const nextSeq = String(salesInThisYear.length + 1).padStart(4, '0');
    const invoiceNo = `SAL-INV-${year}-${nextSeq}`;

    // Set default due date to 15 days from invoice date
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + 15);
    const dueDate = dateObj.toISOString().split('T')[0];

    const newInvoice: SalesInvoice = {
      ...invoiceData,
      id: `sales-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      invoiceNo,
      dueDate,
      paidAmount: 0,
      outstandingAmount: invoiceData.grandTotal,
      invoiceType: 'Sales'
    };

    invoices.unshift(newInvoice);
    salesInvoiceService.saveAll(invoices);
    return newInvoice;
  },

  downloadInvoice: (invoiceNo: string, role: string) => {
    const invoice = salesInvoiceService.getAll().find(inv => inv.invoiceNo === invoiceNo);
    if (!invoice) {
      alert("Invoice not found.");
      return;
    }
    const doc = new jsPDF();
    applyInvoiceTemplate(doc, invoice, role);
    doc.save(`invoice_${invoiceNo}.pdf`);
  },

  printInvoice: (invoiceNo: string, role: string) => {
    const invoice = salesInvoiceService.getAll().find(inv => inv.invoiceNo === invoiceNo);
    if (!invoice) {
      alert("Invoice not found.");
      return;
    }
    const doc = new jsPDF();
    applyInvoiceTemplate(doc, invoice, role);
    
    // Print logic by opening in new window
    const string = doc.output('dataurlstring');
    const iframe = `<iframe width='100%' height='100%' src='${string}'></iframe>`;
    const x = window.open();
    if (x) {
      x.document.open();
      x.document.write(iframe);
      x.document.close();
    } else {
      alert("Please allow popups to print/preview invoice.");
    }
  }
};
