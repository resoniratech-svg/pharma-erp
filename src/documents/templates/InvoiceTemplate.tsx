import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROLE_SUPER_ADMIN, ROLE_DISTRIBUTOR, ROLE_RETAILER } from '../../constants/roles';

export const applyInvoiceTemplate = (doc: jsPDF, invoice: any, role: string) => {
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
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - 15, 25, { align: 'right' });

  // Reset text color for body
  doc.setTextColor(51, 65, 85);

  // Invoice Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoiceNo || '-'}`, 15, 62);
  doc.text(`Date: ${invoice.date || '-'}`, 15, 68);
  doc.text(`Due Date: ${invoice.dueDate || '-'}`, 15, 74);
  doc.text(`Status: ${invoice.status || '-'}`, 15, 80);
  if (invoice.orderNo) doc.text(`Order No: ${invoice.orderNo}`, 15, 86);

  // Bill To Section
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', pageWidth / 2, 55);
  
  doc.setFont('helvetica', 'normal');
  
  const entityName = invoice.retailer || invoice.distributor || 'Unknown Entity';
  const entityCode = invoice.retailerCode || invoice.distributorCode || 'N/A';
  const address = invoice.billingAddress || 'On Record';
  const gst = invoice.gstNumber || invoice.gstin || '27AADCB2230M1Z2';

  if (role === ROLE_SUPER_ADMIN) {
    doc.text(`Name: ${entityName}`, pageWidth / 2, 62);
    doc.text(`Code: ${entityCode}`, pageWidth / 2, 68);
    doc.text(`GSTIN: ${gst}`, pageWidth / 2, 74);
    doc.text(`Billing Address: ${address}`, pageWidth / 2, 80);
  } else if (role === ROLE_DISTRIBUTOR || role === ROLE_RETAILER) {
    doc.text(`Name: ${entityName}`, pageWidth / 2, 62);
    doc.text(`GSTIN: ${gst}`, pageWidth / 2, 68);
    doc.text(`Billing Address: ${address}`, pageWidth / 2, 74);
  } else {
    // Default fallback
    doc.text(`Customer: ${entityName}`, pageWidth / 2, 62);
    doc.text(`Billing Address: ${address}`, pageWidth / 2, 68);
  }

  // Items Table
  const tableData = invoice.items?.map((item: any, index: number) => [
    (index + 1).toString(),
    item.productName || item.description || '-',
    item.batch || item.productCode || '-',
    item.quantity?.toString() || '0',
    formatCurrency(item.unitPrice || item.rate || 0),
    `${item.gstPct || 0}%`,
    formatCurrency(item.lineAmount || item.amount || 0)
  ]) || [];

  autoTable(doc, {
    startY: 95,
    head: [['#', 'Product Description', 'Batch/Code', 'Qty', 'Unit Price', 'GST%', 'Amount']],
    body: tableData.length ? tableData : [['-', 'No items found', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    }
  });

  // Financial Summary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const summaryX = pageWidth - 70;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(formatCurrency(invoice.subtotal || 0), pageWidth - 15, finalY, { align: 'right' });

  doc.text('GST Amount:', summaryX, finalY + 7);
  doc.text(formatCurrency(invoice.gstAmount || 0), pageWidth - 15, finalY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Net Amount:', summaryX, finalY + 18);
  doc.text(formatCurrency(invoice.amount || invoice.netAmount || 0), pageWidth - 15, finalY + 18, { align: 'right' });

  // Payment Status Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const paymentY = finalY + 30;
  if (invoice.paidAmount !== undefined) {
    doc.text(`Amount Paid: ${formatCurrency(invoice.paidAmount)}`, summaryX, paymentY);
    doc.text(`Outstanding: ${formatCurrency(invoice.outstandingAmount || 0)}`, summaryX, paymentY + 7);
  }

  // Bank Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details', 15, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text('Bank: HDFC Bank Ltd', 15, finalY + 7);
  doc.text('A/C No: 502000XXXXXX', 15, finalY + 14);
  doc.text('IFSC: HDFC0001234', 15, finalY + 21);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('This is a computer generated invoice and does not require a physical signature.', pageWidth / 2, 280, { align: 'center' });
};
