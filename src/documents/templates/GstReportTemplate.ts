import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const applyGstReportTemplate = (doc: jsPDF, payload: any) => {
  const { fy, period, branch, division, data, summary } = payload;

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount);
    return `Rs. ${formatted}`;
  };

  const currentDate = new Date().toLocaleString();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Name: Pharma ERP Pvt. Ltd.', 14, 15);
  
  doc.setFontSize(14);
  doc.text('GST Reports', 14, 23);

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`Generated Date & Time: ${currentDate}`, 14, 30);
  doc.text(`Financial Year: ${fy === 'All' ? 'Overall' : fy}`, 14, 36);
  doc.text(`GST Period: ${period === 'All' ? 'Overall' : period}`, 14, 42);
  doc.text(`Branch: ${branch}`, 120, 36);
  doc.text(`Division: ${division}`, 120, 42);

  // Summary Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Section', 14, 52);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Output GST Liability: ${formatCurrency(summary.outputGst)}`, 14, 58);
  doc.text(`Input Tax Credit: ${formatCurrency(summary.inputTaxCredit)}`, 14, 64);
  doc.text(`Net GST Payable: ${formatCurrency(summary.netGstPayable)}`, 14, 70);

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
    startY: 78,
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
    },
    didDrawPage: (dataInfo: any) => {
      try {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        
        doc.text(
          'Generated from Pharma ERP',
          14,
          pageHeight - 10
        );
        doc.text(
          `Page ${dataInfo.pageNumber}`,
          pageWidth - 20,
          pageHeight - 10
        );
      } catch (err) {
        console.error('Error drawing page footer:', err);
      }
    }
  });
};
