import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPng from '../../assets/logo/mj-healthcare-logo.png';

export const applyTransportChallanTemplate = (doc: jsPDF, challan: any) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // 1 & 2. Logo and Company Info (Top Left)
  try {
    doc.addImage(logoPng, 'PNG', 15, 15, 35, 16);
  } catch (e) {
    // Fallback if image fails to load
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('MJ HEALTHCARE', 15, 25);
  }

  const headerX = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('MJ HEALTH CARE', headerX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text('123 Health Avenue, Medical District', headerX, 25);
  doc.text('Mumbai, Maharashtra 400001', headerX, 29);
  doc.text('GSTIN: 27AADCMJ1234H1Z5', headerX, 33);
  doc.text('Phone: +91 98765 43210  |  Email: info@mjhealthcare.com', headerX, 37);

  // 3. Title (Centered)
  const titleY = 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.text('TRANSPORT CHALLAN', pageWidth / 2, titleY, { align: 'center' });
  
  // Decorative title underline
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.5);
  doc.line(65, titleY + 3, pageWidth / 2 - 2, titleY + 3);
  doc.line(pageWidth / 2 + 2, titleY + 3, 145, titleY + 3);
  doc.setFillColor(156, 163, 175);
  doc.circle(pageWidth / 2, titleY + 3, 0.8, 'F');

  // 4. Document Info Box
  const docInfoY = 55;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.rect(15, docInfoY, 180, 15);
  
  // Vertical dividers
  doc.line(60, docInfoY, 60, docInfoY + 15);
  doc.line(105, docInfoY, 105, docInfoY + 15);
  doc.line(150, docInfoY, 150, docInfoY + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('Challan No.', 37.5, docInfoY + 5, { align: 'center' });
  doc.text('Dispatch No.', 82.5, docInfoY + 5, { align: 'center' });
  doc.text('Challan Date', 127.5, docInfoY + 5, { align: 'center' });
  doc.text('Status', 172.5, docInfoY + 5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(challan.challanNo || 'N/A', 37.5, docInfoY + 11, { align: 'center' });
  doc.text(challan.dispatchNo || 'N/A', 82.5, docInfoY + 11, { align: 'center' });
  doc.text(challan.challanDate || 'N/A', 127.5, docInfoY + 11, { align: 'center' });
  
  // Status Badge
  const statusText = (challan.status || 'GENERATED').toUpperCase();
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  const textWidth = doc.getTextWidth(statusText);
  const pillWidth = textWidth + 8;
  doc.roundedRect(172.5 - pillWidth / 2, docInfoY + 7, pillWidth, 6, 1.5, 1.5, 'FD');
  doc.text(statusText, 172.5, docInfoY + 11.2, { align: 'center' });

  // 5. Consignor & Consignee Panels
  const panelsY = 75;
  const panelH = 40;
  
  // Consignor (Left)
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, panelsY, 87.5, panelH);
  doc.setFillColor(229, 231, 235);
  doc.rect(15, panelsY, 87.5, 8, 'F');
  doc.rect(15, panelsY, 87.5, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('CONSIGNOR (WAREHOUSE)', 18, panelsY + 5.5);

  doc.setFontSize(8);
  const leftLabelX = 18;
  const leftColonX = 48;
  const leftValueX = 51;
  const rowStart = panelsY + 14;
  const rowGap = 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Warehouse Name', leftLabelX, rowStart);
  doc.text('Warehouse Address', leftLabelX, rowStart + rowGap);
  doc.text('GSTIN', leftLabelX, rowStart + rowGap * 3);
  doc.text('Phone', leftLabelX, rowStart + rowGap * 4);

  doc.setFont('helvetica', 'normal');
  doc.text(':', leftColonX, rowStart);
  doc.text(':', leftColonX, rowStart + rowGap);
  doc.text(':', leftColonX, rowStart + rowGap * 3);
  doc.text(':', leftColonX, rowStart + rowGap * 4);

  doc.text(challan.sourceWarehouse || 'Main Warehouse', leftValueX, rowStart);
  const whAddress = doc.splitTextToSize('Industrial Area, MIDC,\nHyderabad, Telangana - 500501', 48);
  doc.text(whAddress, leftValueX, rowStart + rowGap);
  doc.text('27AADCMJ1234H1Z5', leftValueX, rowStart + rowGap * 3);
  doc.text('022-12345678', leftValueX, rowStart + rowGap * 4);

  // Consignee (Right)
  doc.setDrawColor(209, 213, 219);
  doc.rect(107.5, panelsY, 87.5, panelH);
  doc.setFillColor(229, 231, 235);
  doc.rect(107.5, panelsY, 87.5, 8, 'F');
  doc.rect(107.5, panelsY, 87.5, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('CONSIGNEE (CUSTOMER)', 110.5, panelsY + 5.5);

  doc.setFontSize(8);
  const rightLabelX = 110.5;
  const rightColonX = 135;
  const rightValueX = 138;

  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name', rightLabelX, rowStart);
  doc.text('Address', rightLabelX, rowStart + rowGap);
  doc.text('GSTIN', rightLabelX, rowStart + rowGap * 3);
  doc.text('Phone', rightLabelX, rowStart + rowGap * 4);

  doc.setFont('helvetica', 'normal');
  doc.text(':', rightColonX, rowStart);
  doc.text(':', rightColonX, rowStart + rowGap);
  doc.text(':', rightColonX, rowStart + rowGap * 3);
  doc.text(':', rightColonX, rowStart + rowGap * 4);

  doc.text(challan.customer || 'N/A', rightValueX, rowStart);
  const custAddress = challan.deliveryAddress ? doc.splitTextToSize(challan.deliveryAddress, 54) : 'On Record';
  doc.text(custAddress, rightValueX, rowStart + rowGap);
  doc.text(challan.gstNumber || 'On Record', rightValueX, rowStart + rowGap * 3);
  doc.text(challan.customerMobile || 'On Record', rightValueX, rowStart + rowGap * 4);

  // 6. Transport Information
  const transportY = 120;
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, transportY, 180, 25);
  doc.setFillColor(229, 231, 235);
  doc.rect(15, transportY, 180, 8, 'F');
  doc.rect(15, transportY, 180, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('TRANSPORT INFORMATION', 18, transportY + 5.5);

  const tRowStart = transportY + 14;
  const tRowGap = 6;
  doc.setFontSize(8);

  // Transport Col 1
  const tLeftLabel = 18;
  const tLeftColon = 40;
  const tLeftValue = 43;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Transporter', tLeftLabel, tRowStart);
  doc.text('Vehicle No.', tLeftLabel, tRowStart + tRowGap);
  doc.text('LR Number', tLeftLabel, tRowStart + tRowGap * 2);

  doc.setFont('helvetica', 'normal');
  doc.text(':', tLeftColon, tRowStart);
  doc.text(':', tLeftColon, tRowStart + tRowGap);
  doc.text(':', tLeftColon, tRowStart + tRowGap * 2);

  doc.text(challan.transporter || 'N/A', tLeftValue, tRowStart);
  doc.text(challan.vehicleNo || 'N/A', tLeftValue, tRowStart + tRowGap);
  doc.text(challan.lrNumber || 'N/A', tLeftValue, tRowStart + tRowGap * 2);

  // Transport Col 2
  const tRightLabel = 100;
  const tRightColon = 125;
  const tRightValue = 128;

  doc.setFont('helvetica', 'bold');
  doc.text('Driver Name', tRightLabel, tRowStart);
  doc.text('Driver Mobile', tRightLabel, tRowStart + tRowGap);

  doc.setFont('helvetica', 'normal');
  doc.text(':', tRightColon, tRowStart);
  doc.text(':', tRightColon, tRowStart + tRowGap);

  doc.text(challan.driverName || 'N/A', tRightValue, tRowStart);
  doc.text(challan.driverMobile || 'N/A', tRightValue, tRowStart + tRowGap);

  // 7. Product Details Table
  const productY = 150;
  doc.setDrawColor(209, 213, 219);
  doc.setFillColor(229, 231, 235);
  doc.rect(15, productY, 180, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('PRODUCT DETAILS', 18, productY + 5.5);

  const tableData: any[] = challan.products ? challan.products.map((p: any, i: number) => [
    (i + 1).toString(),
    p.productName,
    p.batchNo,
    p.dispatchQty?.toString() || '0',
    'Nos'
  ]) : [];

  // Add Total Quantity row spanning columns
  tableData.push([
    { content: 'Total Quantity', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 255, 255] } },
    { content: challan.totalQty?.toString() || '0', styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } },
    { content: '', styles: { fillColor: [255, 255, 255] } }
  ]);

  autoTable(doc, {
    startY: productY + 8,
    margin: { left: 15, right: 15 },
    tableWidth: 180,
    head: [['S. No.', 'Product Name', 'Batch Number', 'Quantity', 'Unit']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [31, 41, 55],
      fontStyle: 'bold',
      lineColor: [209, 213, 219],
      lineWidth: 0.3,
      halign: 'center'
    },
    bodyStyles: {
      lineColor: [209, 213, 219],
      lineWidth: 0.3,
      textColor: [55, 65, 81],
      fontSize: 8,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 70, halign: 'left' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' }
    }
  });

  // 8. Terms & Conditions
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  const termsY = finalY;
  
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, termsY, 180, 30);
  doc.setFillColor(229, 231, 235);
  doc.rect(15, termsY, 180, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('TERMS & CONDITIONS', 18, termsY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  const tcLines = [
    '1. Goods once dispatched cannot be returned or exchanged without prior authorization.',
    '2. The transport company is responsible for the safe delivery of goods.',
    '3. Any discrepancies should be reported within 24 hours of receipt.',
    '4. Subject to local jurisdiction only.'
  ];
  tcLines.forEach((line, index) => {
    doc.text(line, 18, termsY + 13 + (index * 5));
  });

  // 9. Signatures Box
  const sigY = termsY + 35;
  doc.setDrawColor(209, 213, 219);
  doc.rect(15, sigY, 180, 25);
  
  const centers = [15 + 22.5, 15 + 67.5, 15 + 112.5, 15 + 157.5];
  const labels = ['Prepared By', 'Checked By', 'Receiver Signature', 'Authorized Signatory'];
  
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(156, 163, 175);
  
  centers.forEach((cx, i) => {
    doc.line(cx - 15, sigY + 15, cx + 15, sigY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(31, 41, 55);
    doc.text(labels[i], cx, sigY + 20, { align: 'center' });
  });
  
  // Reset dash pattern for subsequent PDF generations
  doc.setLineDashPattern([], 0);
};

export default function TransportChallanTemplate() {
  return null;
}