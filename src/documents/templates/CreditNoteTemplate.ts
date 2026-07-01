import { jsPDF } from 'jspdf';

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
  // Credit Note Dedicated Layout
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CREDIT NOTE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Company Info
  doc.setFont('helvetica', 'bold');
  doc.text('Pharma ERP Ltd.', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Health Avenue, Medical District', 14, 40);
  doc.text('City, State, 12345', 14, 45);
  doc.text('GSTIN: 27AABCU9603R1ZM', 14, 50);

  // Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 140, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(record.customerName, 140, 40);
  doc.text(record.customerType, 140, 45);

  // Document Info
  doc.setDrawColor(200);
  doc.line(14, 55, 196, 55);
  
  doc.text(`Credit Note No: ${record.cnNo}`, 14, 65);
  doc.text(`Date: ${record.cnDate}`, 14, 70);
  doc.text(`Original Invoice No: ${record.againstInvoiceNo}`, 14, 75);
  doc.text(`Original Invoice Date: ${record.invoiceDate}`, 14, 80);
  
  doc.text(`Type: ${record.cnType}`, 140, 65);
  doc.text(`Reason: ${record.reason}`, 140, 70);
  doc.text(`Status: ${record.status.toUpperCase()}`, 140, 75);
  
  doc.line(14, 85, 196, 85);
  
  // Amount Summary
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 14, 95);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Taxable Amount:', 14, 105);
  doc.text(`Rs. ${record.creditAmount.toFixed(2)}`, 60, 105);
  
  doc.text('GST Reversal:', 14, 115);
  doc.text(`Rs. ${record.gstAdjustment.toFixed(2)}`, 60, 115);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Credit Amount:', 14, 125);
  doc.text(`Rs. ${(record.creditAmount + record.gstAdjustment).toFixed(2)}`, 60, 125);
  
  doc.line(14, 135, 196, 135);
  
  // Remarks
  doc.setFont('helvetica', 'normal');
  doc.text(`Remarks: ${record.reason} processing - Authorized adjustment`, 14, 145);
  
  doc.text('This is a computer generated document.', 105, 280, { align: 'center' });
};
