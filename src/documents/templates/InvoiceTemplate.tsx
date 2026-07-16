import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROLE_SUPER_ADMIN, ROLE_DISTRIBUTOR, ROLE_RETAILER } from '../../constants/roles';

export const applyInvoiceTemplate = (doc: jsPDF, invoice: any, role: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Formatters
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const numberToWords = (num: number): string => {
    return "Rupees " + formatCurrency(num) + " Only"; // Fallback if no specific words provided
  };

  const amountInWords = invoice.amountInWords || numberToWords(invoice.grandTotal || invoice.amount || invoice.netAmount || 0);

  // Colors
  const primaryBlue: [number, number, number] = [22, 60, 120]; // #163C78
  const darkGray: [number, number, number] = [51, 65, 85]; // slate-700
  const black: [number, number, number] = [15, 23, 42]; // slate-900
  const lightGray: [number, number, number] = [241, 245, 249]; // slate-100

  // --- HEADER SECTION ---
  let currentY = 15;
  
  doc.setFontSize(20);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('MJ Healthcare', 15, currentY);
  
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'italic');
  doc.text('Care. Innovate. Cure.', 15, currentY + 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Registered Office: 123 Healthcare Avenue, Mumbai, 400001', 15, currentY + 11);
  doc.text('GSTIN: 27AADCM1234N1Z1 | PAN: AADCM1234N | DL No: 20B/MH-MZ/123456', 15, currentY + 15);
  doc.text('Ph: +91 9876543210 | Email: info@mjhealthcare.in | Web: www.mjhealthcare.in', 15, currentY + 19);

  // TAX INVOICE Title (Center/Right aligned)
  doc.setFontSize(16);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - 15, currentY + 3, { align: 'right' });
  
  // Invoice Details Box (Top Right)
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', pageWidth - 70, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNo || '-', pageWidth - 15, currentY + 10, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - 70, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.date || '-', pageWidth - 15, currentY + 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', pageWidth - 70, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.dueDate || '-', pageWidth - 15, currentY + 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Order No:', pageWidth - 70, currentY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.orderNo || '-', pageWidth - 15, currentY + 25, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Dispatch No:', pageWidth - 70, currentY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.dispatchNo || '-', pageWidth - 15, currentY + 30, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Terms:', pageWidth - 70, currentY + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.paymentTerms || '30 Days Credit', pageWidth - 15, currentY + 35, { align: 'right' });

  // Divider
  currentY += 40;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);
  
  currentY += 6;

  // --- ROLE BASED RESOLUTION ---
  let billToName = '';
  let billToCode = '';
  let billToAddress = '';
  let billToGst = '';
  let billToDl = '';

  const rName = invoice.retailer?.name || invoice.retailerName || invoice.retailer || '';
  const rCode = invoice.retailer?.code || invoice.retailerCode || '';
  const rAdd = invoice.retailer?.billingAddress || invoice.billingAddress || '';
  
  const dName = invoice.distributor?.name || invoice.distributorName || invoice.distributor || '';
  const dCode = invoice.distributor?.code || invoice.distributorCode || '';
  const dAdd = 'Distributor Address On Record';
  const dGst = '27DISTGST1234Z';

  if (role === ROLE_SUPER_ADMIN) {
    // Admin bills the distributor
    billToName = dName || 'Unknown Distributor';
    billToCode = dCode;
    billToAddress = dAdd;
    billToGst = dGst;
    billToDl = invoice.buyerDl || '20B/DIST/999';
  } else {
    // Distributor bills the retailer OR Retailer views their own bill
    billToName = rName || 'Unknown Retailer';
    billToCode = rCode;
    billToAddress = rAdd;
    billToGst = invoice.buyerGst || invoice.gstNumber || invoice.gstin || '27RETGST1234Z';
    billToDl = invoice.buyerDl || '20B/RET/888';
  }

  // --- BILL TO & TRANSPORT GRID ---
  doc.setFontSize(10);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 15, currentY);
  doc.text('TRANSPORT DETAILS:', pageWidth / 2, currentY);

  currentY += 6;
  doc.setFontSize(9);
  doc.setTextColor(...black);
  
  // Left Column: Bill To
  doc.setFont('helvetica', 'bold');
  doc.text(billToName, 15, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(billToCode ? `Account Code: ${billToCode}` : '', 15, currentY + 5);
  
  const splitAddress = doc.splitTextToSize(billToAddress || 'Address on record', (pageWidth / 2) - 25);
  doc.text(splitAddress, 15, currentY + 10);
  
  const addressHeight = splitAddress.length * 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN: ${billToGst}`, 15, currentY + 10 + addressHeight);
  doc.text(`DL No: ${billToDl}`, 15, currentY + 15 + addressHeight);

  // Right Column: Transport
  const tX = pageWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Mode:', tX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.transportMode || 'Road', tX + 25, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Company:', tX, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.transportCompany || 'Express Logistics', tX + 25, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle No:', tX, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.vehicleNo || '-', tX + 25, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('LR Number:', tX, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.lrNumber || '-', tX + 25, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Packages:', tX, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(String(invoice.packagesCount || invoice.packages || '1'), tX + 25, currentY + 20);

  currentY += 25 + addressHeight;

  // --- PRODUCT TABLE ---
  const tableData = invoice.items?.map((item: any, index: number) => [
    (index + 1).toString(),
    item.productName || item.description || '-',
    item.batchNumber || item.batch || '-',
    item.expiryDate || item.expiry || '-',
    item.hsnCode || item.hsn || '3004',
    `${item.gstPct || item.gst || 0}%`,
    item.quantity?.toString() || '0',
    item.freeQuantity?.toString() || '0',
    formatCurrency(item.unitPrice || item.ptr || item.rate || 0),
    `${item.discountPct || item.discount || 0}%`,
    formatCurrency(item.taxableAmount || item.subtotal || item.lineAmount || 0),
    formatCurrency(item.gstAmount || item.taxAmount || 0),
    formatCurrency(item.netAmount || item.amount || item.lineAmount || 0)
  ]) || [];

  autoTable(doc, {
    startY: currentY,
    head: [['S.No', 'Product Name', 'Batch', 'Expiry', 'HSN', 'GST%', 'Qty', 'Free', 'PTR', 'Dis%', 'Taxable', 'GST Amt', 'Net Amt']],
    body: tableData.length ? tableData : [['-', 'No items found', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: primaryBlue, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, textColor: darkGray, lineColor: [226, 232, 240] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // SNo
      1: { cellWidth: 'auto' }, // Name
      2: { cellWidth: 15 }, // Batch
      3: { cellWidth: 12 }, // Expiry
      4: { cellWidth: 12 }, // HSN
      5: { cellWidth: 10, halign: 'right' }, // GST%
      6: { cellWidth: 10, halign: 'right' }, // Qty
      7: { cellWidth: 10, halign: 'right' }, // Free
      8: { cellWidth: 15, halign: 'right' }, // PTR
      9: { cellWidth: 10, halign: 'right' }, // Dis%
      10: { cellWidth: 18, halign: 'right' }, // Taxable
      11: { cellWidth: 15, halign: 'right' }, // GST Amt
      12: { cellWidth: 20, halign: 'right' }  // Net
    },
    alternateRowStyles: { fillColor: lightGray }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // --- SUMMARY SECTION ---
  const summaryX = pageWidth - 65;
  const valueX = pageWidth - 15;
  
  doc.setFontSize(9);
  
  const totQty = invoice.totalQuantity || invoice.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Total Quantity:', summaryX, finalY);
  doc.text(String(totQty), valueX, finalY, { align: 'right' });

  doc.text('Total Taxable Amount:', summaryX, finalY + 6);
  doc.text(formatCurrency(invoice.totalTaxable || invoice.taxableAmount || invoice.subtotal || 0), valueX, finalY + 6, { align: 'right' });

  const cgst = invoice.cgstAmount || (invoice.gstAmount ? invoice.gstAmount / 2 : 0);
  const sgst = invoice.sgstAmount || (invoice.gstAmount ? invoice.gstAmount / 2 : 0);
  const igst = invoice.igstAmount || 0;

  doc.setFont('helvetica', 'normal');
  doc.text('CGST:', summaryX, finalY + 12);
  doc.text(formatCurrency(cgst), valueX, finalY + 12, { align: 'right' });
  
  doc.text('SGST:', summaryX, finalY + 18);
  doc.text(formatCurrency(sgst), valueX, finalY + 18, { align: 'right' });
  
  doc.text('IGST:', summaryX, finalY + 24);
  doc.text(formatCurrency(igst), valueX, finalY + 24, { align: 'right' });

  doc.text('Round Off:', summaryX, finalY + 30);
  doc.text(formatCurrency(invoice.roundOff || 0), valueX, finalY + 30, { align: 'right' });

  doc.setFillColor(...lightGray);
  doc.rect(summaryX - 5, finalY + 34, 70, 8, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('GRAND TOTAL (INR):', summaryX, finalY + 40);
  doc.text(formatCurrency(invoice.grandTotal || invoice.netAmount || invoice.amount || 0), valueX, finalY + 40, { align: 'right' });

  // --- AMOUNT IN WORDS ---
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.text('AMOUNT IN WORDS:', 15, finalY + 6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...darkGray);
  
  const wordsSplit = doc.splitTextToSize(amountInWords, (pageWidth / 2) + 20);
  doc.text(wordsSplit, 15, finalY + 12);

  // --- BANK DETAILS & DECLARATION & SIGNATURE ---
  const bottomSectionY = finalY + 50 > pageHeight - 40 ? pageHeight - 40 : finalY + 50;

  // Bank
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('BANK DETAILS:', 15, bottomSectionY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...black);
  doc.text('Bank Name: HDFC Bank', 15, bottomSectionY + 6);
  doc.text('Account No: 50200012345678', 15, bottomSectionY + 11);
  doc.text('IFSC Code: HDFC0001234', 15, bottomSectionY + 16);
  doc.text('Branch: Nariman Point, Mumbai', 15, bottomSectionY + 21);
  doc.text('UPI: mjhealth@hdfcbank', 15, bottomSectionY + 26);

  // Declaration
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('DECLARATION:', pageWidth / 2 - 20, bottomSectionY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  const declaration = "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
  const decSplit = doc.splitTextToSize(declaration, 60);
  doc.text(decSplit, pageWidth / 2 - 20, bottomSectionY + 6);

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.setFontSize(9);
  doc.text('For MJ Healthcare', pageWidth - 15, bottomSectionY + 6, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('Authorized Signatory', pageWidth - 15, bottomSectionY + 26, { align: 'right' });

  // --- FOOTER ---
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  
  const genDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const footerText = `Generated by MJ Healthcare ERP | ${genDate} | Computer Generated Invoice | Page 1 of 1`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
};
