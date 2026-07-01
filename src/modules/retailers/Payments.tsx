import { useState, useRef, useEffect } from 'react';
import { Download, Filter, ReceiptText, ChevronDown, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyPaymentReceiptTemplate } from '../../documents/templates/PaymentReceiptTemplate';
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

type PaymentStatus = 'Completed' | 'Pending' | 'Failed' | 'Partially Paid';

interface Payment {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  retailer: string;
  retailerCode: string;
  date: string;
  amount: number;
  mode: string;
  bankName: string;
  txnReference: string;
  invoiceAmount: number;
  outstandingBefore: number;
  outstandingAfter: number;
  status: PaymentStatus;
}

const mockData: Payment[] = [
  { 
    id: '1', receiptNo: 'RCPT-RET-1002', invoiceNo: 'INV-RET-9890', retailer: 'Apollo Pharmacy', retailerCode: 'RET-001',
    date: '12-Oct-2026', amount: 15000, mode: 'Bank Transfer', bankName: 'HDFC Bank', txnReference: 'IMPS/628500219800',
    invoiceAmount: 25000, outstandingBefore: 25000, outstandingAfter: 10000, status: 'Partially Paid' 
  },
  { 
    id: '2', receiptNo: 'RCPT-RET-1003', invoiceNo: 'INV-RET-9900', retailer: 'MedPlus Store', retailerCode: 'RET-002',
    date: '14-Oct-2026', amount: 5000, mode: 'Cheque', bankName: 'State Bank of India', txnReference: 'CHQ-889922',
    invoiceAmount: 5000, outstandingBefore: 5000, outstandingAfter: 5000, status: 'Pending' 
  },
  { 
    id: '3', receiptNo: 'RCPT-RET-1004', invoiceNo: 'INV-RET-9885', retailer: 'Wellness Medicos', retailerCode: 'RET-003',
    date: '10-Oct-2026', amount: 2500, mode: 'UPI', bankName: 'ICICI Bank', txnReference: 'UPI/628100111199',
    invoiceAmount: 2500, outstandingBefore: 2500, outstandingAfter: 2500, status: 'Failed' 
  },
  { 
    id: '4', receiptNo: 'RCPT-RET-1005', invoiceNo: 'INV-RET-9880', retailer: 'Apollo Pharmacy', retailerCode: 'RET-001',
    date: '08-Oct-2026', amount: 8000, mode: 'UPI', bankName: 'Axis Bank', txnReference: 'UPI/628100222288',
    invoiceAmount: 8000, outstandingBefore: 8000, outstandingAfter: 0, status: 'Completed' 
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Payments() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_RETAILER;
  const isRetailer = activeRole === ROLE_RETAILER;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewReceipt, setViewReceipt] = useState<Payment | null>(null);

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

  const getStatusVariant = (status: PaymentStatus): BadgeVariant => {
    if (status === 'Completed') return 'success';
    if (status === 'Pending') return 'warning';
    if (status === 'Failed') return 'danger';
    if (status === 'Partially Paid') return 'info';
    return 'neutral';
  };

  // Filter logic
  const baseData = isRetailer ? mockData.filter(d => d.retailer === 'Apollo Pharmacy') : mockData;
  const filteredData = baseData.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = item.receiptNo.toLowerCase().includes(searchStr) || item.invoiceNo.toLowerCase().includes(searchStr);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const generatePDF = (payment: Payment | null, isDownload: boolean = true) => {
    if (!payment) return;
    const doc = new jsPDF();
    
    // Use the shared template instead of inline layout
    applyPaymentReceiptTemplate(doc, payment, activeRole);
    
    if (isDownload) {
      doc.save(`${payment.receiptNo}.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  const adminColumns: Column<Payment>[] = [
    { key: 'receiptNo', label: 'Receipt No', render: (row) => <span className="font-semibold text-slate-900">{row.receiptNo}</span> },
    { key: 'retailer', label: 'Retailer Name', render: (row) => <span className="font-semibold text-violet-700">{row.retailer}</span> },
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="text-slate-600">{row.invoiceNo}</span> },
    { key: 'date', label: 'Payment Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'mode', label: 'Payment Mode', render: (row) => <span className="text-slate-600">{row.mode}</span> },
    { key: 'amount', label: 'Amount Paid', render: (row) => <span className="font-bold text-emerald-600">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Payment Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1" onClick={() => setViewReceipt(row)}>
            <ReceiptText className="w-4 h-4 mr-1" /> View Receipt
          </ActionButton>
          <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1" onClick={() => generatePDF(row)}>
            <Download className="w-4 h-4" />
          </ActionButton>
        </div>
      )
    }
  ];

  const retailerColumns: Column<Payment>[] = [
    { key: 'receiptNo', label: 'Receipt No', render: (row) => <span className="font-semibold text-slate-900">{row.receiptNo}</span> },
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="text-slate-600">{row.invoiceNo}</span> },
    { key: 'date', label: 'Payment Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'mode', label: 'Payment Mode', render: (row) => <span className="text-slate-600">{row.mode}</span> },
    { key: 'amount', label: 'Amount Paid', render: (row) => <span className="font-bold text-emerald-600">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Payment Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1" onClick={() => setViewReceipt(row)}>
            <ReceiptText className="w-4 h-4 mr-1" /> View Receipt
          </ActionButton>
          <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1" onClick={() => generatePDF(row)}>
            <Download className="w-4 h-4" />
          </ActionButton>
        </div>
      )
    }
  ];

  const columns = isRetailer ? retailerColumns : adminColumns;

  // Exports
  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredData.map(item => ({
        'Receipt Number': item.receiptNo,
        'Retailer Name': item.retailer,
        'Invoice Number': item.invoiceNo,
        'Payment Date': item.date,
        'Payment Mode': item.mode,
        'Amount Paid': item.amount,
        'Payment Status': item.status
      }));
    } else {
      return filteredData.map(item => ({
        'Receipt Number': item.receiptNo,
        'Invoice Number': item.invoiceNo,
        'Payment Date': item.date,
        'Payment Mode': item.mode,
        'Amount Paid': item.amount,
        'Payment Status': item.status
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "Payments.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Payments.csv";
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
    
    doc.text("Payment Register", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });
    doc.save("Payments.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Payment Tracking"
        subtitle="Track payment history, receipt details, outstanding settlements, and payment status."
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search receipt or invoice number..." />
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
            { label: 'Completed', value: 'Completed' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Failed', value: 'Failed' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No payments found."
          />
        </div>
      </TableCard>

      {/* View Receipt Drawer */}
      <Drawer
        open={!!viewReceipt}
        onClose={() => setViewReceipt(null)}
        title="Receipt Details"
      >
        {viewReceipt && (
          <div className="space-y-6 pb-20">
            {/* Section 1: Receipt Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Receipt Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Receipt Number" value={<span className="font-semibold text-violet-700">{viewReceipt.receiptNo}</span>} />
                <DrawerField label="Invoice Number" value={viewReceipt.invoiceNo} />
                <DrawerField label="Payment Date" value={viewReceipt.date} />
                <DrawerField label="Payment Mode" value={viewReceipt.mode} />
                <DrawerField label="Payment Status" value={<Badge variant={getStatusVariant(viewReceipt.status)}>{viewReceipt.status}</Badge>} />
              </div>
            </div>

            {/* Section 2: Retailer Information (Admin only) */}
            {!isRetailer && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-slate-900">{viewReceipt.retailer}</span>} />
                  <DrawerField label="Retailer Code" value={<span className="text-slate-600">{viewReceipt.retailerCode}</span>} />
                </div>
              </div>
            )}

            {/* Section 3: Payment Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Amount Paid" value={<span className="font-bold text-emerald-600 text-lg">{formatCurrency(viewReceipt.amount)}</span>} />
                <DrawerField label="Payment Mode" value={viewReceipt.mode} />
                <DrawerField label="Bank Name" value={viewReceipt.bankName} />
                <DrawerField label="Transaction Reference" value={<span className="font-mono text-slate-700">{viewReceipt.txnReference}</span>} />
                <DrawerField label="Payment Date" value={viewReceipt.date} />
              </div>
            </div>

            {/* Section 4: Invoice Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Invoice Number</span>
                    <span className="font-medium text-slate-900">{viewReceipt.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Invoice Amount</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewReceipt.invoiceAmount)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Outstanding Before Payment</span>
                    <span className="font-medium text-slate-900">{formatCurrency(viewReceipt.outstandingBefore)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-semibold text-slate-900">Outstanding After Payment</span>
                    <span className={`font-bold ${viewReceipt.outstandingAfter > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(viewReceipt.outstandingAfter)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Drawer Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <ActionButton className="flex-1" icon={<Download className="w-4 h-4" />} onClick={() => generatePDF(viewReceipt)}>
                Download Receipt
              </ActionButton>
              <ActionButton variant="secondary" className="flex-1" icon={<Printer className="w-4 h-4" />} onClick={() => generatePDF(viewReceipt, false)}>
                Print Receipt
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
