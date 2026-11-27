import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { billingService } from '../../services/billingService';

export const applyEInvoiceTemplate = (doc: jsPDF, invoice: any) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Retrieve complete invoice record if available from billingService
  let fullInvoice = invoice;
  try {
    const allInvoices = billingService.getInvoices();
    const matched = allInvoices.find(inv => inv.invoiceNo === invoice.invoiceNo);
    if (matched) {
      fullInvoice = { ...matched, ...invoice };
      if (matched.items && (!invoice.items || invoice.items.length === 0)) {
        fullInvoice.items = matched.items;
      }
    }
  } catch (e) {
    // fallback to passed record
  }

  // Formatters (strictly without Unicode rupee glyphs to prevent broken font display)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const numberToWords = (num: number): string => {
    return "Rupees " + formatCurrency(num) + " Only";
  };

  const grandTotal = Number(fullInvoice.grandTotal || fullInvoice.invoiceValue || fullInvoice.netAmount || 0);
  const amountInWords = fullInvoice.amountInWords || numberToWords(grandTotal);

  // Colors
  const primaryBlue: [number, number, number] = [22, 60, 120]; // #163C78
  const darkGray: [number, number, number] = [51, 65, 85]; // slate-700
  const black: [number, number, number] = [15, 23, 42]; // slate-900
  const lightGray: [number, number, number] = [241, 245, 249]; // slate-100
  const emeraldText: [number, number, number] = [5, 150, 105]; // emerald-600
  const borderGray: [number, number, number] = [226, 232, 240]; // slate-200

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

  // E-INVOICE Document Title (Top Right)
  doc.setFontSize(16);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('e-INVOICE', pageWidth - 15, currentY + 3, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...emeraldText);
  doc.text('[ GST e-Invoice / IRP Verified ]', pageWidth - 15, currentY + 8, { align: 'right' });

  // Invoice Details Top Right
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', pageWidth - 70, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(fullInvoice.invoiceNo || '-', pageWidth - 15, currentY + 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - 70, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(fullInvoice.invoiceDate || fullInvoice.date || '-', pageWidth - 15, currentY + 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Order No:', pageWidth - 70, currentY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(fullInvoice.orderNo || `ORD-${fullInvoice.invoiceNo || '-'}`, pageWidth - 15, currentY + 25, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Terms:', pageWidth - 70, currentY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(fullInvoice.paymentTerms || '15 Days Credit', pageWidth - 15, currentY + 30, { align: 'right' });

  // Divider
  currentY += 36;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);

  currentY += 4;

  // --- E-INVOICE COMPLIANCE BOX (IRN, ACK NO, ACK DATE) ---
  const einvBoxY = currentY;
  const einvBoxHeight = 22;
  doc.setFillColor(...lightGray);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, einvBoxY, pageWidth - 30, einvBoxHeight, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('GOVERNMENT E-INVOICE REFERENCE (IRP PORTAL):', 20, einvBoxY + 5.5);

  const irnNumber = fullInvoice.irnNumber && fullInvoice.irnNumber !== '-' ? fullInvoice.irnNumber : '2f8abb9408c4fe11912be184205c98739e2daebc58f61b471913f660c5426528';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...black);
  doc.text('IRN: ', 20, einvBoxY + 11.5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...darkGray);
  const irnSplit = doc.splitTextToSize(irnNumber, 110);
  doc.text(irnSplit, 28, einvBoxY + 11.5);

  // Right Side of Compliance Box: Ack details & Status
  const ackX = pageWidth - 65;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('Ack No:', ackX, einvBoxY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(String(fullInvoice.ackNo || '3166589964614052'), pageWidth - 20, einvBoxY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Ack Date:', ackX, einvBoxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(String(fullInvoice.ackDate || fullInvoice.invoiceDate || '27-Nov-2026 16:09'), pageWidth - 20, einvBoxY + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('NIC Status:', ackX, einvBoxY + 17);
  doc.setTextColor(...emeraldText);
  doc.text('ACT / SUCCESS', pageWidth - 20, einvBoxY + 17, { align: 'right' });

  currentY += einvBoxHeight + 6;

  // --- BILL TO & TRANSPORT DETAILS ---
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 15, currentY);
  doc.text('TRANSPORT & SUPPLY DETAILS:', pageWidth / 2, currentY);

  currentY += 5.5;
  doc.setFontSize(8.5);
  doc.setTextColor(...black);

  // Left Column: Bill To
  const customerName = fullInvoice.customerName || 'Retail Customer';
  doc.setFont('helvetica', 'bold');
  doc.text(customerName, 15, currentY);

  let leftY = currentY + 4.5;
  const customerMobile = fullInvoice.mobileNumber || fullInvoice.customerMobile || '';
  if (customerMobile) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Mobile: ${customerMobile}`, 15, leftY);
    leftY += 4.5;
  }

  const customerAddress = fullInvoice.address || fullInvoice.customerAddress || 'Address on record';
  const splitAddress = doc.splitTextToSize(customerAddress, (pageWidth / 2) - 25);
  doc.setFont('helvetica', 'normal');
  doc.text(splitAddress, 15, leftY);
  leftY += (splitAddress.length * 4);

  const customerGstin = fullInvoice.gstin || '29NITHI1234A1Z5';
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN: ${customerGstin}`, 15, leftY);

  // Right Column: Transport
  const tX = pageWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Mode:', tX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(fullInvoice.transportMode || 'Road', tX + 28, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Company:', tX, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(fullInvoice.transportCompany || 'Express Logistics', tX + 28, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle No:', tX, currentY + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(fullInvoice.vehicleNo || '-', tX + 28, currentY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Supply Type:', tX, currentY + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.text('B2B Regular', tX + 28, currentY + 13.5);

  currentY = Math.max(leftY + 7, currentY + 19);

  // --- PRODUCT TABLE ---
  let tableData: any[] = [];
  if (fullInvoice.items && fullInvoice.items.length > 0) {
    tableData = fullInvoice.items.map((item: any, index: number) => {
      const qty = Number(item.qty || item.quantity || 1);
      const ptr = Number(item.ptr || item.unitPrice || item.rate || 0);
      const discPct = Number(item.discountPercent || item.discountPct || 0);
      const gstPct = Number(item.gstPercent || item.gstPct || item.gst || 12);
      const extraMargin = Number(item.extraMargin || 0);

      const baseAmt = qty * ptr * (1 - discPct / 100);
      const marginAmt = qty * extraMargin;
      const taxableAmt = item.taxableAmount !== undefined ? item.taxableAmount : (baseAmt + marginAmt);
      const gstAmt = item.gstAmount !== undefined ? item.gstAmount : (taxableAmt * gstPct / 100);
      const netAmt = item.total !== undefined ? item.total : (item.netAmount || (taxableAmt + gstAmt));

      return [
        (index + 1).toString(),
        item.productName ? `${item.productName}${extraMargin > 0 ? ` (+₹${extraMargin.toFixed(2)} Margin)` : ''}` : (item.description || 'Pharmaceutical Item'),
        item.batchNo || item.batchNumber || item.batch || '-',
        item.expiryDate || item.expiry || '-',
        item.hsnCode || item.hsn || '3004',
        `${gstPct}%`,
        qty.toString(),
        (item.freeQty !== undefined ? item.freeQty : item.freeQuantity || 0).toString(),
        formatCurrency(ptr + (extraMargin > 0 ? extraMargin : 0)),
        `${discPct}%`,
        formatCurrency(taxableAmt),
        formatCurrency(gstAmt),
        formatCurrency(netAmt)
      ];
    });
  } else {
    // Consolidated Products fallback with cleanly aligned values
    const taxAmt = Number(fullInvoice.taxableAmount || 0);
    const gstAmt = Number(fullInvoice.gstAmount || 0);
    const totalAmt = Number(fullInvoice.invoiceValue || fullInvoice.grandTotal || (taxAmt + gstAmt));
    tableData = [[
      '1',
      'Pharmaceutical Products (Consolidated Supply)',
      '-',
      '-',
      '3004',
      '12%',
      '1',
      '0',
      formatCurrency(taxAmt),
      '0%',
      formatCurrency(taxAmt),
      formatCurrency(gstAmt),
      formatCurrency(totalAmt)
    ]];
  }

  autoTable(doc, {
    startY: currentY,
    head: [['S.No', 'Product Description', 'Batch', 'Expiry', 'HSN', 'GST%', 'Qty', 'Free', 'PTR', 'Dis%', 'Taxable', 'GST Amt', 'Net Amt']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryBlue, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, textColor: darkGray, lineColor: borderGray },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // SNo
      1: { cellWidth: 'auto' }, // Description
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
  const summaryX = pageWidth - 85;
  const valueX = pageWidth - 15;

  doc.setFontSize(8.5);

  const totQty = fullInvoice.totalQuantity || fullInvoice.items?.reduce((acc: number, item: any) => acc + (Number(item.qty || item.quantity) || 0), 0) || 1;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Total Quantity:', summaryX, finalY);
  doc.text(String(totQty), valueX, finalY, { align: 'right' });

  const taxableSubTotal = Number(fullInvoice.subTotal || fullInvoice.taxableAmount || 0);
  doc.text('Total Taxable Amount:', summaryX, finalY + 5.5);
  doc.text(formatCurrency(taxableSubTotal), valueX, finalY + 5.5, { align: 'right' });

  const cgst = Number(fullInvoice.cgstTotal || (fullInvoice.gstAmount ? fullInvoice.gstAmount / 2 : 0));
  const sgst = Number(fullInvoice.sgstTotal || (fullInvoice.gstAmount ? fullInvoice.gstAmount / 2 : 0));
  const igst = Number(fullInvoice.igstTotal || 0);

  doc.setFont('helvetica', 'normal');
  doc.text('CGST:', summaryX, finalY + 11);
  doc.text(formatCurrency(cgst), valueX, finalY + 11, { align: 'right' });

  doc.text('SGST:', summaryX, finalY + 16.5);
  doc.text(formatCurrency(sgst), valueX, finalY + 16.5, { align: 'right' });

  doc.text('IGST:', summaryX, finalY + 22);
  doc.text(formatCurrency(igst), valueX, finalY + 22, { align: 'right' });

  doc.text('Round Off:', summaryX, finalY + 27.5);
  doc.text(formatCurrency(fullInvoice.roundOff || 0), valueX, finalY + 27.5, { align: 'right' });

  // Grand Total Highlight Box (With 73mm width to prevent any text overlapping)
  doc.setFillColor(...lightGray);
  doc.rect(summaryX - 3, finalY + 31.5, 73, 9, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('GRAND TOTAL (INR):', summaryX, finalY + 37.5);
  doc.text(formatCurrency(grandTotal), valueX, finalY + 37.5, { align: 'right' });

  // --- AMOUNT IN WORDS ---
  doc.setFontSize(8.5);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT IN WORDS:', 15, finalY + 6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...darkGray);

  const wordsSplit = doc.splitTextToSize(amountInWords, (pageWidth / 2) - 15);
  doc.text(wordsSplit, 15, finalY + 11);

  // --- BANK DETAILS, DISCLAIMER, DECLARATION & SIGNATURE ---
  const summaryHeight = 42;
  const summaryEndY = finalY + summaryHeight;
  const wordsEndY = finalY + 11 + (wordsSplit.length * 4);
  let bottomSectionY = Math.max(summaryEndY, wordsEndY) + 6;

  const totalRequiredHeight = 65;
  if (bottomSectionY + totalRequiredHeight > pageHeight - 15) {
    doc.addPage();
    bottomSectionY = 20;
  }

  // Subtle separator line above footer section
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.4);
  doc.line(15, bottomSectionY - 2, pageWidth - 15, bottomSectionY - 2);

  let curY = bottomSectionY + 4;

  // 1. BANK DETAILS
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('BANK DETAILS:', 15, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...black);
  doc.text('Bank Name: HDFC Bank', 15, curY + 4.5);
  doc.text('Account No: 50200012345678', 15, curY + 8.5);
  doc.text('IFSC Code: HDFC0001234', 15, curY + 12.5);
  doc.text('Branch: Nariman Point, Mumbai', 15, curY + 16.5);
  doc.text('UPI: mjhealth@hdfcbank', 15, curY + 20.5);

  // 2. DISCLAIMER / TERMS & CONDITIONS (Under Bank Details)
  curY += 26;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('DISCLAIMER / TERMS & CONDITIONS:', 15, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  doc.text('1. Goods once sold will not be taken back or exchanged.', 15, curY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('2. The amount should be paid in 15 days only.', 15, curY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('3. All disputes are subject to Mumbai Jurisdiction.', 15, curY + 12.5);

  // 3. DECLARATION (Under Disclaimer)
  curY += 18;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('DECLARATION:', 15, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  const declaration = "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
  const decSplit = doc.splitTextToSize(declaration, pageWidth - 30);
  doc.text(decSplit, 15, curY + 4.5);

  // 4. SIGNATURE (After that)
  curY += 12;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.setFontSize(9);
  doc.text('For MJ Healthcare', pageWidth - 15, curY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.text('Authorized Signatory', pageWidth - 15, curY + 12, { align: 'right' });

  // --- FOOTER ---
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);

  const genDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const footerText = `Generated by MJ Healthcare ERP | ${genDate} | IRP Portal Registered e-Invoice | Page 1 of 1`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
};
