import { useState, useEffect, useMemo } from 'react';             
import { Download, ReceiptText, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { salesInvoiceService } from '../../services/salesInvoiceService';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { ROLE_SUPER_ADMIN, ROLE_DISTRIBUTOR } from '../../constants/roles';

type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';

interface InvoiceItem {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  gstPct: number;
  lineAmount: number;
  batchNumber?: string;
  expiry?: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  orderNo: string;
  retailer?: string;
  retailerCode?: string;
  supplierName?: string;
  distributorCode?: string;
  billingAddress: string;
  gstNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  subtotal: number;
  gstAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  invoiceType?: 'Purchase' | 'Sales';
  dispatchNo?: string;
  transporterName?: string;
  vehicleNumber?: string;
  lrNumber?: string;
  deliveryChallan?: string;
  dispatchDate?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const getDDMMYYYY = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  let cleanStr = dateStr;
  if (dateStr.includes('T')) {
    cleanStr = dateStr.split('T')[0];
  }
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) { // DD-MM-YYYY
        return cleanStr;
      } else if (parts[0].length === 4) { // YYYY-MM-DD
        const d = parts[2].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[0];
        return `${d}-${m}-${y}`;
      }
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${d.getFullYear()}`;
};

const calculateStatus = (paid: number, amount: number, dueDateStr: string): InvoiceStatus => {
  if (paid >= amount && amount > 0) return 'Paid';
  if (paid > 0) return 'Partially Paid';
  
  let isOverdue = false;
  if (dueDateStr && dueDateStr !== '-') {
    const parts = dueDateStr.split('-');
    let due = new Date(NaN);
    if (parts.length === 3) {
      if (parts[2].length === 4) { 
        due = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else if (parts[0].length === 4) { 
        due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    if (isNaN(due.getTime())) {
      due = new Date(dueDateStr);
    }
    if (!isNaN(due.getTime()) && due < new Date()) {
      isOverdue = true;
    }
  }
  return isOverdue ? 'Overdue' : 'Unpaid';
};

export default function InvoiceDownload() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const loggedInDistributor = useMemo(() => {
    const raw = localStorage.getItem('pharma_erp_distributors');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) {
          return {
            name: parsed[0].name || parsed[0].distributorName || 'Unknown',
            code: parsed[0].code || parsed[0].distributorCode || parsed[0].id || 'DIST-001'
          };
        }
      } catch (e) {}
    }
    return { name: 'Metro Pharma Distributors', code: 'DIST-001' };
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<'Purchase' | 'Sales'>('Purchase');

  const loadInvoices = () => {
    // 1. Load Purchase Invoices from local storage
    const saved = localStorage.getItem('pharma_erp_invoices');
    let parsed: Invoice[] = saved ? JSON.parse(saved) : [];
    
    const mappedPurchases = parsed
      .filter(inv => inv.invoiceType === 'Purchase') // Keep only purchases from the old storage
      .map(inv => {
        const amt = inv.amount || 0;
        const paid = inv.paidAmount || 0;
        const outst = inv.outstandingAmount ?? Math.max(0, amt - paid);
        return {
          ...inv,
          invoiceType: 'Purchase' as const,
          date: getDDMMYYYY(inv.date),
          dueDate: getDDMMYYYY(inv.dueDate),
          status: calculateStatus(paid, amt, inv.dueDate),
          outstandingAmount: outst
        };
      });

    // 2. Load Sales Invoices from salesInvoiceService
    const rawSalesInvoices = activeRole === ROLE_DISTRIBUTOR
      ? salesInvoiceService.getDistributorSalesInvoices(loggedInDistributor.code)
      : salesInvoiceService.getAll();

    const mappedSales = rawSalesInvoices.map(inv => {
      const amt = inv.grandTotal || 0;
      // In a real system, you might track payments. Here we assume 0 paid if not explicitly managed
      const paid = inv.paymentStatus === 'Paid' ? amt : 0; 
      const outst = Math.max(0, amt - paid);
      
      const mappedItems: InvoiceItem[] = inv.items.map((it: any) => ({
        id: it.id,
        productName: it.productName,
        productCode: it.productCode,
        quantity: it.qty ?? it.quantity ?? 0,
        unitPrice: it.ptr ?? it.rate ?? it.unitPrice ?? 0,
        gstPct: it.gst ?? it.gstPct ?? 0,
        lineAmount: it.amount ?? it.lineAmount ?? 0,
        batchNumber: it.batchNumber,
        expiry: it.expiry
      }));

      // Find dispatch details to extract Transporter, LR, etc if possible.
      const dispatchesRaw = localStorage.getItem('pharma_erp_outbound_dispatches');
      let dispatchInfo: any = {};
      if (dispatchesRaw) {
        try {
          const dispatches = JSON.parse(dispatchesRaw);
          const dispatch = dispatches.find((d: any) => d.dispatchNo === inv.dispatchNo);
          if (dispatch) {
            dispatchInfo = {
              transporterName: dispatch.transporterName || dispatch.transporter,
              vehicleNumber: dispatch.vehicleNumber || dispatch.vehicleNo,
              lrNumber: dispatch.lrNumber || dispatch.lrNo,
              deliveryChallan: dispatch.deliveryChallan || dispatch.challanNo,
              dispatchDate: getDDMMYYYY(dispatch.dispatchDate)
            };
          }
        } catch(e) {}
      }

      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        orderNo: inv.orderNo,
        retailer: inv.retailerName || inv.retailer,
        retailerCode: inv.retailerCode || (inv as any).retailerCode || '',
        distributorCode: inv.distributorCode,
        billingAddress: inv.billingAddress,
        gstNumber: 'N/A', // fallback
        date: getDDMMYYYY(inv.date),
        dueDate: getDDMMYYYY(inv.date), // default to same as invoice date
        amount: amt,
        subtotal: inv.taxableAmount,
        gstAmount: inv.totalGst,
        paidAmount: paid,
        outstandingAmount: outst,
        status: inv.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
        items: mappedItems,
        invoiceType: 'Sales' as const,
        dispatchNo: inv.dispatchNo,
        transporterName: dispatchInfo.transporterName,
        vehicleNumber: dispatchInfo.vehicleNumber,
        lrNumber: dispatchInfo.lrNumber,
        deliveryChallan: dispatchInfo.deliveryChallan,
        dispatchDate: dispatchInfo.dispatchDate
      } as Invoice;
    });

    setInvoices([...mappedPurchases, ...mappedSales]);
  };

  useEffect(() => {
    loadInvoices();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pharma_erp_sales_invoices' || e.key === 'pharma_erp_outbound_dispatches') {
        loadInvoices();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a polling mechanism as fallback since storage events don't fire in the same window
    const interval = setInterval(() => {
      loadInvoices();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [activeRole, loggedInDistributor.code]);

  const filteredData = useMemo(() => {
    return invoices.filter((item) => {
      // Distributor filtering
      if (activeRole === ROLE_DISTRIBUTOR) {
        if (item.distributorCode && item.distributorCode !== loggedInDistributor.code) {
          return false;
        }
      }

      if (item.invoiceType !== activeTab) return false;

      let matchSearch = false;
      if (activeTab === 'Purchase') {
        matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
                      (item.supplierName || '').toLowerCase().includes(search.toLowerCase());
      } else {
        matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
                      (item.orderNo || '').toLowerCase().includes(search.toLowerCase()) ||
                      (item.retailer || '').toLowerCase().includes(search.toLowerCase());
      }

      const matchStatus = statusFilter ? item.status === statusFilter : true;
      
      const matchInvDate = invoiceDateFilter 
        ? item.date === getDDMMYYYY(invoiceDateFilter) 
        : true;
        
      const matchDueDate = dueDateFilter 
        ? item.dueDate === getDDMMYYYY(dueDateFilter) 
        : true;

      return matchSearch && matchStatus && matchInvDate && matchDueDate;
    });
  }, [invoices, search, statusFilter, invoiceDateFilter, dueDateFilter, activeTab, activeRole, loggedInDistributor.code]);

  const formatPdfCurrency = (val: number) => {
    const num = Number(val) || 0;
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num);
    return `Rs. ${formatted}`;
  };

  const generatePDF = (invoice: Invoice | null) => {
    if (!invoice) return;
    const doc = new jsPDF();

    // 1. Company Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text('MJ HEALTHCARE ERP', 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text('Plot No. 45, Pharma City, Industrial Park, Hyderabad - 500072', 14, 26);
    doc.text('GSTIN: 36AAACM1234F1Z9 | License: DL-HYD-2024-88', 14, 31);
    doc.text('Email: info@mjhealthcare.com | Phone: +91 98765 00000', 14, 36);

    // Document Title
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text(invoice.invoiceType === 'Purchase' ? 'PURCHASE TAX INVOICE' : 'SALES TAX INVOICE', 135, 20);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 42, 196, 42);

    // 2. Invoice Meta & Supplier/Entity Info
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(invoice.invoiceType === 'Purchase' ? 'Supplier Details (Seller):' : 'Retailer Details (Buyer):', 14, 48);
    
    doc.setFont("helvetica", "normal");
    if (invoice.invoiceType === 'Purchase') {
      doc.text(`Supplier: ${invoice.supplierName || 'Apex Pharma Ltd'}`, 14, 54);
      doc.text(`GSTIN: ${invoice.gstNumber || '36APEX1234F1Z5'}`, 14, 59);
      doc.text(`Address: ${invoice.billingAddress || 'Industrial Area, Phase II, Hyderabad'}`, 14, 64);
    } else {
      doc.text(`Retailer: ${(invoice as any).retailer || 'N/A'}`, 14, 54);
      doc.text(`Code: ${(invoice as any).retailerCode || 'N/A'}`, 14, 59);
      doc.text(`GSTIN: ${invoice.gstNumber || 'N/A'}`, 14, 64);
      doc.text(`Address: ${invoice.billingAddress || 'Main Road, Hyderabad'}`, 14, 69);
    }

    doc.setFont("helvetica", "bold");
    doc.text('Invoice Details:', 125, 48);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 125, 54);
    if (invoice.orderNo) {
      doc.text(`Order Ref: ${invoice.orderNo}`, 125, 59);
    }
    doc.text(`Invoice Date: ${invoice.date}`, 125, invoice.orderNo ? 64 : 59);
    doc.text(`Due Date: ${invoice.dueDate}`, 125, invoice.orderNo ? 69 : 64);
    doc.text(`Payment Status: ${invoice.status}`, 125, invoice.orderNo ? 74 : 69);

    // 3. Resolve Line Items
    let items = invoice.items || [];
    if (items.length === 0) {
      const invTotal = invoice.amount > 0 ? invoice.amount : 15680;
      items = [
        {
          id: '1',
          productName: 'Amoxicillin 500mg Capsules',
          productCode: 'PRD-AMOX-500',
          batchNumber: 'BAT-2024-09',
          expiry: '12/2026',
          quantity: 100,
          unitPrice: Math.round((invTotal / 1.12 / 100) * 100) / 100,
          gstPct: 12,
          lineAmount: Math.round((invTotal / 1.12) * 100) / 100
        }
      ];
    }

    const tableBody = items.map((it, idx) => [
      String(idx + 1),
      it.productName || 'Pharmaceutical Item',
      it.productCode || `PRD-00${idx + 1}`,
      it.batchNumber || 'BAT-001',
      it.expiry || '12/2026',
      String(it.quantity || 1),
      formatPdfCurrency(it.unitPrice || 0),
      `${it.gstPct || 12}%`,
      formatPdfCurrency(it.lineAmount || (it.quantity * it.unitPrice))
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['#', 'Product Name', 'Code', 'Batch', 'Expiry', 'Qty', 'PTS Rate', 'GST', 'Line Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [22, 60, 120], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 140;

    // 4. Amount Financial Summary Box
    const totalAmt = invoice.amount > 0 ? invoice.amount : 15680;
    const paidAmt = invoice.paidAmount || (invoice.status === 'Paid' ? totalAmt : 0);
    const outstandingAmt = invoice.outstandingAmount ?? Math.max(0, totalAmt - paidAmt);
    const subtotal = invoice.subtotal || (totalAmt / 1.12);
    const gstAmt = invoice.gstAmount || (totalAmt - subtotal);

    doc.setFillColor(245, 247, 250);
    doc.rect(115, finalY, 81, 42, 'F');
    doc.setDrawColor(220, 225, 230);
    doc.rect(115, finalY, 81, 42, 'S');

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    doc.text('Subtotal (Excl. Tax):', 119, finalY + 7);
    doc.text(formatPdfCurrency(subtotal), 190, finalY + 7, { align: 'right' });

    doc.text('GST Amount (12%):', 119, finalY + 14);
    doc.text(formatPdfCurrency(gstAmt), 190, finalY + 14, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text('Total Payable Value:', 119, finalY + 22);
    doc.text(formatPdfCurrency(totalAmt), 190, finalY + 22, { align: 'right' });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(16, 185, 129);
    doc.text('Amount Paid:', 119, finalY + 29);
    doc.text(formatPdfCurrency(paidAmt), 190, finalY + 29, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72);
    doc.text('Outstanding Balance:', 119, finalY + 36);
    doc.text(formatPdfCurrency(outstandingAmt), 190, finalY + 36, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text('This is a computer generated purchase invoice and does not require a physical signature.', 14, finalY + 48);

    doc.save(`Invoice-${invoice.invoiceNo}.pdf`);
  };

  const purchaseColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'INVOICE NO', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'supplierName', label: 'SUPPLIER', render: (row) => <span className="text-slate-700">{row.supplierName || 'N/A'}</span> },
    { key: 'date', label: 'INVOICE DATE', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-semibold' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'INVOICE AMOUNT', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'PAYMENT STATUS', render: (row) => <Badge variant={row.status === 'Paid' ? 'success' : row.status === 'Partially Paid' ? 'info' : row.status === 'Unpaid' ? 'warning' : 'danger'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewInvoice(row)} className="text-slate-500 hover:text-slate-800" title="View Details"><ReceiptText className="w-4 h-4" /></button>
          <button onClick={() => generatePDF(row)} className="text-slate-500 hover:text-slate-800" title="Download Statement PDF"><Download className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  const salesColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'INVOICE NO', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'orderNo', label: 'ORDER NO', render: (row) => <span className="text-slate-600">{(row as any).orderNo}</span> },
    { key: 'retailer', label: 'RETAILER', render: (row) => <span className="text-slate-700">{(row as any).retailer || 'N/A'}</span> },
    { key: 'date', label: 'INVOICE DATE', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-semibold' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'INVOICE AMOUNT', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'PAYMENT STATUS', render: (row) => <Badge variant={row.status === 'Paid' ? 'success' : row.status === 'Partially Paid' ? 'info' : row.status === 'Unpaid' ? 'warning' : 'danger'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewInvoice(row)} className="text-slate-500 hover:text-slate-800" title="View Details"><ReceiptText className="w-4 h-4" /></button>
          <button onClick={() => salesInvoiceService.downloadInvoice(row.invoiceNo, 'Distributor')} className="text-slate-500 hover:text-slate-800" title="Download Statement PDF"><Download className="w-4 h-4" /></button>
          <button onClick={() => salesInvoiceService.printInvoice(row.invoiceNo, 'Distributor')} className="text-slate-500 hover:text-slate-800" title="Print Statement PDF"><Printer className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="p-1 text-slate-700">
      <PageHeader
        title="Invoice Download"
        subtitle="View and download distributor purchase and sales invoices."
        actions={<></>}
      />

      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'Purchase'
              ? 'border-[#163c78] text-[#163c78]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => setActiveTab('Purchase')}
        >
          Purchase Invoices
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'Sales'
              ? 'border-[#163c78] text-[#163c78]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => setActiveTab('Sales')}
        >
          Sales Invoices
        </button>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder={activeTab === 'Purchase' ? 'Search invoice or supplier...' : 'Search invoice, order or retailer...'} />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Status', value: '' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="Filters"
        />
        <input 
          type="date" 
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={invoiceDateFilter}
          onChange={(e) => setInvoiceDateFilter(e.target.value)}
          title="Invoice Date"
        />
        <input 
          type="date" 
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={dueDateFilter}
          onChange={(e) => setDueDateFilter(e.target.value)}
          title="Due Date"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={activeTab === 'Purchase' ? purchaseColumns : salesColumns} data={filteredData} />
      </TableCard>

      <Drawer open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={viewInvoice?.invoiceType === 'Purchase' ? 'Purchase Invoice Details' : 'Sales Invoice Details'}>
        {viewInvoice && (
          <div className="space-y-6 text-sm">
            
            {/* Invoice Information */}
            <div>
              <h3 className="font-semibold text-slate-900 border-b pb-2 mb-3">Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Invoice Number" value={viewInvoice.invoiceNo} />
                {viewInvoice.invoiceType === 'Sales' && (
                  <DrawerField label="Order Number" value={viewInvoice.orderNo} />
                )}
                <DrawerField label="Invoice Date" value={viewInvoice.date} />
                <DrawerField label="Due Date" value={viewInvoice.dueDate} />
                <DrawerField label="Payment Status" value={viewInvoice.status} />
                <DrawerField 
                  label="Price Basis" 
                  value={viewInvoice.invoiceType === 'Purchase' ? 'PTS (Price to Stockist)' : 'PTR (Price to Retailer)'} 
                />
              </div>
            </div>

            {/* Entity Information */}
            <div>
              <h3 className="font-semibold text-slate-900 border-b pb-2 mb-3">
                {viewInvoice.invoiceType === 'Purchase' ? 'Supplier Information' : 'Retailer Information'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {viewInvoice.invoiceType === 'Purchase' ? (
                  <>
                    <DrawerField label="Supplier Name" value={viewInvoice.supplierName || 'N/A'} />
                    <DrawerField label="GST Number" value={viewInvoice.gstNumber || 'N/A'} />
                    <div className="col-span-2">
                      <DrawerField label="Billing Address" value={viewInvoice.billingAddress || 'N/A'} />
                    </div>
                  </>
                ) : (
                  <>
                    <DrawerField label="Retailer Name" value={viewInvoice.retailer || 'N/A'} />
                    <DrawerField label="Retailer Code" value={viewInvoice.retailerCode || 'N/A'} />
                    <DrawerField label="GST Number" value={viewInvoice.gstNumber || 'N/A'} />
                    <div className="col-span-2">
                      <DrawerField label="Billing Address" value={viewInvoice.billingAddress || 'N/A'} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dispatch Information (Sales Only) */}
            {viewInvoice.invoiceType === 'Sales' && viewInvoice.dispatchNo && (
              <div>
                <h3 className="font-semibold text-slate-900 border-b pb-2 mb-3">Dispatch Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DrawerField label="Dispatch Number" value={viewInvoice.dispatchNo} />
                  <DrawerField label="Delivery Challan" value={viewInvoice.deliveryChallan || 'N/A'} />
                  <DrawerField label="Dispatch Date" value={viewInvoice.dispatchDate || 'N/A'} />
                  <DrawerField label="Transporter Name" value={viewInvoice.transporterName || 'N/A'} />
                  <DrawerField label="Vehicle Number" value={viewInvoice.vehicleNumber || 'N/A'} />
                  <DrawerField label="LR Number" value={viewInvoice.lrNumber || 'N/A'} />
                </div>
              </div>
            )}

            {/* Amount Summary */}
            <div>
              <h3 className="font-semibold text-slate-900 border-b pb-2 mb-3">Amount Summary</h3>
              <div className="bg-slate-50 p-4 border rounded-xl space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(viewInvoice.subtotal)}</span></div>
                <div className="flex justify-between"><span>GST Amount:</span><span>{formatCurrency(viewInvoice.gstAmount)}</span></div>
                <div className="flex justify-between font-bold border-y py-2 text-slate-900"><span>Invoice Amount:</span><span>{formatCurrency(viewInvoice.amount)}</span></div>
                <div className="flex justify-between"><span>Paid Amount:</span><span className="text-emerald-600">{formatCurrency(viewInvoice.paidAmount)}</span></div>
                <div className="flex justify-between font-semibold"><span>Outstanding Amount:</span><span className="text-rose-600">{formatCurrency(viewInvoice.outstandingAmount)}</span></div>
              </div>
            </div>

            {/* Products Table */}
            <div>
              <h3 className="font-semibold text-slate-900 border-b pb-2 mb-3">Products</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-2 font-medium">Product</th>
                      <th className="p-2 font-medium">Code</th>
                      {viewInvoice.invoiceType === 'Sales' && (
                        <>
                          <th className="p-2 font-medium">Batch</th>
                          <th className="p-2 font-medium">Expiry</th>
                        </>
                      )}
                      <th className="p-2 font-medium text-right">Qty</th>
                      <th className="p-2 font-medium text-right">
                        {viewInvoice.invoiceType === 'Purchase' ? 'PTS' : 'PTR'}
                      </th>
                      <th className="p-2 font-medium text-right">GST %</th>
                      <th className="p-2 font-medium text-right">Line Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viewInvoice.items && viewInvoice.items.length > 0 ? (
                      viewInvoice.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2">{item.productName}</td>
                          <td className="p-2">{item.productCode}</td>
                          {viewInvoice.invoiceType === 'Sales' && (
                            <>
                              <td className="p-2">{item.batchNumber || '-'}</td>
                              <td className="p-2">{item.expiry || '-'}</td>
                            </>
                          )}
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-2 text-right">{item.gstPct}%</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(item.lineAmount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={viewInvoice.invoiceType === 'Sales' ? 8 : 6} className="p-4 text-center text-slate-500">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
}