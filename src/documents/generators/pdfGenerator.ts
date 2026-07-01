import jsPDF from 'jspdf';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
import { applyTransportChallanTemplate } from '../templates/TransportChallanTemplate';
import { applyPurchaseOrderTemplate } from '../templates/PurchaseOrderTemplate';
import { applyInvoiceTemplate } from '../templates/InvoiceTemplate';
import { applyEInvoiceTemplate } from '../templates/EInvoiceTemplate';
import { applyEWayBillTemplate } from '../templates/EWayBillTemplate';
import { applyPaymentReceiptVoucherTemplate } from '../templates/PaymentReceiptVoucherTemplate';
import { applyProfitLossTemplate } from '../templates/ProfitLossTemplate';
import { applyBalanceSheetTemplate } from '../templates/BalanceSheetTemplate';
import { applyGstReportTemplate } from '../templates/GstReportTemplate';

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

export const generateReceiptVoucherPdf = (txn: any) => {
  const doc = new jsPDF('portrait');
  applyPaymentReceiptVoucherTemplate(doc, txn);
  doc.save(`ReceiptVoucher-${txn.receiptNo}.pdf`);
};

export const generateProfitLossPdf = (data: any) => {
  const doc = new jsPDF('portrait');
  applyProfitLossTemplate(doc, data);
  doc.save(`Profit_Loss_${data.fy}.pdf`);
};

export const generateBalanceSheetPdf = (data: any) => {
  const doc = new jsPDF('portrait');
  applyBalanceSheetTemplate(doc, data);
  doc.save(`Balance_Sheet_${data.fy}.pdf`);
};

export const generateGstReportPdf = (data: any) => {
  const doc = new jsPDF('portrait');
  applyGstReportTemplate(doc, data);
  doc.save(`GST_Report_${data.fy}.pdf`);
};
