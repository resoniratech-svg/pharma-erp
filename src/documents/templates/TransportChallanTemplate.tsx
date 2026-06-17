import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const applyTransportChallanTemplate = (doc: jsPDF, challan: any) => {
  // Company Header / Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('TRANSPORT CHALLAN', 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 25, 196, 25);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Challan No:', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.challanNo || '', 40, 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Dispatch No:', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.dispatchNo || 'N/A', 40, 42);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 130, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.challanDate || '', 145, 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 130, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.status || '', 145, 42);

  // Customer Information section
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 50, 85, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information', 16, 55.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${challan.customer || ''}`, 14, 65);
  doc.text(`Contact: ${challan.customerContactPerson || ''} (${challan.customerMobile || ''})`, 14, 72);
  
  const splitAddress = doc.splitTextToSize(`Address: ${challan.deliveryAddress || ''}`, 85);
  doc.text(splitAddress, 14, 79);

  // Transport Information section
  doc.setFillColor(245, 245, 245);
  doc.rect(110, 50, 86, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Transport Information', 112, 55.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Transporter: ${challan.transporter || ''}`, 110, 65);
  doc.text(`Vehicle No: ${challan.vehicleNo || ''}`, 110, 72);
  doc.text(`Driver Name: ${challan.driverName || 'N/A'}`, 110, 79);
  doc.text(`LR Number: ${challan.lrNumber || 'N/A'}`, 110, 86);

  // Product Details Table
  autoTable(doc, {
    startY: 100,
    head: [['S.No', 'Product Name', 'Batch Number', 'Quantity']],
    body: challan.products ? challan.products.map((p: any, i: number) => [
      (i + 1).toString(),
      p.productName,
      p.batchNo,
      p.dispatchQty.toString()
    ]) : [],
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 40 },
      3: { cellWidth: 25, halign: 'right' }
    }
  });

  // Footer / Totals
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Quantity:', 140, finalY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(challan.totalQty?.toString() || '0', 180, finalY + 10, { align: 'right' });

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory', 14, finalY + 40);
  doc.text('Receiver Signature', 150, finalY + 40);
};

// Default export to maintain the template architecture pattern
export default function TransportChallanTemplate() {
  return null;
}
