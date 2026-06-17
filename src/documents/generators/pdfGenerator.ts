import jsPDF from 'jspdf';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
import { applyTransportChallanTemplate } from '../templates/TransportChallanTemplate';
import { applyPurchaseOrderTemplate } from '../templates/PurchaseOrderTemplate';
import { applyInvoiceTemplate } from '../templates/InvoiceTemplate';
import { applyEInvoiceTemplate } from '../templates/EInvoiceTemplate';
import { applyEWayBillTemplate } from '../templates/EWayBillTemplate';

export const generatePdf = (challan: any) => {
  const doc = new jsPDF();
  
  // Use the single source of truth for the layout
  applyTransportChallanTemplate(doc, challan);
  
  // Download valid PDF
  doc.save(`${challan.challanNo}.pdf`);
};

export const generatePurchaseOrderPdf = (order: any) => {
  const doc = new jsPDF();
  
  // Use the single source of truth for the layout
  applyPurchaseOrderTemplate(doc, order);
  
  // Download valid PDF
  doc.save(`PO-${order.orderNo}.pdf`);
};

export const generateInvoicePdf = (invoice: any, activeRole?: string) => {
  const doc = new jsPDF();
  const role = activeRole || localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  
  // Use the single source of truth for the layout
  applyInvoiceTemplate(doc, invoice, role);
  
  // Download valid PDF
  doc.save(`${invoice.invoiceNo}.pdf`);
};

export const generateEInvoicePdf = (invoice: any) => {
  const doc = new jsPDF();
  applyEInvoiceTemplate(doc, invoice);
  doc.save(`INV-${invoice.invoiceNo.replace(/\//g, '-')}.pdf`);
};

export const generateEWayBillPdf = (invoice: any) => {
  const doc = new jsPDF();
  applyEWayBillTemplate(doc, invoice);
  doc.save(`EWB-${invoice.ewbNumber}.pdf`);
};
