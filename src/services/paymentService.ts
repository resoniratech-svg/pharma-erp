export type PaymentStatus = 'Pending' | 'Completed' | 'Partially Paid' | 'Failed' | 'Refunded';

export interface Payment {
  id: string;
  invoiceNo: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionRef: string;
  status: PaymentStatus;
  notes?: string;
  retailerId?: string;
  retailerCode?: string;
  retailerName?: string;
}

const STORAGE_KEY = 'pharma_erp_payments';

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    try {
      const { apiRequest } = await import('./apiClient');
      const response = await apiRequest<{ success: boolean; data: any[] }>('/payment-collections');
      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        const mapped = response.data.map(p => ({
          id: String(p.id),
          invoiceNo: p.invoice?.invoiceNo || p.invoiceNo || 'N/A',
          amount: Number(p.amount),
          paymentDate: p.paymentDate ? p.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
          paymentMethod: p.paymentMode || p.paymentMethod || 'Bank Transfer',
          transactionRef: p.referenceNumber || p.transactionRef || 'N/A',
          status: p.status || 'Completed',
          notes: p.remarks || p.notes || '',
          retailerId: String(p.retailerId || ''),
          retailerCode: p.retailer?.code || '',
          retailerName: p.retailer?.name || ''
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped as Payment[];
      }
    } catch (e) {
      console.warn("Failed to fetch payments from API, using fallback", e);
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing payments from storage", e);
      }
    }
    
    // Seed some mock payments if empty
    const mockPayments: Payment[] = [
      {
        id: 'pay-1',
        invoiceNo: 'SAL-INV-2023-001',
        amount: 5600,
        paymentDate: '2023-10-10',
        paymentMethod: 'UPI',
        transactionRef: 'TXN123456789',
        status: 'Completed',
        notes: 'Invoice SAL-INV-2023-001 fully paid.',
        retailerCode: 'RET-001',
        retailerName: 'City Pharmacy'
      },
      {
        id: 'pay-2',
        invoiceNo: 'SAL-INV-2023-002',
        amount: 3000,
        paymentDate: '2023-10-20',
        paymentMethod: 'Bank Transfer',
        transactionRef: 'TXN987654321',
        status: 'Completed',
        notes: 'Partial payment.',
        retailerCode: 'RET-002',
        retailerName: 'Wellness Medicos'
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPayments));
    return mockPayments;
  },

  saveAll: (payments: Payment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  },

  create: async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`
    };
    
    try {
      const { apiRequest } = await import('./apiClient');
      const response = await apiRequest<{ success: boolean; data: any }>('/payment-collections', {
        method: 'POST',
        bodyData: {
          invoiceId: 1, // Fallback placeholder if missing
          retailerId: payment.retailerId ? Number(payment.retailerId) : undefined,
          amount: payment.amount,
          paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : new Date().toISOString(),
          paymentMode: payment.paymentMethod,
          referenceNumber: payment.transactionRef,
          remarks: payment.notes,
          status: payment.status
        }
      });
      if (response && response.success && response.data) {
        newPayment.id = String(response.data.id);
      }
    } catch (e) {
      console.warn("Failed to create payment on API", e);
    }

    try {
      // It's possible getAll() is still executing asynchronously in another context, 
      // but let's grab the local cache to quickly update the UI
      const stored = localStorage.getItem(STORAGE_KEY);
      const payments = stored ? JSON.parse(stored) : [];
      payments.unshift(newPayment);
      paymentService.saveAll(payments);
    } catch (e) {}

    return newPayment;
  }
};
