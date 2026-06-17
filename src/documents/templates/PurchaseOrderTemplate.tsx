import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const applyPurchaseOrderTemplate = (doc: jsPDF, order: any) => {
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('PURCHASE ORDER', 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 25, 196, 25);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Order Number:', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(order.orderNo || '', 45, 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Distributor Name:', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(order.distributorName || '', 45, 42);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Order Date:', 130, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(order.date || '', 165, 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Date:', 130, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(order.expectedDeliveryDate || '', 165, 42);

  // Delivery Information section
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 50, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Location', 16, 55.5);

  doc.setFont('helvetica', 'normal');
  doc.text(order.deliveryLocation || '', 14, 65);

  autoTable(doc, {
    startY: 75,
    head: [['Product', 'Pack', 'PTR', 'Quantity', 'Scheme', 'Amount']],
    body: order.items ? order.items.map((i: any) => [
      i.productName,
      i.packType,
      formatCurrency(i.ptr),
      i.quantity.toString(),
      i.scheme,
      formatCurrency(i.amount)
    ]) : [],
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  const grossAmount = order.items ? order.items.reduce((sum: number, i: any) => sum + i.amount, 0) : 0;
  const schemeDiscount = order.items ? order.items.reduce((sum: number, i: any) => i.scheme === '5% Off' ? sum + (i.amount * 0.05) : sum, 0) : 0;
  const afterDiscount = grossAmount - schemeDiscount;
  const gst = afterDiscount * 0.12;
  const netAmount = afterDiscount + gst;

  const finalY = (doc as any).lastAutoTable.finalY || 75;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Gross Amount:`, 140, finalY + 10);
  doc.text(formatCurrency(grossAmount), 196, finalY + 10, { align: 'right' });
  
  doc.text(`Scheme Discount:`, 140, finalY + 17);
  doc.text(`- ${formatCurrency(schemeDiscount)}`, 196, finalY + 17, { align: 'right' });

  doc.text(`GST (12%):`, 140, finalY + 24);
  doc.text(`+ ${formatCurrency(gst)}`, 196, finalY + 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(`Net Amount:`, 140, finalY + 31);
  doc.text(formatCurrency(netAmount), 196, finalY + 31, { align: 'right' });
};

export default function PurchaseOrderTemplate() {
  return null;
}
