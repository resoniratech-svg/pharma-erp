import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROLE_SUPER_ADMIN, ROLE_RETAILER } from '../../constants/roles';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export const applyPaymentReceiptTemplate = (doc: jsPDF, receipt: any, role: string) => {
  const pageWidth = doc.internal.pageSize.width;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const startY = applyDocumentHeader(doc, 'PAYMENT RECEIPT');
  let currentY = startY;

  // Reset text color for body
  doc.setTextColor(51, 65, 85);

  // Receipt Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Details:', 15, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${receipt.receiptNo}`, 15, currentY + 7);
  doc.text(`Date: ${receipt.date}`, 15, currentY + 13);
  doc.text(`Status: ${receipt.status}`, 15, currentY + 19);

  // Retailer / Billed To Section
  doc.setFont('helvetica', 'bold');
  doc.text('Received From:', pageWidth / 2, currentY);
  
  doc.setFont('helvetica', 'normal');
  
  if (role === ROLE_SUPER_ADMIN) {
    doc.text(`Retailer Name: ${receipt.retailer || 'Unknown'}`, pageWidth / 2, currentY + 7);
    doc.text(`Retailer Code: ${receipt.retailerCode || 'N/A'}`, pageWidth / 2, currentY + 13);
  } else if (role === ROLE_RETAILER) {
    doc.text(`Retailer Name: ${receipt.retailer || 'Self'}`, pageWidth / 2, currentY + 7);
  } else {
    // Default fallback
    doc.text(`Customer: ${receipt.retailer || 'Unknown'}`, pageWidth / 2, currentY + 7);
  }
  
  // Billing Address & GST (Simulated data as requested by the template structure)
  doc.text('Billing Address: On Record', pageWidth / 2, role === ROLE_SUPER_ADMIN ? currentY + 19 : currentY + 13);
  doc.text('GSTIN: 27AADCR2020K1Z9', pageWidth / 2, role === ROLE_SUPER_ADMIN ? currentY + 25 : currentY + 19);

  // Payment Details Table
  autoTable(doc, {
    startY: currentY + 35,
    head: [['Payment Mode', 'Bank Name', 'Txn Reference', 'Amount Paid']],
    body: [
      [receipt.mode || '-', receipt.bankName || '-', receipt.txnReference || '-', formatCurrency(receipt.amount || 0)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 6 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Invoice Details Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Allocation:', 15, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Invoice Number', 'Invoice Amount', 'Outstanding Before', 'Outstanding After']],
    body: [
      [
        receipt.invoiceNo || '-', 
        formatCurrency(receipt.invoiceAmount || 0), 
        formatCurrency(receipt.outstandingBefore || 0), 
        formatCurrency(receipt.outstandingAfter || 0)
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  applySignatureBlock(doc, finalY + 15);
  applyDocumentFooter(doc);
};
