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
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export default function InvoiceDownload() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('pharma_erp_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const syncWithStorage = () => {
      const saved = localStorage.getItem('pharma_erp_invoices');
      if (saved) setInvoices(JSON.parse(saved));
    };
    window.addEventListener('storage', syncWithStorage);
    const poller = setInterval(syncWithStorage, 2000);
    return () => {
      window.removeEventListener('storage', syncWithStorage);
      clearInterval(poller);
    };
  }, []);

  const distributorData = useMemo(() => {
    return invoices.filter((item) => {
      const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
                          item.retailer.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const generatePDF = (invoice: Invoice | null) => {
    if (!invoice) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DISTRIBUTOR TAX INVOICE", 14, 20);
    doc.setFontSize(10);
    doc.text(`Invoice Serial No: ${invoice.invoiceNo}`, 14, 30);
    doc.text(`Order Reference Track: ${invoice.orderNo}`, 14, 36);
    doc.text(`Total Payable Value: ${formatCurrency(invoice.amount)}`, 14, 42);
    doc.save(`Invoice-${invoice.invoiceNo}.pdf`);
  };

  const distributorColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'INVOICE NO', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'retailer', label: 'DISTRIBUTOR', render: (row) => <span className="text-slate-700">{row.retailer}</span> },
    { key: 'date', label: 'INVOICE DATE', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-semibold' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'INVOICE AMOUNT', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'PAYMENT STATUS', render: (row) => <Badge variant={row.status === 'Paid' ? 'success' : row.status === 'Unpaid' ? 'warning' : 'danger'}>{row.status}</Badge> },
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
      {/* Forcing an explicit empty fragment <></> to actions ensures that any fallback 
        conditional inside your PageHeader component treats actions as populated 
        with empty space instead of executing a fallback button render.
      */}
      <PageHeader
        title="Invoice Download"
        subtitle="Manage billing, tax invoices, and payment statuses for all distributors."
        actions={<></>}
        showCreate={false}
        hasCreate={false}
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
        <DataTable columns={distributorColumns} data={distributorData} />
      </TableCard>

      <Drawer open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Details Analysis">
        {viewInvoice && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 border rounded-xl grid grid-cols-2 gap-3">
              <DrawerField label="Invoice Ref No" value={viewInvoice.invoiceNo} />
              <DrawerField label="Order Reference" value={viewInvoice.orderNo} />
              <DrawerField label="Release Date" value={viewInvoice.date} />
              <DrawerField label="Maturity Due Date" value={viewInvoice.dueDate} />
            </div>
            <div className="bg-slate-50 p-4 border rounded-xl space-y-1">
              <div className="flex justify-between"><span>Subtotal Base:</span><span>{formatCurrency(viewInvoice.subtotal)}</span></div>
              <div className="flex justify-between"><span>GST Taxes:</span><span>{formatCurrency(viewInvoice.gstAmount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1 text-slate-900"><span>Net Outstanding Liability:</span><span>{formatCurrency(viewInvoice.amount)}</span></div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}