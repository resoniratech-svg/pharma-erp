import { jsPDF } from 'jspdf';

export const applySignatureBlock = (doc: jsPDF, currentY: number) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Ensure enough space for signature block, else add page
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }
  
  const startY = currentY + 30; // Leave vertical space for signing
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  
  const colWidth = (pageWidth - 30) / 4;
  
  // Line 1: Prepared By
  doc.line(15, startY - 5, 15 + colWidth - 10, startY - 5);
  doc.text('Prepared By', 15 + (colWidth - 10) / 2, startY, { align: 'center' });
  
  // Line 2: Checked By
  doc.line(15 + colWidth, startY - 5, 15 + 2 * colWidth - 10, startY - 5);
  doc.text('Checked By', 15 + colWidth + (colWidth - 10) / 2, startY, { align: 'center' });
  
  // Line 3: Receiver Signature
  doc.line(15 + 2 * colWidth, startY - 5, 15 + 3 * colWidth - 10, startY - 5);
  doc.text('Receiver Signature', 15 + 2 * colWidth + (colWidth - 10) / 2, startY, { align: 'center' });
  
  // Line 4: Authorized Signatory
  doc.line(15 + 3 * colWidth, startY - 5, pageWidth - 15, startY - 5);
  doc.text('Authorized Signatory', 15 + 3 * colWidth + (colWidth - 10) / 2, startY, { align: 'center' });
  
  return startY + 10;
};
