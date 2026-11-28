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
  originalAmount?: number;
  amountSettled?: number;
  remarks?: string;
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
  
  doc.text(`Type: ${record.cnType}`, 130, currentY);
  doc.text(`Reason: ${record.reason}`, 130, currentY + 5);
  doc.text(`Status: ${record.status.toUpperCase()}`, 130, currentY + 10);
  
  currentY += 25;
  doc.line(14, currentY, 196, currentY);
  
  // Amount Summary
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 14, currentY);
  
  const isSettled = record.status.toUpperCase() === 'SETTLED' || record.status.toUpperCase() === 'PAID';
  const finalSettled = record.amountSettled && record.amountSettled > 0 ? record.amountSettled : record.creditAmount;
  const originalClaim = record.originalAmount && record.originalAmount > 0 
    ? record.originalAmount 
    : Math.max(record.creditAmount, finalSettled);
  const deductionLoss = Math.max(0, originalClaim - finalSettled);

  currentY += 10;
  doc.setFont('helvetica', 'normal');

  if (isSettled && (deductionLoss > 0.01 || record.amountSettled)) {
    const recoveryPct = originalClaim > 0 ? Math.round((finalSettled / originalClaim) * 100) : 100;
    
    doc.text('Original Billed Total:', 14, currentY);
    doc.text(`Rs. ${originalClaim.toFixed(2)}`, 85, currentY);
    
    currentY += 8;
    doc.text('Recovery Policy Applied:', 14, currentY);
    doc.text(`${recoveryPct}% Approved Credit`, 85, currentY);
    
    currentY += 8;
    doc.text('Policy Deduction / Scrap Loss:', 14, currentY);
    doc.text(`- Rs. ${deductionLoss.toFixed(2)}`, 85, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Final Approved Credit (Settled):', 14, currentY);
    doc.text(`Rs. ${finalSettled.toFixed(2)}`, 85, currentY);
  } else {
    doc.text('Taxable Amount:', 14, currentY);
    doc.text(`Rs. ${record.creditAmount.toFixed(2)}`, 85, currentY);
    
    currentY += 8;
    doc.text('GST Adjustment / Reversal:', 14, currentY);
    doc.text(`Rs. ${record.gstAdjustment.toFixed(2)}`, 85, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Credit Amount:', 14, currentY);
    doc.text(`Rs. ${finalSettled.toFixed(2)}`, 85, currentY);
  }
  
  currentY += 10;
  doc.setDrawColor(200);
  doc.line(14, currentY, 196, currentY);
  
  // Remarks
  currentY += 10;
  doc.setFont('helvetica', 'normal');
  const remarksText = record.remarks || `${record.reason} processing - Authorized adjustment`;
  doc.text(`Remarks: ${remarksText}`, 14, currentY);
  
  applySignatureBlock(doc, currentY + 15);
  applyDocumentFooter(doc);
};
