import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export const applyGstReportTemplate = (doc: jsPDF, payload: any) => {
  const { fy, period, branch, division, data, summary } = payload;

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount);
    return `Rs. ${formatted}`;
  };

  const startY = applyDocumentHeader(doc, 'GST REPORT');
  let currentY = startY;

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`Financial Year: ${fy === 'All' ? 'Overall' : fy}`, 14, currentY);
  doc.text(`GST Period: ${period === 'All' ? 'Overall' : period}`, 14, currentY + 6);
  doc.text(`Branch: ${branch}`, 120, currentY);
  doc.text(`Division: ${division}`, 120, currentY + 6);

  // Summary Section
  currentY += 16;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Section', 14, currentY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Output GST Liability: ${formatCurrency(summary.outputGst)}`, 14, currentY + 6);
  doc.text(`Input Tax Credit: ${formatCurrency(summary.inputTaxCredit)}`, 14, currentY + 12);
  doc.text(`Net GST Payable: ${formatCurrency(summary.netGstPayable)}`, 14, currentY + 18);

  // Table Data
  const pdfTableData = data.map((row: any) => {
    return [
      row.returnType,
      row.taxPeriod,
      row.financialYear,
      formatCurrency(row.taxableValue),
      formatCurrency(row.cgst),
      formatCurrency(row.sgst),
      formatCurrency(row.igst),
      formatCurrency(row.totalGst),
      row.dueDate,
      row.filingDate || 'Not Filed',
      row.status
    ];
  });

  autoTable(doc, {
    startY: currentY + 26,
    head: [['Return Type', 'GST Period', 'Financial Year', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total GST', 'Due Date', 'Filing Date', 'Status']],
    body: pdfTableData,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 15 },
      2: { cellWidth: 15 },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 15, halign: 'right' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 15 },
      9: { cellWidth: 15 },
      10: { cellWidth: 20 },
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  applySignatureBlock(doc, finalY);
  applyDocumentFooter(doc);
};
