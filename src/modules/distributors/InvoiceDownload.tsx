import { useState, useEffect, useMemo } from 'react';             
import { Download, ReceiptText } from 'lucide-react';
import { jsPDF } from 'jspdf';
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
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const getDDMMYYYY = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) { // DD-MM-YYYY
        return dateStr;
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

  useEffect(() => {
    const saved = localStorage.getItem('pharma_erp_invoices');
    let parsed: Invoice[] = saved ? JSON.parse(saved) : [];
    
    setInvoices(parsed.map(inv => {
      const amt = inv.amount || 0;
      const paid = inv.paidAmount || 0;
      const outst = inv.outstandingAmount ?? Math.max(0, amt - paid);
      return {
        ...inv,
        invoiceType: inv.invoiceType || 'Sales',
        date: getDDMMYYYY(inv.date),
        dueDate: getDDMMYYYY(inv.dueDate),
        status: calculateStatus(paid, amt, inv.dueDate),
        outstandingAmount: outst
      };
    }));
  }, []);

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

  const generatePDF = (invoice: Invoice | null) => {
    if (!invoice) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    
    if (invoice.invoiceType === 'Purchase') {
      doc.text("PURCHASE TAX INVOICE", 14, 20);
      doc.setFontSize(10);
      doc.text(`Invoice Serial No: ${invoice.invoiceNo}`, 14, 30);
      doc.text(`Supplier: ${invoice.supplierName || 'N/A'}`, 14, 36);
      doc.text(`Invoice Date: ${invoice.date}`, 14, 42);
      doc.text(`Due Date: ${invoice.dueDate}`, 14, 48);
      doc.text(`Total Payable Value: ${formatCurrency(invoice.amount)}`, 14, 54);
      doc.text(`Payment Status: ${invoice.status}`, 14, 60);
    } else {
      doc.text("SALES TAX INVOICE", 14, 20);
      doc.setFontSize(10);
      doc.text(`Invoice Serial No: ${invoice.invoiceNo}`, 14, 30);
      doc.text(`Order Reference Track: ${invoice.orderNo}`, 14, 36);
      doc.text(`Retailer: ${(invoice as any).retailer || 'N/A'}`, 14, 42);
      doc.text(`Invoice Date: ${invoice.date}`, 14, 48);
      doc.text(`Due Date: ${invoice.dueDate}`, 14, 54);
      doc.text(`Total Payable Value: ${formatCurrency(invoice.amount)}`, 14, 60);
      doc.text(`Payment Status: ${invoice.status}`, 14, 66);
    }
    
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
          <button onClick={() => generatePDF(row)} className="text-slate-500 hover:text-slate-800" title="Download Statement PDF"><Download className="w-4 h-4" /></button>
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
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-2 text-right">{item.gstPct}%</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(item.lineAmount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">No products found.</td>
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