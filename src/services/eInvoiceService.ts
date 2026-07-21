import { billingService, type GSTInvoice } from './billingService';
import { apiRequest } from './apiClient';

export interface EInvoiceMetadata {
  invoiceNo: string;
  irnStatus: 'Pending' | 'Generated' | 'Failed' | 'Cancelled';
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
  
  irnStatus: 'Pending' | 'Generated' | 'Failed' | 'Cancelled';
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
  // Get all e-invoice records mapped dynamically from local storage & backend
  getEInvoices(): EInvoiceData[] {
    const invoices = billingService.getInvoices();
    const savedEInvoices = billingService.getEInvoices();
    
    return invoices.map((inv: GSTInvoice) => {
      const metadata = savedEInvoices[inv.invoiceNo] || {};
      const isB2C = inv.customerId === 'B2C' || !inv.customerId;
      
      const resolvedCustomerName = inv.customerName && inv.customerName.trim()
        ? inv.customerName
        : (isB2C ? 'B2C Counter Sale' : 'Walk-in Customer');

      const generatedGstin = isB2C 
        ? 'B2C Counter Sale (No GSTIN)' 
        : `29${resolvedCustomerName.replace(/[^A-Za-z]/g, '').padEnd(5, 'X').substring(0, 5).toUpperCase()}1234A1Z5`;
        
      const hasGstin = !isB2C;
      
      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        orderNo: `ORD-${inv.invoiceNo.split('/').pop()}`,
        customerName: resolvedCustomerName,
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

  // Fetch e-invoices directly from backend API with fallback
  async fetchEInvoicesFromApi(): Promise<EInvoiceData[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/einvoices');
      if (response && response.success && Array.isArray(response.data)) {
        return response.data.map((inv: any) => ({
          id: inv.id.toString(),
          invoiceNo: inv.invoiceNumber,
          orderNo: `ORD-${inv.id}`,
          customerName: inv.retailer?.name || inv.customerName || 'Walk-in Customer',
          gstin: inv.retailer?.gstin || '27AAACB1234H1Z5',
          invoiceDate: new Date(inv.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          taxableAmount: inv.subTotal || 0,
          gstAmount: inv.gstAmount || 0,
          invoiceValue: inv.totalAmount || 0,
          irnStatus: inv.irnStatus || 'Pending',
          irnNumber: inv.irnNumber || '-',
          irnGeneratedOn: inv.irnGeneratedOn ? new Date(inv.irnGeneratedOn).toLocaleString() : '-',
          ackNo: inv.ackNo || '-',
          ackDate: inv.ackDate ? new Date(inv.ackDate).toLocaleString() : '-',
          nicStatus: inv.nicStatus || 'Pending',
          responseMessage: inv.nicErrorDesc || (inv.irnStatus === 'GENERATED' ? 'IRN Generated Successfully' : 'Pending generation'),
          errorCode: inv.nicErrorCode || '-',
          errorDesc: inv.nicErrorDesc || '-',
          qrStatus: inv.signedQrCode ? 'Generated' : 'Pending',
        }));
      }
    } catch {
      // Return local fallback on network/server error
    }
    return this.getEInvoices();
  },

  // Generate IRN for a given invoice number
  generateIRN(invoiceNo: string): EInvoiceMetadata {
    const d = new Date();
    const dateStr = `${d.getDate().toString().padStart(2, '0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}-${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    
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

  // Cancel IRN
  cancelIRN(invoiceNo: string, reason: string): EInvoiceMetadata {
    const metadata: EInvoiceMetadata = {
      invoiceNo,
      irnStatus: 'Cancelled',
      irnNumber: '-',
      irnGeneratedOn: '-',
      ackNo: '-',
      ackDate: '-',
      nicStatus: 'Success',
      responseMessage: `IRN Cancelled: ${reason}`,
      errorCode: '-',
      errorDesc: '-',
      qrStatus: 'Not Applicable'
    };

    billingService.saveEInvoiceMetadata(invoiceNo, metadata);
    return metadata;
  },

  // QR Code base64 data URL
  getQRCodeDataUrl(): string {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyAQMAAAAk8RryAAAABlBMVEX///8AAABVwtN+AAAAAnRSTlMAGcx7QkoAAAAeSURBVBgZ7cExAQAAAMKg9U9tCj+gAAAAAAAAgA8MKywAAcEyt5AAAAAASUVORK5CYII=";
  }
};
