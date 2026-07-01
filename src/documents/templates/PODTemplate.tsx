import jsPDF from 'jspdf';

export const applyPODTemplate = (doc: jsPDF, delivery: any) => {
  // Company Header / Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('PROOF OF DELIVERY (POD)', 105, 20, { align: 'center' });
  
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
  
  // Delivery Header Information
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery No:', 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(delivery.deliveryNo || 'N/A', 40, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(delivery.actualDate || '', 40, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Dispatch No:', 130, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(delivery.dispatchNo || 'N/A', 155, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Challan No:', 130, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(delivery.challanNo || '', 155, 55);

  // Customer Information section
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 63, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information', 16, 68.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${delivery.customer || ''}`, 14, 78);
  doc.text(`Contact: ${delivery.contactPerson || ''} (${delivery.mobile || ''})`, 14, 85);
  
  const splitAddress = doc.splitTextToSize(`Address: ${delivery.deliveryAddress || ''}`, 182);
  doc.text(splitAddress, 14, 92);

  // Transport & Delivery Details
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 105, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Transport & Delivery Details', 16, 110.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Transporter: ${delivery.transporter || ''}`, 14, 120);
  doc.text(`Vehicle No: ${delivery.vehicleNo || ''}`, 14, 127);
  doc.text(`Driver Name: ${delivery.driverName || 'N/A'}`, 14, 134);
  doc.text(`LR Number: ${delivery.lrNumber || 'N/A'}`, 14, 141);

  // Receiver Information
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 150, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Receiver Information (Proof of Delivery)', 16, 155.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Received By: ${delivery.podReceivedBy || 'N/A'}`, 14, 165);
  doc.text(`Designation: ${delivery.podDesignation || 'N/A'}`, 14, 172);
  doc.text(`Received Date: ${delivery.podUploadedDate || 'N/A'}`, 14, 179);
  doc.text(`Uploaded By: ${delivery.podUploadedBy || 'N/A'}`, 14, 186);

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.text('Driver Signature', 14, 250);
  doc.text('Receiver Authorized Signatory', 130, 250);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(100, 100, 100);
  doc.line(14, 245, 60, 245);
  doc.line(130, 245, 196, 245);
};

export default function PODTemplate() {
  return null;
}
