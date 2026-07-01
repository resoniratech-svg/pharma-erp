import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const applyEInvoiceTemplate = (doc: jsPDF, invoice: any) => {
  const pageWidth = doc.internal.pageSize.width;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
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
  doc.text('E-INVOICE', pageWidth - 15, 25, { align: 'right' });

  // Reset text color for body
  doc.setTextColor(51, 65, 85);

  // Invoice Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoiceNo || '-'}`, 15, 62);
  doc.text(`Date: ${invoice.invoiceDate || '-'}`, 15, 68);
  if (invoice.orderNo) doc.text(`Order No: ${invoice.orderNo}`, 15, 74);

  // E-Invoice Details Section
  doc.setFont('helvetica', 'bold');
  doc.text('E-Invoice Details:', pageWidth / 2, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const irnParts = invoice.irnNumber?.match(/.{1,35}/g) || ['-'];
  doc.text(`IRN: ${irnParts[0]}`, pageWidth / 2, 62);
  if (irnParts[1]) doc.text(`${irnParts[1]}`, pageWidth / 2, 66);
  
  doc.setFontSize(10);
  doc.text(`Ack No: ${invoice.ackNo || '-'}`, pageWidth / 2, 74);
  doc.text(`Ack Date: ${invoice.ackDate || '-'}`, pageWidth / 2, 80);

  // Bill To Section
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, 90);
  
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Customer: ${invoice.customerName || 'Unknown Entity'}`, 15, 97);
  doc.text(`GSTIN: ${invoice.gstin || 'N/A'}`, 15, 103);

  // Items Table
  autoTable(doc, {
    startY: 115,
    head: [['Product Description', 'Taxable Amt', 'GST Amt', 'Total Amount']],
    body: [
      ['Consolidated Products', formatCurrency(invoice.taxableAmount || 0), formatCurrency(invoice.gstAmount || 0), formatCurrency(invoice.invoiceValue || 0)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('This is a computer generated e-invoice and does not require a physical signature.', pageWidth / 2, 280, { align: 'center' });
};
