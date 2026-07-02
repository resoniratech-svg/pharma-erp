import { billingService, type GSTInvoice } from './billingService';

export interface EInvoiceMetadata {
  invoiceNo: string;
  irnStatus: 'Pending' | 'Generated' | 'Failed';
  irnNumber: string;
  irnGeneratedOn: string;
  ackNo: string;
  ackDate: string;
  nicStatus: 'Success' | 'Pending' | 'Error';
  responseMessage: string;
  errorCode: string;
  errorDesc: string;
  qrStatus: 'Generated' | 'Pending' | 'Not Applicable';
}

export interface EInvoiceData {
  id: string;
  invoiceNo: string;
  orderNo: string;
  customerName: string;
  gstin: string;
  invoiceDate: string;
  taxableAmount: number;
  gstAmount: number;
  invoiceValue: number;
  
  irnStatus: 'Pending' | 'Generated' | 'Failed';
  irnNumber: string;
  irnGeneratedOn: string;
  ackNo: string;
  ackDate: string;
  
  nicStatus: 'Success' | 'Pending' | 'Error';
  responseMessage: string;
  errorCode: string;
  errorDesc: string;
  
  qrStatus: 'Generated' | 'Pending' | 'Not Applicable';
}

export const eInvoiceService = {
  // Get all e-invoice records mapped dynamically from GST billing invoices
  getEInvoices(): EInvoiceData[] {
    const invoices = billingService.getInvoices();
    const savedEInvoices = billingService.getEInvoices();
    
    return invoices.map((inv: GSTInvoice) => {
      const metadata = savedEInvoices[inv.invoiceNo] || {};
      const isB2C = inv.customerId === 'B2C' || !inv.customerId;
      
      // Deterministically generate a mock GSTIN for B2B customers
      const generatedGstin = isB2C 
        ? 'B2C Counter Sale (No GSTIN)' 
        : `29${inv.customerName.replace(/[^A-Za-z]/g, '').padEnd(5, 'X').substring(0, 5).toUpperCase()}1234A1Z5`;
        
      const hasGstin = !isB2C;
      
      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        orderNo: `ORD-${inv.invoiceNo.split('/').pop()}`,
        customerName: inv.customerName,
        gstin: generatedGstin,
        invoiceDate: inv.date,
        taxableAmount: inv.subTotal,
        gstAmount: inv.cgstTotal + inv.sgstTotal + inv.igstTotal,
        invoiceValue: inv.grandTotal,
        
        irnStatus: metadata.irnStatus || 'Pending',
        irnNumber: metadata.irnNumber || '-',
        irnGeneratedOn: metadata.irnGeneratedOn || '-',
        ackNo: metadata.ackNo || '-',
        ackDate: metadata.ackDate || '-',
        
        nicStatus: metadata.nicStatus || 'Pending',
        responseMessage: metadata.responseMessage || 'Pending generation',
        errorCode: metadata.errorCode || '-',
        errorDesc: metadata.errorDesc || '-',
        
        qrStatus: metadata.qrStatus || (hasGstin ? 'Pending' : 'Not Applicable')
      };
    });
  },

  // Generate IRN for a given invoice number
  generateIRN(invoiceNo: string): EInvoiceMetadata {
    const d = new Date();
    const dateStr = `${d.getDate().toString().padStart(2, '0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}-${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    // Generate a random 64-char hex string as mock IRN hash
    const irnHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const ackNo = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();

    const metadata: EInvoiceMetadata = {
      invoiceNo,
      irnStatus: 'Generated',
      irnNumber: irnHash,
      irnGeneratedOn: dateStr,
      ackNo,
      ackDate: dateStr,
      nicStatus: 'Success',
      responseMessage: 'IRN Generated Successfully',
      errorCode: '-',
      errorDesc: '-',
      qrStatus: 'Generated'
    };

    billingService.saveEInvoiceMetadata(invoiceNo, metadata);
    return metadata;
  },

  // Save specific failure details for testing
  setFailedIRN(invoiceNo: string, errorCode: string, errorDesc: string) {
    const metadata: EInvoiceMetadata = {
      invoiceNo,
      irnStatus: 'Failed',
      irnNumber: '-',
      irnGeneratedOn: '-',
      ackNo: '-',
      ackDate: '-',
      nicStatus: 'Error',
      responseMessage: errorDesc,
      errorCode,
      errorDesc,
      qrStatus: 'Not Applicable'
    };

    billingService.saveEInvoiceMetadata(invoiceNo, metadata);
  },

  // QR Code base64 data URL
  getQRCodeDataUrl(): string {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyAQMAAAAk8RryAAAABlBMVEX///8AAABVwtN+AAAAAnRSTlMAGcx7QkoAAAAeSURBVBgZ7cExAQAAAMKg9U9tCj+gAAAAAAAAgA8MKywAAcEyt5AAAAAASUVORK5CYII=";
  }
};
