import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, ReceiptText, Plus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
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
  retailer: string;
  retailerCode: string;
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
  createdBy: 'ADMIN' | 'DISTRIBUTOR';
}

const initialMockInvoices: Invoice[] = [
  { 
    id: '1', invoiceNo: 'INV-26-9912', orderNo: 'ORD-10045', retailer: 'Metro Pharma Distributors', retailerCode: 'DIST-001',
    billingAddress: '123 Warehouse Lane, Karimnagar', gstNumber: '36ABCDE1234F1Z5',
    date: '01-Oct-2026', dueDate: '31-Oct-2026', amount: 150000, subtotal: 133928.57, gstAmount: 16071.43,
    paidAmount: 0, outstandingAmount: 150000, status: 'Unpaid', createdBy: 'ADMIN',
    items: [{ id: 'i1', productName: 'Amoxicillin 500mg', productCode: 'AMX-500', quantity: 1000, unitPrice: 150, gstPct: 12, lineAmount: 150000 }]
  },
  { 
    id: '2', invoiceNo: 'INV-26-9900', orderNo: 'ORD-10022', retailer: 'Carewell Agencies', retailerCode: 'DIST-002',
    billingAddress: '45 Wellness Blvd, Hyderabad', gstNumber: '36FGHIJ5678K1Z2',
    date: '15-Aug-2026', dueDate: '15-Sep-2026', amount: 420000, subtotal: 375000, gstAmount: 45000,
    paidAmount: 0, outstandingAmount: 420000, status: 'Overdue', createdBy: 'ADMIN',
    items: [{ id: 'i2', productName: 'Paracetamol 650mg', productCode: 'PRC-650', quantity: 4200, unitPrice: 100, gstPct: 12, lineAmount: 420000 }]
  },
  { 
    id: '3', invoiceNo: 'INV-26-9890', orderNo: 'ORD-10011', retailer: 'Global Health Supply', retailerCode: 'DIST-003',
    billingAddress: '78 Ring Road, Warangal', gstNumber: '36KLMNO9012P1Z3',
    date: '10-Sep-2026', dueDate: '10-Oct-2026', amount: 85000, subtotal: 75892.86, gstAmount: 9107.14,
    paidAmount: 85000, outstandingAmount: 0, status: 'Paid', createdBy: 'ADMIN',
    items: [{ id: 'i3', productName: 'Vitamin C Strips', productCode: 'VTC-100', quantity: 850, unitPrice: 100, gstPct: 12, lineAmount: 85000 }]
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export default function Invoice() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('pharma_erp_invoices');
    return saved ? JSON.parse(saved) : initialMockInvoices;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newInvoice, setNewInvoice] = useState({ invoiceNo: '', orderNo: '', retailer: '', retailerCode: '', billingAddress: '', dueDate: '' });
  const [formItems, setFormItems] = useState<InvoiceItem[]>([{ id: '1', productName: '', productCode: '', quantity: 1, unitPrice: 0, gstPct: 12, lineAmount: 0 }]);

  useEffect(() => {
    localStorage.setItem('pharma_erp_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Listen to entries added by distributors real-time
  useEffect(() => {
    const syncWithStorage = () => {
      const saved = localStorage.getItem('pharma_erp_invoices');
      if (saved) setInvoices(JSON.parse(saved));
    };
    window.addEventListener('storage', syncWithStorage);
    return () => window.removeEventListener('storage', syncWithStorage);
  }, []);

  const filteredData = useMemo(() => {
    return invoices.filter((item) => {
      const searchStr = search.toLowerCase();
      return (item.invoiceNo.toLowerCase().includes(searchStr) || 
              item.retailer.toLowerCase().includes(searchStr)) &&
             (statusFilter ? item.status === statusFilter : true);
    });
  }, [invoices, search, statusFilter]);

  const handleItemChange = (index: number, fields: Partial<InvoiceItem>) => {
    const updated = [...formItems];
    const current = { ...updated[index], ...fields };
    current.lineAmount = Number((current.quantity * current.unitPrice).toFixed(2));
    updated[index] = current;
    setFormItems(updated);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalLineAmount = formItems.reduce((sum, item) => sum + item.lineAmount, 0);
    const subtotal = Number((totalLineAmount / 1.12).toFixed(2));
    const gstAmount = Number((totalLineAmount - subtotal).toFixed(2));

    const invoicePayload: Invoice = {
      id: Date.now().toString(),
      invoiceNo: newInvoice.invoiceNo.startsWith('INV-') ? newInvoice.invoiceNo : `INV-${newInvoice.invoiceNo}`,
      orderNo: newInvoice.orderNo.startsWith('ORD-') ? newInvoice.orderNo : `ORD-${newInvoice.orderNo}`,
      retailer: newInvoice.retailer,
      retailerCode: newInvoice.retailerCode || 'DIST-04',
      billingAddress: newInvoice.billingAddress || 'Distributor Facility Logistics Hub',
      gstNumber: '36ABCDE1234F1Z5',
      date: '26-Jun-2026',
      dueDate: newInvoice.dueDate || '26-Jul-2026',
      amount: totalLineAmount,
      subtotal,
      gstAmount,
      paidAmount: 0,
      outstandingAmount: totalLineAmount,
      status: 'Unpaid',
      items: formItems,
      createdBy: 'ADMIN'
    };

    setInvoices([invoicePayload, ...invoices]);
    setShowCreateModal(false);
    setNewInvoice({ invoiceNo: '', orderNo: '', retailer: '', retailerCode: '', billingAddress: '', dueDate: '' });
    setFormItems([{ id: '1', productName: '', productCode: '', quantity: 1, unitPrice: 0, gstPct: 12, lineAmount: 0 }]);
  };

  const generatePDF = (invoice: Invoice | null) => {
    if (!invoice) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("MJH HEALTHCARE - INVOICE LEDGER", 14, 20);
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 14, 30);
    doc.text(`Distributor: ${invoice.retailer}`, 14, 36);
    doc.text(`Total Value: ${formatCurrency(invoice.amount)}`, 14, 42);
    doc.text(`System Flag: Generated by ${invoice.createdBy}`, 14, 48);
    doc.save(`${invoice.invoiceNo}.pdf`);
  };

  const adminColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'INVOICE NO', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'retailer', label: 'DISTRIBUTOR', render: (row) => <span className="font-semibold text-slate-700">{row.retailer} {row.createdBy === 'DISTRIBUTOR' && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">Inward PO</span>}</span> },
    { key: 'date', label: 'INVOICE DATE', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-semibold' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'INVOICE AMOUNT', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'PAYMENT STATUS', render: (row) => <Badge variant={row.status === 'Paid' ? 'success' : row.status === 'Unpaid' ? 'warning' : 'danger'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewInvoice(row)} className="text-slate-500 hover:text-slate-800"><ReceiptText className="w-4 h-4" /></button>
          <button onClick={() => generatePDF(row)} className="text-slate-500 hover:text-slate-800"><Download className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="p-1 text-slate-700">
      <PageHeader
        title="Invoice Download"
        subtitle="Manage billing, tax invoices, and payment statuses for all distributors."
        actions={
          activeRole === ROLE_SUPER_ADMIN && (
            <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Create Invoice
            </ActionButton>
          )
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or distributor..." />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Status', value: '' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="Filters"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={adminColumns} data={filteredData} />
      </TableCard>

      {/* --- Create Invoice Modal --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border shadow-xl flex flex-col max-h-[85vh] text-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Compile Corporate Distribution Invoice</h3>
            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block font-medium mb-1">Invoice Number</label>
                <input required placeholder="26-XXXX" value={newInvoice.invoiceNo} onChange={e => setNewInvoice({...newInvoice, invoiceNo: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Order Ref ID</label>
                <input required placeholder="ORD-XXXXX" value={newInvoice.orderNo} onChange={e => setNewInvoice({...newInvoice, orderNo: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Select Target Distributor Profile</label>
                <input required placeholder="e.g. Metro Pharma Distributors" value={newInvoice.retailer} onChange={e => setNewInvoice({...newInvoice, retailer: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Maturity Due Date</label>
                <input type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} className="w-full border rounded p-2" />
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Item Lines Matrix</span>
                  <button type="button" onClick={() => setFormItems([...formItems, { id: Date.now().toString(), productName: '', productCode: '', quantity: 1, unitPrice: 0, gstPct: 12, lineAmount: 0 }])} className="text-violet-600 font-bold">+ Line</button>
                </div>
                {formItems.map((item, index) => (
                  <div key={item.id} className="flex gap-2 mb-2 items-center">
                    <input required placeholder="Product Description" value={item.productName} onChange={e => handleItemChange(index, { productName: e.target.value })} className="flex-1 border rounded p-1" />
                    <input required type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, { quantity: Number(e.target.value) })} className="w-12 border rounded p-1" />
                    <input required type="number" placeholder="Price" value={item.unitPrice} onChange={e => handleItemChange(index, { unitPrice: Number(e.target.value) })} className="w-16 border rounded p-1" />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-violet-600 text-white rounded font-medium">Issue Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- View Drawer --- */}
      <Drawer open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Specification Ledger">
        {viewInvoice && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 border rounded-xl grid grid-cols-2 gap-3">
              <DrawerField label="Invoice Ref" value={viewInvoice.invoiceNo} />
              <DrawerField label="Order Ref" value={viewInvoice.orderNo} />
              <DrawerField label="Distributor Profile" value={viewInvoice.retailer} />
              <DrawerField label="Origin Type" value={viewInvoice.createdBy === 'ADMIN' ? 'Sales Invoice' : 'Inward Purchase Order'} />
            </div>
            <div className="bg-slate-50 p-4 border rounded-xl space-y-1">
              <div className="flex justify-between"><span>Taxable Baseline:</span><span>{formatCurrency(viewInvoice.subtotal)}</span></div>
              <div className="flex justify-between"><span>GST Computed:</span><span>{formatCurrency(viewInvoice.gstAmount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1 text-slate-900"><span>Gross Liability:</span><span>{formatCurrency(viewInvoice.amount)}</span></div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}