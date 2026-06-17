import { useState, useRef, useEffect } from 'react';
import { Download, Filter, ReceiptText, ChevronDown, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyInvoiceTemplate } from '../../documents/templates/InvoiceTemplate';
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
import { type Column, type BadgeVariant } from './components/shared';
import { ROLE_SUPER_ADMIN, ROLE_RETAILER } from '../../constants/roles';

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

const mockData: Invoice[] = [
  { 
    id: '1', invoiceNo: 'INV-RET-9912', orderNo: 'ORD-10045', retailer: 'Apollo Pharmacy', retailerCode: 'RET-001',
    billingAddress: '123 Health Ave, Bangalore, 560001', gstNumber: '29ABCDE1234F1Z5',
    date: '01-Oct-2026', dueDate: '15-Oct-2026', amount: 45000, subtotal: 40178.57, gstAmount: 4821.43,
    paidAmount: 0, outstandingAmount: 45000, status: 'Unpaid',
    items: [
      { id: 'i1', productName: 'Amoxicillin 500mg', productCode: 'AMX-500', quantity: 200, unitPrice: 150, gstPct: 12, lineAmount: 30000 },
      { id: 'i2', productName: 'Paracetamol 650mg', productCode: 'PRC-650', quantity: 100, unitPrice: 101.78, gstPct: 12, lineAmount: 10178.57 }
    ]
  },
  { 
    id: '2', invoiceNo: 'INV-RET-9900', orderNo: 'ORD-10022', retailer: 'MedPlus Store', retailerCode: 'RET-002',
    billingAddress: '45 Wellness Blvd, Mumbai, 400001', gstNumber: '27FGHIJ5678K1Z2',
    date: '15-Sep-2026', dueDate: '30-Sep-2026', amount: 12000, subtotal: 10714.29, gstAmount: 1285.71,
    paidAmount: 0, outstandingAmount: 12000, status: 'Overdue',
    items: [
      { id: 'i3', productName: 'Cough Syrup 100ml', productCode: 'CGH-100', quantity: 100, unitPrice: 107.14, gstPct: 12, lineAmount: 10714.29 }
    ]
  },
  { 
    id: '3', invoiceNo: 'INV-RET-9890', orderNo: 'ORD-10010', retailer: 'Apollo Pharmacy', retailerCode: 'RET-001',
    billingAddress: '123 Health Ave, Bangalore, 560001', gstNumber: '29ABCDE1234F1Z5',
    date: '10-Sep-2026', dueDate: '25-Sep-2026', amount: 5500, subtotal: 4910.71, gstAmount: 589.29,
    paidAmount: 5500, outstandingAmount: 0, status: 'Paid',
    items: [
      { id: 'i4', productName: 'Vitamin C 1000mg', productCode: 'VIT-C-1K', quantity: 50, unitPrice: 98.21, gstPct: 12, lineAmount: 4910.71 }
    ]
  },
  { 
    id: '4', invoiceNo: 'INV-RET-9885', orderNo: 'ORD-10005', retailer: 'Apollo Pharmacy', retailerCode: 'RET-001',
    billingAddress: '123 Health Ave, Bangalore, 560001', gstNumber: '29ABCDE1234F1Z5',
    date: '05-Sep-2026', dueDate: '20-Sep-2026', amount: 10000, subtotal: 8928.57, gstAmount: 1071.43,
    paidAmount: 5000, outstandingAmount: 5000, status: 'Partially Paid',
    items: [
      { id: 'i5', productName: 'Azithromycin 250mg', productCode: 'AZT-250', quantity: 100, unitPrice: 89.28, gstPct: 12, lineAmount: 8928.57 }
    ]
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Invoices() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_RETAILER;
  const isRetailer = activeRole === ROLE_RETAILER;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusVariant = (status: InvoiceStatus): BadgeVariant => {
    if (status === 'Paid') return 'success';
    if (status === 'Unpaid') return 'warning';
    if (status === 'Overdue') return 'danger';
    if (status === 'Partially Paid') return 'info';
    return 'neutral';
  };

  // Filter logic
  const baseData = isRetailer ? mockData.filter(d => d.retailer === 'Apollo Pharmacy') : mockData;
  const filteredData = baseData.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = item.invoiceNo.toLowerCase().includes(searchStr) || item.orderNo.toLowerCase().includes(searchStr);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const generatePDF = (invoice: Invoice | null, isDownload: boolean = true) => {
    if (!invoice) return;
    const doc = new jsPDF();
    
    // Use the shared template instead of inline layout
    applyInvoiceTemplate(doc, invoice, activeRole);
    
    if (isDownload) {
      doc.save(`${invoice.invoiceNo}.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  const adminColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'retailer', label: 'Retailer Name', render: (row) => <span className="font-semibold text-violet-700">{row.retailer}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'date', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-medium' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'Invoice Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Payment Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1" onClick={() => setViewInvoice(row)}>
            <ReceiptText className="w-4 h-4 mr-1" /> View Invoice
          </ActionButton>
          <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1" onClick={() => generatePDF(row)}>
            <Download className="w-4 h-4" />
          </ActionButton>
        </div>
      )
    }
  ];

  const retailerColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'date', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-medium' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'Invoice Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Payment Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1" onClick={() => setViewInvoice(row)}>
            <ReceiptText className="w-4 h-4 mr-1" /> View Invoice
          </ActionButton>
          <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1" onClick={() => generatePDF(row)}>
            <Download className="w-4 h-4" />
          </ActionButton>
        </div>
      )
    }
  ];

  const columns = isRetailer ? retailerColumns : adminColumns;

  // Drawer Items
  const invoiceItemColumns: Column<InvoiceItem>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-medium text-slate-900">{row.productName}</span> },
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="text-slate-500 text-xs">{row.productCode}</span> },
    { key: 'quantity', label: 'Quantity', render: (row) => <span className="text-slate-600">{row.quantity}</span> },
    { key: 'unitPrice', label: 'Unit Price', render: (row) => <span className="text-slate-600">{formatCurrency(row.unitPrice)}</span> },
    { key: 'gstPct', label: 'GST %', render: (row) => <span className="text-slate-600">{row.gstPct}%</span> },
    { key: 'lineAmount', label: 'Line Amount', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.lineAmount)}</span> },
  ];

  // Exports
  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredData.map(item => ({
        'Invoice Number': item.invoiceNo,
        'Retailer Name': item.retailer,
        'Order Number': item.orderNo,
        'Invoice Date': item.date,
        'Due Date': item.dueDate,
        'Invoice Amount': item.amount,
        'Payment Status': item.status
      }));
    } else {
      return filteredData.map(item => ({
        'Invoice Number': item.invoiceNo,
        'Order Number': item.orderNo,
        'Invoice Date': item.date,
        'Due Date': item.dueDate,
        'Invoice Amount': item.amount,
        'Payment Status': item.status
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "Invoices.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Invoices.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Invoice Register", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });
    doc.save("Invoices.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Invoice Access"
        subtitle="View invoices, billing details, due dates, and payment status."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV</button>
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or order number..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All', value: '' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No invoices found."
          />
        </div>
      </TableCard>

      {/* View Invoice Drawer */}
      <Drawer
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title="Invoice Details"
      >
        {viewInvoice && (
          <div className="space-y-6 pb-20">
            {/* Section 1: Invoice Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Invoice Number" value={<span className="font-semibold text-violet-700">{viewInvoice.invoiceNo}</span>} />
                <DrawerField label="Order Number" value={viewInvoice.orderNo} />
                <DrawerField label="Invoice Date" value={viewInvoice.date} />
                <DrawerField label="Due Date" value={<span className={viewInvoice.status === 'Overdue' ? 'text-rose-600 font-medium' : ''}>{viewInvoice.dueDate}</span>} />
                <DrawerField label="Payment Status" value={<Badge variant={getStatusVariant(viewInvoice.status)}>{viewInvoice.status}</Badge>} />
              </div>
            </div>

            {/* Section 2: Retailer Information (Admin only) */}
            {!isRetailer && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-slate-900">{viewInvoice.retailer}</span>} />
                  <DrawerField label="Retailer Code" value={<span className="text-slate-600">{viewInvoice.retailerCode}</span>} />
                </div>
              </div>
            )}

            {/* Section 3: Billing Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Billing Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 gap-4">
                <DrawerField label="Billing Address" value={viewInvoice.billingAddress} />
                <DrawerField label="GST Number" value={<span className="font-mono text-slate-700">{viewInvoice.gstNumber}</span>} />
              </div>
            </div>

            {/* Section 4: Invoice Items */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Items</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden [&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
                <DataTable columns={invoiceItemColumns} data={viewInvoice.items} />
              </div>
            </div>

            {/* Section 5: Invoice Summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">GST Amount</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewInvoice.gstAmount)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Total Invoice Value</span>
                    <span className="text-lg font-bold text-violet-700">{formatCurrency(viewInvoice.amount)}</span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Paid Amount</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(viewInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-900">Outstanding Amount</span>
                      <span className={`font-bold ${viewInvoice.outstandingAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(viewInvoice.outstandingAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Drawer Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <ActionButton className="flex-1" icon={<Download className="w-4 h-4" />} onClick={() => generatePDF(viewInvoice)}>
                Download PDF
              </ActionButton>
              <ActionButton variant="secondary" className="flex-1" icon={<Printer className="w-4 h-4" />} onClick={() => generatePDF(viewInvoice, false)}>
                Print Invoice
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
