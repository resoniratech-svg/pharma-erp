import jsPDF from 'jspdf';
import { applyPODTemplate } from '../templates/PODTemplate';

export const generatePODPdf = (delivery: any) => {
  const doc = new jsPDF();
  
  applyPODTemplate(doc, delivery);
  
  const filename = `POD-${delivery.deliveryNo}.pdf`;
  doc.save(filename);
};
