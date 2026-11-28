import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export interface CreditNoteItemPdf {
  id?: number;
  productName: string;
  productCode?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  rate: number;
  gstPercent: number;
  totalAmount: number;
  disposition?: string;
}

export interface CreditNotePdfData {
  id?: string;
  cnNo: string;
  cnDate: string;
  customerName: string;
  customerType: string;
  customerCode?: string;
  customerGstin?: string;
  customerDlNo?: string;
  distributorName?: string;
  distributorCode?: string;
  distributorGstin?: string;
  distributorDlNo?: string;
  againstInvoiceNo: string;
  invoiceDate: string;
  cnType: string;
  reason: string;
  status: string;
  disposition?: string;
  creditAmount: number;
  gstAdjustment: number;
  taxableAmount?: number;
  originalAmount?: number;
  amountSettled?: number;
  remarks?: string;
  items?: CreditNoteItemPdf[];
}

const formatCurrency = (amount: number = 0) =>
  `Rs. ${(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getStatusColor = (status: string): [number, number, number] => {
  const s = (status || '').toUpperCase();
  if (s === 'SETTLED' || s === 'PAID') return [22, 163, 74];   // green
  if (s === 'APPROVED') return [37, 99, 235];                   // blue
  if (s === 'REJECTED') return [220, 38, 38];                   // red
  return [217, 119, 6];                                         // amber (PENDING)
};

export const applyCreditNoteTemplate = (doc: jsPDF, record: CreditNotePdfData) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const startY = applyDocumentHeader(doc, 'CREDIT NOTE / GOODS RETURN VOUCHER');
  let y = startY;

  // ── SECTION 1: Reference & Parties Details ─────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Credit Note & Reference Information', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 8;

  // Left column: Document references
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text('Credit Note No:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.cnNo || '—', 52, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Date of Issue:', 14, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.cnDate || '—', 52, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Original Invoice No:', 14, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.againstInvoiceNo || 'N/A', 52, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Original Invoice Date:', 14, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.invoiceDate || record.cnDate, 52, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Return Reason:', 14, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.reason || record.cnType || 'Sales Return', 52, y + 24);

  // Right column: Party details & status
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Party / Chemist:', 110, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.customerName || 'General Customer', 145, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Party Type / Code:', 110, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  const partyCodeStr = record.customerCode ? ` (${record.customerCode})` : '';
  doc.text(`${record.customerType || 'Retailer'}${partyCodeStr}`, 145, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Stock Disposition:', 110, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  const dispText = record.disposition === 'QUARANTINE_DUMP' 
    ? 'QUARANTINE / DISPOSAL' 
    : record.disposition === 'FINANCIAL_ONLY' 
      ? 'FINANCIAL ADJUSTMENT' 
      : 'SALABLE (Restocked)';
  doc.text(dispText, 145, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Document Status:', 110, y + 18);
  const [sr, sg, sb] = getStatusColor(record.status);
  doc.setTextColor(sr, sg, sb);
  doc.setFont('helvetica', 'bold');
  doc.text((record.status || 'PENDING').toUpperCase(), 145, y + 18);

  // Recovery Rate calculation
  const isSettled = (record.status || '').toUpperCase() === 'SETTLED' || (record.status || '').toUpperCase() === 'PAID';
  const finalSettled = record.amountSettled && record.amountSettled > 0 ? record.amountSettled : record.creditAmount;
  const originalClaim = record.originalAmount && record.originalAmount > 0 
    ? record.originalAmount 
    : Math.max(record.creditAmount, finalSettled);
  const deductionLoss = Math.max(0, originalClaim - finalSettled);
  const recoveryPct = originalClaim > 0 ? Math.round((finalSettled / originalClaim) * 100) : 100;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Recovery Policy:', 110, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isSettled ? 22 : 75, isSettled ? 163 : 85, isSettled ? 74 : 99);
  doc.text(isSettled ? `${recoveryPct}% Value Approved` : 'Pending Policy Approval', 145, y + 24);

  y += 33;

  // ── SECTION 2: Returned Medicines & Products Table ────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Returned Medicines & Products Schedule', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 6;

  const tableRows = (record.items && record.items.length > 0)
    ? record.items.map((it, idx) => [
        String(idx + 1),
        it.productName + (it.productCode ? `\n[${it.productCode}]` : ''),
        it.batchNumber || 'BAT-GEN',
        it.expiryDate || '12/2027',
        `${it.quantity} Units`,
        formatCurrency(it.rate),
        `${it.gstPercent || 12}%`,
        formatCurrency(it.totalAmount)
      ])
    : [
        [
          '1',
          `Pharmaceutical Supplies (${record.reason || 'Sales Return'})`,
          'BAT-GEN',
          '12/2027',
          '1 Units',
          formatCurrency(record.taxableAmount || (originalClaim / 1.12)),
          '12%',
          formatCurrency(originalClaim)
        ]
      ];

  autoTable(doc, {
    head: [['#', 'Medicine / Product Description', 'Batch No', 'Expiry', 'Qty', 'Unit Rate', 'GST %', 'Line Total']],
    body: tableRows,
    startY: y,
    theme: 'striped',
    headStyles: {
      fillColor: [22, 60, 120],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 8.5, textColor: [31, 41, 55] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── SECTION 3: Financial Summary & Settlement Impact Breakdown ────
  if (y > pageHeight - 85) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Financial Impact & Settlement Breakdown', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 7;

  // Background Box for Summary Card
  const boxX = 14;
  const boxWidth = pageWidth - 28;
  const boxHeight = 44;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, 'S');

  // Left sub-column: Policy details & Remarks
  const leftColX = boxX + 4;
  let textY = y + 7;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Return Policy Details:', leftColX, textY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Policy Applied: ${recoveryPct}% Recovery Approval (${record.reason})`, leftColX, textY + 6);

  if (isSettled && deductionLoss > 0.01) {
    doc.text(`Scrap / Salvage Deduction: ${100 - recoveryPct}% Policy Loss Deduction`, leftColX, textY + 12);
  } else {
    doc.text('Full value return adjustment credit', leftColX, textY + 12);
  }

  const remarksStr = record.remarks || `${record.reason} authorized adjustment`;
  doc.text(`Notes: ${remarksStr.length > 55 ? remarksStr.substring(0, 52) + '...' : remarksStr}`, leftColX, textY + 18);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Statutory Compliance: Issued under Section 34 of GST Act & GDP standard.', leftColX, textY + 26);

  // Right sub-column: Amount calculations
  const rightColX = pageWidth / 2 + 10;
  const valColX = pageWidth - 18;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Original Claim Total:', rightColX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(originalClaim), valColX, textY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Taxable Value (Est):', rightColX, textY + 6);
  doc.text(formatCurrency(originalClaim / 1.12), valColX, textY + 6, { align: 'right' });

  doc.text('GST Reversal (12%):', rightColX, textY + 12);
  doc.text(formatCurrency(originalClaim - (originalClaim / 1.12)), valColX, textY + 12, { align: 'right' });

  if (isSettled && deductionLoss > 0.01) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Policy Deduction (${100 - recoveryPct}%):`, rightColX, textY + 18);
    doc.text(`- ${formatCurrency(deductionLoss)}`, valColX, textY + 18, { align: 'right' });
  }

  // Highlight Box for Final Settled Credit
  const finalBoxY = textY + 23;
  doc.setFillColor(236, 253, 245); // light emerald green
  doc.roundedRect(rightColX - 2, finalBoxY - 4, (valColX - rightColX) + 6, 10, 1, 1, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(rightColX - 2, finalBoxY - 4, (valColX - rightColX) + 6, 10, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(22, 101, 52); // dark emerald green
  doc.text(isSettled ? 'Final Credit Settled:' : 'Net Credit Amount:', rightColX, finalBoxY + 3);
  doc.text(formatCurrency(finalSettled), valColX, finalBoxY + 3, { align: 'right' });

  y += boxHeight + 10;

  // ── SECTION 4: Signatures & Footer ─────────────────────────────────
  applySignatureBlock(doc, y);
  applyDocumentFooter(doc);
};
