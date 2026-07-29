import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROLE_SUPER_ADMIN, ROLE_RETAILER } from '../../constants/roles';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';
import authService from '../../services/authService';

export const applyPaymentReceiptTemplate = (doc: jsPDF, receipt: any, role: string) => {
  const pageWidth = doc.internal.pageSize.width;

  const formatPdfCurrency = (amount: number) => {
    const num = Number(amount) || 0;
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
    return `Rs. ${formatted}`;
  };

  const authUser = authService.getCurrentUser();
  const retailerName = receipt.retailerName || receipt.retailer || (authUser as any)?.fullName || (authUser as any)?.name || 'Retailer Customer';
  const distributorName = receipt.distributorName || receipt.distributor || 'Metro Pharma Distributors';

  const startY = applyDocumentHeader(doc, 'PAYMENT RECEIPT');
  let currentY = startY;

  // Reset text color for body
  doc.setTextColor(51, 65, 85);

  // Receipt Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Details:', 15, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${receipt.receiptNo || 'TXN-001'}`, 15, currentY + 7);
  doc.text(`Payment Date: ${receipt.date || '16-Oct-2026'}`, 15, currentY + 13);
  doc.text(`Payment Status: ${receipt.status || 'Completed'}`, 15, currentY + 19);
  doc.text(`Paid To (Distributor): ${distributorName}`, 15, currentY + 25);

  // Retailer / Received From Section
  doc.setFont('helvetica', 'bold');
  doc.text('Received From (Retailer):', pageWidth / 2, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Retailer Name: ${retailerName}`, pageWidth / 2, currentY + 7);
  doc.text(`Retailer Code: ${receipt.retailerCode || (authUser as any)?.linkedRetailerCode || 'RET-001'}`, pageWidth / 2, currentY + 13);
  doc.text(`Billing Address: ${receipt.billingAddress || 'Main Road, Hyderabad'}`, pageWidth / 2, currentY + 19);
  doc.text(`GSTIN: ${receipt.gstin || '36AAACR2020K1Z9'}`, pageWidth / 2, currentY + 25);

  // Payment Details Table
  const modeVal = receipt.mode || receipt.paymentMode || 'Bank Transfer';
  const bankVal = receipt.bankName || receipt.bank || 'HDFC Bank';
  const refVal = receipt.txnReference || receipt.referenceNo || receipt.txnId || receipt.receiptNo || 'TXN-REF-8849';
  const paidAmt = receipt.amount || receipt.amountPaid || 15000;

  autoTable(doc, {
    startY: currentY + 33,
    head: [['Payment Mode', 'Bank Name', 'Txn Reference', 'Amount Paid']],
    body: [
      [modeVal, bankVal, refVal, formatPdfCurrency(paidAmt)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [22, 60, 120], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Invoice Details Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Invoice Allocation:', 15, currentY);

  const invNo = receipt.invoiceNo || 'ORD-RET-5005';
  const invAmt = receipt.invoiceAmount || receipt.amount || paidAmt;
  const outBefore = receipt.outstandingBefore || receipt.amount || paidAmt;
  const outAfter = receipt.outstandingAfter !== undefined ? receipt.outstandingAfter : Math.max(0, outBefore - paidAmt);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Invoice Number', 'Invoice Amount', 'Outstanding Before', 'Outstanding After']],
    body: [
      [
        invNo, 
        formatPdfCurrency(invAmt), 
        formatPdfCurrency(outBefore), 
        formatPdfCurrency(outAfter)
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  applySignatureBlock(doc, finalY + 10);
  applyDocumentFooter(doc);
};
