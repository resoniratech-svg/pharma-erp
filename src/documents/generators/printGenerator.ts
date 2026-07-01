import jsPDF from 'jspdf';
import { applyTransportChallanTemplate } from '../templates/TransportChallanTemplate';
import { applyPaymentReceiptVoucherTemplate } from '../templates/PaymentReceiptVoucherTemplate';
import { applyProfitLossTemplate } from '../templates/ProfitLossTemplate';
import { applyBalanceSheetTemplate } from '../templates/BalanceSheetTemplate';
import { applyGstReportTemplate } from '../templates/GstReportTemplate';

export const generatePrint = (challan: any) => {
  const doc = new jsPDF();
  
  // Use the exact same layout as the PDF for consistency
  applyTransportChallanTemplate(doc, challan);
  
  // Triggers browser print dialog
  doc.autoPrint();
  
  // Use hidden iframe to bypass popup blockers
  const pdfUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = pdfUrl.toString();
  document.body.appendChild(iframe);
};

export const generateReceiptVoucherPrint = (txn: any) => {
  const doc = new jsPDF('portrait');
  
  applyPaymentReceiptVoucherTemplate(doc, txn);
  
  doc.autoPrint();
  const pdfUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = pdfUrl.toString();
  document.body.appendChild(iframe);
};

export const generateProfitLossPrint = (data: any) => {
  const doc = new jsPDF('portrait');
  applyProfitLossTemplate(doc, data);
  doc.autoPrint();
  const pdfUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = pdfUrl.toString();
  document.body.appendChild(iframe);
};

export const generateBalanceSheetPrint = (data: any) => {
  const doc = new jsPDF('portrait');
  applyBalanceSheetTemplate(doc, data);
  doc.autoPrint();
  const pdfUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = pdfUrl.toString();
  document.body.appendChild(iframe);
};

export const generateGstReportPrint = (data: any) => {
  const doc = new jsPDF('portrait');
  applyGstReportTemplate(doc, data);
  doc.autoPrint();
  const pdfUrl = doc.output('bloburl');
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = pdfUrl.toString();
  document.body.appendChild(iframe);
};
