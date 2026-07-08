export const seedInvoices = () => {
  const existing = localStorage.getItem('pharma_erp_invoices');
  let parsed: any[] = [];
  if (existing) {
    try {
      parsed = JSON.parse(existing);
    } catch (e) {}
  }

  const hasPurchase = Array.isArray(parsed) && parsed.some(i => i.invoiceType === 'Purchase');
  const hasSales = Array.isArray(parsed) && (parsed.some(i => i.invoiceType === 'Sales') || parsed.some(i => !i.invoiceType));

  if (hasPurchase && hasSales) {
    return; // Both types exist, do nothing
  }

  const mockInvoices = [
    {
      id: "purch-1",
      invoiceNo: "PUR-INV-2023-001",
      orderNo: "PO-2023-001",
      supplierName: "Apex Pharma Ltd",
      distributorCode: "DIST-001",
      gstNumber: "27AABBCC1234D1Z5",
      billingAddress: "45 Industrial Area, Phase 1, Mumbai, MH",
      date: "01-10-2023",
      dueDate: "15-10-2023",
      amount: 15680,
      subtotal: 14000,
      gstAmount: 1680,
      paidAmount: 15680,
      outstandingAmount: 0,
      status: "Paid",
      invoiceType: "Purchase",
      items: [
        { id: "i1", productName: "Amoxicillin 500mg", productCode: "AMX-500", quantity: 50, unitPrice: 200, gstPct: 12, lineAmount: 10000 },
        { id: "i2", productName: "Paracetamol 650mg", productCode: "PAR-650", quantity: 100, unitPrice: 40, gstPct: 12, lineAmount: 4000 }
      ]
    },
    {
      id: "purch-2",
      invoiceNo: "PUR-INV-2023-002",
      orderNo: "PO-2023-002",
      supplierName: "MediLife Sciences",
      distributorCode: "DIST-001",
      gstNumber: "27XYZAB1234D1Z5",
      billingAddress: "Sector 14, Navi Mumbai, MH",
      date: "12-10-2023",
      dueDate: "26-10-2023",
      amount: 28000,
      subtotal: 25000,
      gstAmount: 3000,
      paidAmount: 14000,
      outstandingAmount: 14000,
      status: "Partially Paid",
      invoiceType: "Purchase",
      items: [
        { id: "i3", productName: "Ciprofloxacin 500mg", productCode: "CIP-500", quantity: 100, unitPrice: 250, gstPct: 12, lineAmount: 25000 }
      ]
    },
    {
      id: "sales-1",
      invoiceNo: "SAL-INV-2023-001",
      orderNo: "RET-ORD-001",
      retailer: "City Pharmacy",
      retailerCode: "RET-001",
      distributorCode: "DIST-001",
      gstNumber: "27QWERTY1234D1Z5",
      billingAddress: "Main Market, Andheri West, Mumbai, MH",
      date: "05-10-2023",
      dueDate: "20-10-2023",
      amount: 5600,
      subtotal: 5000,
      gstAmount: 600,
      paidAmount: 5600,
      outstandingAmount: 0,
      status: "Paid",
      invoiceType: "Sales",
      items: [
        { id: "i4", productName: "Amoxicillin 500mg", productCode: "AMX-500", quantity: 20, unitPrice: 250, gstPct: 12, lineAmount: 5000 }
      ]
    },
    {
      id: "sales-2",
      invoiceNo: "SAL-INV-2023-002",
      orderNo: "RET-ORD-002",
      retailer: "Wellness Medicos",
      retailerCode: "RET-002",
      distributorCode: "DIST-001",
      gstNumber: "27POIUYT1234D1Z5",
      billingAddress: "Link Road, Malad West, Mumbai, MH",
      date: "15-10-2023",
      dueDate: "30-10-2023",
      amount: 8960,
      subtotal: 8000,
      gstAmount: 960,
      paidAmount: 0,
      outstandingAmount: 8960,
      status: "Unpaid",
      invoiceType: "Sales",
      items: [
        { id: "i5", productName: "Paracetamol 650mg", productCode: "PAR-650", quantity: 50, unitPrice: 60, gstPct: 12, lineAmount: 3000 },
        { id: "i6", productName: "Vitamin C Zinc", productCode: "VIT-C", quantity: 50, unitPrice: 100, gstPct: 12, lineAmount: 5000 }
      ]
    },
    {
      id: "sales-3",
      invoiceNo: "SAL-INV-2023-003",
      orderNo: "RET-ORD-003",
      retailer: "HealthFirst Pharmacy",
      retailerCode: "RET-003",
      distributorCode: "DIST-001",
      gstNumber: "27LKJHGF1234D1Z5",
      billingAddress: "S.V. Road, Borivali West, Mumbai, MH",
      date: "01-09-2023",
      dueDate: "15-09-2023",
      amount: 11200,
      subtotal: 10000,
      gstAmount: 1200,
      paidAmount: 5000,
      outstandingAmount: 6200,
      status: "Overdue",
      invoiceType: "Sales",
      items: [
        { id: "i7", productName: "Ciprofloxacin 500mg", productCode: "CIP-500", quantity: 40, unitPrice: 250, gstPct: 12, lineAmount: 10000 }
      ]
    }
  ];

  let finalInvoices = [...parsed];
  if (!hasPurchase) {
    finalInvoices = [...finalInvoices, ...mockInvoices.filter(i => i.invoiceType === 'Purchase')];
  }
  if (!hasSales) {
    finalInvoices = [...finalInvoices, ...mockInvoices.filter(i => i.invoiceType === 'Sales')];
  }

  localStorage.setItem('pharma_erp_invoices', JSON.stringify(finalInvoices));
};
