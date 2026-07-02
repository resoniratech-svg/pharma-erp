import { jsPDF } from 'jspdf';

export const applyEWayBillTemplate = (doc: jsPDF, invoice: any) => {
  const pageWidth = doc.internal.pageSize.width;

  
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
  doc.text('E-WAY BILL', pageWidth - 15, 25, { align: 'right' });

  // Reset text color for body
  doc.setTextColor(51, 65, 85);

  // Invoice Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoiceNo || '-'}`, 15, 62);
  doc.text(`Date: ${invoice.invoiceDate || '-'}`, 15, 68);
  doc.text(`Customer: ${invoice.customerName || 'Unknown Entity'}`, 15, 74);
  doc.text(`GSTIN: ${invoice.gstin || 'N/A'}`, 15, 80);

  // E-Way Bill Details Section
  doc.setFont('helvetica', 'bold');
  doc.text('E-Way Bill Details:', pageWidth / 2, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`E-Way Bill No: ${invoice.ewbNumber || '-'}`, pageWidth / 2, 62);
  doc.text(`Generated Date: ${invoice.generatedDate || '-'}`, pageWidth / 2, 68);
  doc.text(`Valid From: ${invoice.validFrom || '-'}`, pageWidth / 2, 74);
  doc.text(`Valid Till: ${invoice.validTill || '-'}`, pageWidth / 2, 80);

  // Transport Details
  doc.setFont('helvetica', 'bold');
  doc.text('Transport Details:', 15, 95);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Transporter: ${invoice.transporter || '-'}`, 15, 102);
  doc.text(`Transporter GSTIN: ${invoice.transporterGstin || '-'}`, 15, 108);
  doc.text(`Vehicle Number: ${invoice.vehicleNo || '-'}`, 15, 114);
  doc.text(`Transport Mode: ${invoice.transportMode || '-'}`, 15, 120);

  // Route Details
  doc.setFont('helvetica', 'bold');
  doc.text('Route Details:', pageWidth / 2, 95);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Source: ${invoice.sourceLocation || '-'}`, pageWidth / 2, 102);
  doc.text(`Destination: ${invoice.destinationLocation || '-'}`, pageWidth / 2, 108);
  doc.text(`Distance: ${invoice.distance || '-'}`, pageWidth / 2, 114);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('This is a computer generated e-way bill and does not require a physical signature.', pageWidth / 2, 280, { align: 'center' });
};
