import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export const applyLRTemplate = (doc: jsPDF, challan: any) => {
  const startY = applyDocumentHeader(doc, 'LORRY RECEIPT');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const currentY = startY;

  // LR & Dispatch Header Information
  doc.setFont('helvetica', 'bold');
  doc.text('LR Number:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.lrNumber || 'N/A', 40, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('LR Date:', 14, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.challanDate || '', 40, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Dispatch No:', 130, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.dispatchNo || 'N/A', 155, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Challan No:', 130, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.challanNo || '', 155, currentY + 7);

  // Consignee Information section
  const sectionY = currentY + 15;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, sectionY, 85, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Consignee (Customer) Information', 16, sectionY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${challan.customer || ''}`, 14, sectionY + 15);
  doc.text(`Contact: ${challan.customerContactPerson || ''} (${challan.customerMobile || ''})`, 14, sectionY + 22);
  
  const splitAddress = doc.splitTextToSize(`Address: ${challan.deliveryAddress || ''}`, 85);
  doc.text(splitAddress, 14, sectionY + 29);

  // Transport Information section
  doc.setFillColor(245, 245, 245);
  doc.rect(110, sectionY, 86, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Transport Information', 112, sectionY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Transporter: ${challan.transporter || ''}`, 110, sectionY + 15);
  doc.text(`Vehicle No: ${challan.vehicleNo || ''}`, 110, sectionY + 22);
  doc.text(`Driver Name: ${challan.driverName || 'N/A'}`, 110, sectionY + 29);
  doc.text(`Driver Mobile: ${challan.driverMobile || 'N/A'}`, 110, sectionY + 36);

  // Product Details Table
  autoTable(doc, {
    startY: sectionY + 52,
    head: [['S.No', 'Product Name', 'Batch', 'Qty']],
    body: challan.products ? challan.products.map((p: any, i: number) => [
      (i + 1).toString(),
      p.productName,
      p.batchNo,
      p.dispatchQty.toString()
    ]) : [],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 40 },
      3: { cellWidth: 25, halign: 'right' }
    }
  });

  // Footer / Totals
  const finalY = (doc as any).lastAutoTable.finalY || sectionY + 52;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Packages:', 14, finalY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.noOfPackages?.toString() || '0', 45, finalY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Weight:', 14, finalY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.totalWeight?.toString() || 'N/A', 45, finalY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Quantity:', 140, finalY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.totalQty?.toString() || '0', 180, finalY + 10, { align: 'right' });

  // Signatures & Footer
  applySignatureBlock(doc, finalY + 25);
  applyDocumentFooter(doc);
};

// Default export to maintain the template architecture pattern
export default function LRTemplate() {
  return null;
}
