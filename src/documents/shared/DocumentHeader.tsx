import { jsPDF } from 'jspdf';
import { base64Logo } from './logoBase64';

export const applyDocumentHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.width;

  // 1. Logo (Left 30%)
  try {
    doc.addImage(base64Logo, 'PNG', 15, 15, 35, 16);
  } catch (e) {
    // Fallback if image fails
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('MJ HEALTHCARE', 15, 25);
  }

  // 2. Company Info (Right 70%)
  const headerX = 60; // Starts from 60
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('MJ HEALTHCARE PRIVATE LIMITED', headerX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text('123 Health Avenue, Medical District', headerX, 23);
  doc.text('Mumbai, Maharashtra 400001', headerX, 27);
  doc.text('GSTIN: 27AADCMJ1234H1Z5', headerX, 31);
  doc.text('PAN: AADCMJ1234H', headerX, 35);
  doc.text('Phone: +91 98765 43210  |  Email: info@mjhealthcare.com', headerX, 39);
  doc.text('Website: www.mjhealthcare.com', headerX, 43);

  // 3. Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(15, 48, pageWidth - 15, 48);

  // 4. Document Title (Centered)
  const titleY = 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.text(title, pageWidth / 2, titleY, { align: 'center' });
  
  // 5. Divider below title
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 62, pageWidth - 15, 62);

  // Return the Y position where the document body should begin
  return 68;
};
