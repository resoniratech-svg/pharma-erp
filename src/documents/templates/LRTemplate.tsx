import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const applyLRTemplate = (doc: jsPDF, challan: any) => {
  // Company Header / Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('LORRY RECEIPT', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Pharma ERP Company', 105, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('123 Corporate Ave, Mumbai, India | GSTIN: 27AABCU9603R1ZX', 105, 34, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 38, 196, 38);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // LR & Dispatch Header Information
  doc.setFont('helvetica', 'bold');
  doc.text('LR Number:', 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.lrNumber || 'N/A', 40, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('LR Date:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.challanDate || '', 40, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Dispatch No:', 130, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.dispatchNo || 'N/A', 155, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Challan No:', 130, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.challanNo || '', 155, 55);

  // Consignee Information section
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 63, 85, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Consignee (Customer) Information', 16, 68.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${challan.customer || ''}`, 14, 78);
  doc.text(`Contact: ${challan.customerContactPerson || ''} (${challan.customerMobile || ''})`, 14, 85);
  
  const splitAddress = doc.splitTextToSize(`Address: ${challan.deliveryAddress || ''}`, 85);
  doc.text(splitAddress, 14, 92);

  // Transport Information section
  doc.setFillColor(245, 245, 245);
  doc.rect(110, 63, 86, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Transport Information', 112, 68.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Transporter: ${challan.transporter || ''}`, 110, 78);
  doc.text(`Vehicle No: ${challan.vehicleNo || ''}`, 110, 85);
  doc.text(`Driver Name: ${challan.driverName || 'N/A'}`, 110, 92);
  doc.text(`Driver Mobile: ${challan.driverMobile || 'N/A'}`, 110, 99);

  // Product Details Table
  autoTable(doc, {
    startY: 115,
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
  const finalY = (doc as any).lastAutoTable.finalY || 115;
  
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

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.text('For Transporter', 14, finalY + 45);
  doc.text('Consignee Signature', 150, finalY + 45);
};

// Default export to maintain the template architecture pattern
export default function LRTemplate() {
  return null;
}
