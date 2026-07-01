import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const applyProfitLossTemplate = (doc: jsPDF, data: any) => {
  const { fy, periodType, fromDate, toDate, branch, division, drItems, crItems } = data;

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

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pharma ERP Pvt. Ltd.`, 14, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Profit & Loss Statement`, 14, 22);

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Financial Year: ${fy}`, 14, 30);
  doc.text(`Period: ${fromDate} to ${toDate} (${periodType})`, 14, 35);
  doc.text(`Branch: ${branch}`, 110, 30);
  doc.text(`Division: ${division}`, 110, 35);

  // KPI Summary
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary:', 14, 45);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Revenue: Rs. 2,20,50,000`, 14, 52);
  doc.text(`Gross Profit: Rs. 65,10,000`, 110, 52);
  doc.text(`Net Profit: Rs. 18,30,000`, 14, 59);
  doc.text(`Net Profit Margin: 8.3%`, 110, 59);

  // Table Data
  const pdfTableData = drItems.map((dr: any, i: number) => {
    const cr = crItems[i] || { name: '', current: 0, previous: 0 };
    return [
      dr.name, formatCurrency(dr.current), formatCurrency(dr.previous),
      cr.name, formatCurrency(cr.current), formatCurrency(cr.previous)
    ];
  });

  (doc as any).autoTable({
    startY: 65,
    head: [['Particulars (Dr.)', 'Current', 'Previous', 'Particulars (Cr.)', 'Current', 'Previous']],
    body: pdfTableData,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 35 },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
    }
  });
};
