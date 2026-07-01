import { jsPDF } from 'jspdf';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export interface CreditNotePdfData {
  cnNo: string;
  cnDate: string;
  customerName: string;
  customerType: string;
  againstInvoiceNo: string;
  invoiceDate: string;
  cnType: string;
  reason: string;
  status: string;
  creditAmount: number;
  gstAdjustment: number;
}

export const applyCreditNoteTemplate = (doc: jsPDF, record: CreditNotePdfData) => {
  const startY = applyDocumentHeader(doc, 'CREDIT NOTE');
  let currentY = startY;

  // Customer Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(record.customerName, 14, currentY + 5);
  doc.text(record.customerType, 14, currentY + 10);

  // Document Info
  currentY += 15;
  doc.setDrawColor(200);
  doc.line(14, currentY, 196, currentY);
  
  currentY += 10;
  doc.text(`Credit Note No: ${record.cnNo}`, 14, currentY);
  doc.text(`Date: ${record.cnDate}`, 14, currentY + 5);
  doc.text(`Original Invoice No: ${record.againstInvoiceNo}`, 14, currentY + 10);
  doc.text(`Original Invoice Date: ${record.invoiceDate}`, 14, currentY + 15);
  
  doc.text(`Type: ${record.cnType}`, 140, currentY);
  doc.text(`Reason: ${record.reason}`, 140, currentY + 5);
  doc.text(`Status: ${record.status.toUpperCase()}`, 140, currentY + 10);
  
  currentY += 25;
  doc.line(14, currentY, 196, currentY);
  
  // Amount Summary
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 14, currentY);
  
  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('Taxable Amount:', 14, currentY);
  doc.text(`Rs. ${record.creditAmount.toFixed(2)}`, 60, currentY);
  
  currentY += 10;
  doc.text('GST Reversal:', 14, currentY);
  doc.text(`Rs. ${record.gstAdjustment.toFixed(2)}`, 60, currentY);
  
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Credit Amount:', 14, currentY);
  doc.text(`Rs. ${(record.creditAmount + record.gstAdjustment).toFixed(2)}`, 60, currentY);
  
  currentY += 10;
  doc.line(14, currentY, 196, currentY);
  
  // Remarks
  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Remarks: ${record.reason} processing - Authorized adjustment`, 14, currentY);
  
  applySignatureBlock(doc, currentY + 15);
  applyDocumentFooter(doc);
};
