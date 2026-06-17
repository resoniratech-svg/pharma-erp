import jsPDF from 'jspdf';
import { applyTransportChallanTemplate } from '../templates/TransportChallanTemplate';

export const generatePrint = (challan: any) => {
  const doc = new jsPDF();
  
  // Use the exact same layout as the PDF for consistency
  applyTransportChallanTemplate(doc, challan);
  
  // Triggers browser print dialog
  doc.autoPrint();
  
  // Open PDF in a new window/tab for printing
  const pdfUrl = doc.output('bloburl');
  window.open(pdfUrl, '_blank');
};
