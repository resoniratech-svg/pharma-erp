import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const applyProfitLossTemplate = (doc: jsPDF, data: any) => {
  const { fy, periodType, fromDate, toDate, branch, division, drItems, crItems } = data;

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(absAmount);
    return isNegative ? `(Rs. ${formatted})` : `Rs. ${formatted}`;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 60, 120);
  doc.text('MJ HEALTHCARE ERP', 14, 18);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(`Profit & Loss Statement`, 14, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`FY: ${fy || '2026-27'} | Period: ${fromDate || '01/04/2026'} to ${toDate || '31/03/2027'} (${periodType || 'Annual'}) | Branch: ${branch || 'All Branches'} | Division: ${division || 'All Divisions'}`, 14, 31);

  // Table Data
  const pdfTableData = drItems.map((dr: any, i: number) => {
    const cr = crItems[i] || { name: '', current: 0, previous: 0 };
    return [
      dr.name, formatCurrency(dr.current), formatCurrency(dr.previous),
      cr.name, formatCurrency(cr.current), formatCurrency(cr.previous)
    ];
  });

  autoTable(doc, {
    startY: 36,
    head: [['Particulars (Dr.)', 'Current', 'Previous', 'Particulars (Cr.)', 'Current', 'Previous']],
    body: pdfTableData,
    theme: 'grid',
    headStyles: { fillColor: [22, 60, 120], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 45 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 14, right: 14 }
  });
};
