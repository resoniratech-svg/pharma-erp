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
  getAll: (): Payment[] => {
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

  create: (payment: Omit<Payment, 'id'>): Payment => {
    const payments = paymentService.getAll();
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`
    };
    payments.unshift(newPayment);
    paymentService.saveAll(payments);
    return newPayment;
  }
};
