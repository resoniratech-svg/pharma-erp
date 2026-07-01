import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export const applyBalanceSheetTemplate = (doc: jsPDF, data: any) => {
  const { fy, asOnDate, branch, division, liabilitiesItems, assetsItems } = data;

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(absAmount);
    return isNegative ? `(${formatted})` : formatted;
  };

  const startY = applyDocumentHeader(doc, 'BALANCE SHEET');
  const currentY = startY;

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Financial Year: ${fy}`, 14, currentY);
  doc.text(`As On: ${asOnDate}`, 14, currentY + 5);
  doc.text(`Branch: ${branch}`, 110, currentY);
  doc.text(`Division: ${division}`, 110, currentY + 5);

  // Table Data
  const pdfTableData = liabilitiesItems.map((liab: any, i: number) => {
    const asset = assetsItems[i] || { name: '', amount: 0 };
    return [
      liab.name, liab.name ? formatCurrency(liab.amount) : '',
      asset.name, asset.name ? formatCurrency(asset.amount) : ''
    ];
  });

  (doc as any).autoTable({
    startY: currentY + 15,
    head: [['Liabilities', 'Amount (Rs)', 'Assets', 'Amount (Rs)']],
    body: pdfTableData,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 4, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 55 },
      3: { cellWidth: 35, halign: 'right' },
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  applySignatureBlock(doc, finalY);
  applyDocumentFooter(doc);
};
