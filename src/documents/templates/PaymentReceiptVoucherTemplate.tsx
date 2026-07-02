import { jsPDF } from 'jspdf';


// Simple number to words converter for INR
function numberToWordsINR(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numStr = num.toString();
  if (numStr.length > 9) return 'Overflow';
  const n = ('000000000' + numStr).substring(numStr.length > 9 ? numStr.length - 9 : 0).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  
  return str.trim() ? str.trim() + ' Rupees Only' : 'Zero Rupees Only';
}

export const applyPaymentReceiptVoucherTemplate = (doc: jsPDF, txn: any) => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Border around the whole page
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageWidth - (margin * 2), doc.internal.pageSize.height - (margin * 2));

  // --- Header Section ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const title = txn.type === 'Receipt' ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER';
  doc.text(title, pageWidth / 2, margin + 15, { align: 'center' });
  
  // "Original Copy" tag
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('(Original Copy)', pageWidth - margin - 5, margin + 10, { align: 'right' });

  // Divider
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

  // --- Company Details ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PHARMA ERP LTD.', margin + 5, margin + 35);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Health Avenue, Medical District', margin + 5, margin + 41);
  doc.text('Mumbai, Maharashtra 400001', margin + 5, margin + 46);
  doc.text('GSTIN: 27AADCB2230M1Z2', margin + 5, margin + 51);

  // Divider
  doc.line(margin, margin + 58, pageWidth - margin, margin + 58);

  // --- Voucher Information & Party Details ---
  // Left side
  doc.setFont('helvetica', 'bold');
  doc.text('Voucher No:', margin + 5, margin + 68);
  doc.setFont('helvetica', 'normal');
  doc.text(txn.receiptNo || '-', margin + 35, margin + 68);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin + 5, margin + 76);
  doc.setFont('helvetica', 'normal');
  doc.text(txn.date || '-', margin + 35, margin + 76);

  // Right side
  const partyLabel = txn.type === 'Receipt' ? 'Received From:' : 'Paid To:';
  doc.setFont('helvetica', 'bold');
  doc.text(partyLabel, pageWidth / 2, margin + 68);
  doc.setFont('helvetica', 'normal');
  doc.text(txn.partyName || '-', (pageWidth / 2) + 30, margin + 68);

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Ref:', pageWidth / 2, margin + 76);
  doc.setFont('helvetica', 'normal');
  doc.text(txn.invoiceRef || 'N/A', (pageWidth / 2) + 30, margin + 76);

  doc.line(margin, margin + 84, pageWidth - margin, margin + 84);

  // --- Payment Information ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', margin + 5, margin + 94);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Mode:', margin + 5, margin + 102);
  doc.setFont('helvetica', 'normal');
  doc.text(txn.mode || '-', margin + 20, margin + 102);

  if (txn.mode !== 'Cash') {
    doc.setFont('helvetica', 'bold');
    doc.text('Bank:', margin + 50, margin + 102);
    doc.setFont('helvetica', 'normal');
    doc.text(txn.bankName || 'N/A', margin + 65, margin + 102);

    doc.setFont('helvetica', 'bold');
    doc.text('Ref / UTR:', pageWidth / 2, margin + 102);
    doc.setFont('helvetica', 'normal');
    doc.text(txn.reference || 'N/A', (pageWidth / 2) + 25, margin + 102);
  }

  doc.line(margin, margin + 110, pageWidth - margin, margin + 110);

  // --- Amount Section ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount:', margin + 5, margin + 122);
  doc.setFontSize(14);
  doc.text(formatCurrency(txn.amount), margin + 30, margin + 122);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words:', margin + 5, margin + 130);
  doc.setFont('helvetica', 'italic');
  doc.text(numberToWordsINR(txn.amount), margin + 35, margin + 130);

  doc.line(margin, margin + 138, pageWidth - margin, margin + 138);

  // --- Status & Remarks ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', margin + 5, margin + 148);
  doc.setFont('helvetica', 'normal');
  doc.text(txn.status || 'Completed', margin + 20, margin + 148);

  doc.setFont('helvetica', 'bold');
  doc.text('Remarks:', margin + 5, margin + 156);
  doc.setFont('helvetica', 'normal');
  doc.text(txn.remarks || 'None', margin + 25, margin + 156);

  // --- Signature Section ---
  const sigY = margin + 200;
  doc.line(margin + 10, sigY, margin + 60, sigY);
  doc.text('Prepared By', margin + 20, sigY + 5);

  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin - 10, sigY);
  doc.text('Authorized Signatory', pageWidth - margin - 55, sigY + 5);

  // --- Footer Section ---
  const footerY = doc.internal.pageSize.height - margin - 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated Date & Time: ${new Date().toLocaleString()}`, margin + 5, footerY);
  doc.text('This is a computer generated document.', pageWidth - margin - 5, footerY, { align: 'right' });
};

export default function PaymentReceiptVoucherTemplate() {
  return null;
}
