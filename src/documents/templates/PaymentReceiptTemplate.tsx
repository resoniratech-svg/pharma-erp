import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROLE_SUPER_ADMIN, ROLE_RETAILER } from '../../constants/roles';

export const applyPaymentReceiptTemplate = (doc: jsPDF, receipt: any, role: string) => {
  const pageWidth = doc.internal.pageSize.width;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Header Background
  doc.setFillColor(124, 58, 237); // violet-600
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company Details (White Text)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PHARMA ERP', 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Health Avenue, Medical District', 15, 28);
  doc.text('Mumbai, Maharashtra 400001', 15, 34);

  // Document Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', pageWidth - 15, 25, { align: 'right' });

  // Reset text color for body
  doc.setTextColor(51, 65, 85);

  // Receipt Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Details:', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${receipt.receiptNo}`, 15, 62);
  doc.text(`Date: ${receipt.date}`, 15, 68);
  doc.text(`Status: ${receipt.status}`, 15, 74);

  // Retailer / Billed To Section
  doc.setFont('helvetica', 'bold');
  doc.text('Received From:', pageWidth / 2, 55);
  
  doc.setFont('helvetica', 'normal');
  
  if (role === ROLE_SUPER_ADMIN) {
    doc.text(`Retailer Name: ${receipt.retailer || 'Unknown'}`, pageWidth / 2, 62);
    doc.text(`Retailer Code: ${receipt.retailerCode || 'N/A'}`, pageWidth / 2, 68);
  } else if (role === ROLE_RETAILER) {
    doc.text(`Retailer Name: ${receipt.retailer || 'Self'}`, pageWidth / 2, 62);
  } else {
    // Default fallback
    doc.text(`Customer: ${receipt.retailer || 'Unknown'}`, pageWidth / 2, 62);
  }
  
  // Billing Address & GST (Simulated data as requested by the template structure)
  doc.text('Billing Address: On Record', pageWidth / 2, role === ROLE_SUPER_ADMIN ? 74 : 68);
  doc.text('GSTIN: 27AADCR2020K1Z9', pageWidth / 2, role === ROLE_SUPER_ADMIN ? 80 : 74);

  // Payment Details Table
  autoTable(doc, {
    startY: 95,
    head: [['Payment Mode', 'Bank Name', 'Txn Reference', 'Amount Paid']],
    body: [
      [receipt.mode || '-', receipt.bankName || '-', receipt.txnReference || '-', formatCurrency(receipt.amount || 0)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 6 }
  });

  const currentY = (doc as any).lastAutoTable.finalY + 15;

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

  // Signatures / Final Text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory', pageWidth - 15, finalY + 15, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('This is a computer generated receipt and does not require a physical signature.', pageWidth / 2, 280, { align: 'center' });
};
