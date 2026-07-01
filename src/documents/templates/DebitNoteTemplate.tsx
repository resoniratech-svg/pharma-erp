import { jsPDF } from 'jspdf';
import { applyDocumentHeader } from '../shared/DocumentHeader';
import { applyDocumentFooter } from '../shared/DocumentFooter';
import { applySignatureBlock } from '../shared/SignatureBlock';

export const applyDebitNoteTemplate = (doc: jsPDF, data: any) => {
  const startY = applyDocumentHeader(doc, 'DEBIT NOTE');
  
  // Placeholder body content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Debit Note content goes here...', 15, startY + 10);
  
  applySignatureBlock(doc, startY + 40);
  applyDocumentFooter(doc);
};

export default function DebitNoteTemplate() {
  return null;
}
