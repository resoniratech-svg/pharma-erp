import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export interface SalesReturnProduct {
  name: string;
  batch: string;
  soldQty: number;
  returnQty: number;
  unitPrice: number;
}

export interface SalesReturnPdfData {
  returnNo: string;
  date: string;
  customerName: string;
  customerType: string;
  invoiceNo: string;
  returnType: string;
  reason: string;
  remarks?: string;
  // QC
  qcStatus: string;
  physicalCondition?: string;
  batchVerification?: string;
  expiryVerification?: string;
  qcRemarks?: string;
  // Financials
  returnValue: number;
  gstReversal: number;
  cnAmount: number;
  // Status & Approval
  status: string;
  cnStatus: string;
  approvedBy?: string;
  approvalRemarks?: string;
  // Products
  products: SalesReturnProduct[];
}

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getQcColor = (status: string): [number, number, number] => {
  if (status === 'Passed') return [22, 163, 74];   // green
  if (status === 'Failed') return [220, 38, 38];   // red
  return [245, 158, 11];                            // amber (Pending)
};

const getStatusColor = (status: string): [number, number, number] => {
  if (status === 'Completed' || status === 'Approved') return [22, 163, 74];
  if (status === 'Rejected') return [220, 38, 38];
  return [100, 116, 139];
};

export const applySalesReturnTemplate = (doc: jsPDF, record: SalesReturnPdfData) => {
  const pageWidth = doc.internal.pageSize.width;
  const startY = applyDocumentHeader(doc, 'SALES RETURN DOCUMENT');
  let y = startY;

  // ── SECTION 1: Reference Info ─────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Return Reference', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 8;

  // Left column
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text('Return No:', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.returnNo, 55, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Return Date:', 14, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.date, 55, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Original Invoice No:', 14, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.invoiceNo, 55, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Return Type:', 14, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.returnType, 55, y + 18);

  // Right column
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Customer Name:', 110, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.customerName, 155, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Customer Type:', 110, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.customerType, 155, y + 6);

  // Status badge (right column)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Status:', 110, y + 12);
  const [sr, sg, sb] = getStatusColor(record.status);
  doc.setTextColor(sr, sg, sb);
  doc.setFont('helvetica', 'bold');
  doc.text(record.status.toUpperCase(), 155, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('CN Status:', 110, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(record.cnStatus, 155, y + 18);

  y += 28;

  // Reason row
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Reason:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(record.reason || '—', 55, y);

  if (record.remarks) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Remarks:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(record.remarks, 155, y);
  }
  y += 10;

  // ── SECTION 2: Product Return Items Table ─────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Product Return Details', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 5;

  const tableRows = record.products.length > 0
    ? record.products.map((p, i) => [
        String(i + 1),
        p.name,
        p.batch,
        String(p.soldQty),
        String(p.returnQty),
        formatCurrency(p.unitPrice),
        formatCurrency(p.returnQty * p.unitPrice),
      ])
    : [['—', 'No products listed', '—', '—', '—', '—', '—']];

  autoTable(doc, {
    head: [['#', 'Product Name', 'Batch No', 'Sold Qty', 'Return Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    startY: y,
    theme: 'striped',
    headStyles: {
      fillColor: [22, 60, 120],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [31, 41, 55] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── SECTION 3: QC Verification ────────────────────────────────────
  if (y > doc.internal.pageSize.height - 80) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Quality Control (QC) Verification', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 8;

  doc.setFontSize(9);
  // QC Status with color
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('QC Status:', 14, y);
  const [qr, qg, qb] = getQcColor(record.qcStatus);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(qr, qg, qb);
  doc.text(record.qcStatus, 55, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Physical Condition:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(record.physicalCondition || 'Not checked', 155, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Batch Verification:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(record.batchVerification || 'Pending', 55, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Expiry Verification:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(record.expiryVerification || 'Pending', 155, y);
  y += 6;

  if (record.qcRemarks) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('QC Remarks:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(record.qcRemarks, 55, y);
    y += 6;
  }
  y += 4;

  // ── SECTION 4: Financial Summary ──────────────────────────────────
  if (y > doc.internal.pageSize.height - 70) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Financial Summary', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 8;

  const summaryX = 120;
  doc.setFontSize(9);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Taxable Return Value:', summaryX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(record.returnValue), pageWidth - 14, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('GST Reversal:', summaryX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(formatCurrency(record.gstReversal), pageWidth - 14, y, { align: 'right' });
  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.line(summaryX, y, pageWidth - 14, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 60, 120);
  doc.setFontSize(10);
  doc.text('Total Return Value (incl. GST):', summaryX, y);
  doc.text(formatCurrency(record.returnValue + record.gstReversal), pageWidth - 14, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(9);
  doc.text('Credit Note Amount:', summaryX, y);
  doc.setTextColor(record.cnStatus === 'Generated' || record.cnStatus === 'Applied' ? 22 : 100, record.cnStatus !== 'Not Generated' ? 163 : 116, record.cnStatus !== 'Not Generated' ? 74 : 139);
  doc.text(record.cnAmount > 0 ? formatCurrency(record.cnAmount) : 'Not Generated', pageWidth - 14, y, { align: 'right' });
  y += 10;

  // ── SECTION 5: Approval Info ──────────────────────────────────────
  if (record.approvedBy) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text('Approval Information', 14, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 2, pageWidth - 14, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(9);
    doc.text('Approved By:', 14, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(record.approvedBy, 55, y);

    if (record.approvalRemarks) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text('Remarks:', 110, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(record.approvalRemarks, 135, y);
    }
    y += 10;
  }

  // ── Signature Block & Footer ──────────────────────────────────────
  applySignatureBlock(doc, y);
  applyDocumentFooter(doc);
};
