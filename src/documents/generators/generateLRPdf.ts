import jsPDF from 'jspdf';
import { applyLRTemplate } from '../templates/LRTemplate';

export const generateLRPdf = (challan: any) => {
  const doc = new jsPDF();
  
  // Use the single source of truth for the layout
  applyLRTemplate(doc, challan);
  
  // Download valid PDF
  const filename = challan.lrNumber ? `LR-${challan.lrNumber}.pdf` : `LR-${challan.challanNo}.pdf`;
  doc.save(filename);
};
