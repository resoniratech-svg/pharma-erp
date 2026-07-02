import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, Eye, DollarSign, Filter, ChevronDown, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// --- Types ---
interface Invoice {
  invoiceNo: string;
  date: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  agingDays: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';
}

interface OutstandingRecord {
  id: string;
  distributorName: string;
  distributorCode: string;
  contactPerson: string;
  mobile: string;
  gstin: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  totalOutstanding: number;
  overdueAmount: number;
  maxAging: number;
  status: 'Clear' | 'Overdue';
  lastPaymentDate: string;
  invoices: Invoice[];
}

const initialOutstandingRecords: OutstandingRecord[] = [
  {
    id: '1',
    distributorName: 'Metro Pharma Distributors',
    distributorCode: 'DIST-001',
    contactPerson: 'Rajesh Sharma',
    mobile: '+91 98765 43210',
    gstin: '27AAAAA1111A1Z1',
    creditLimit: 500000,
    usedCredit: 33192,
    availableCredit: 466808,
    totalOutstanding: 33192,
    overdueAmount: 8000,
    maxAging: 37,
    status: 'Clear',
    lastPaymentDate: '12-Oct-2026',
    invoices: [
      { invoiceNo: 'INV-2026-1001', date: '15-Oct-2026', amount: 10192, paidAmount: 0, dueDate: '18-Oct-2026', agingDays: 9, status: 'Unpaid' },
      { invoiceNo: 'INV-2026-1002', date: '16-Oct-2026', amount: 5040, paidAmount: 5040, dueDate: '19-Oct-2026', agingDays: 8, status: 'Paid' },
      { invoiceNo: 'INV-2026-1003', date: '01-Oct-2026', amount: 20000, paidAmount: 5000, dueDate: '05-Oct-2026', agingDays: 22, status: 'Partially Paid' },
      { invoiceNo: 'INV-2026-1004', date: '15-Sep-2026', amount: 8000, paidAmount: 0, dueDate: '20-Sep-2026', agingDays: 37, status: 'Overdue' }
    ]
  }
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OutstandingTracking() {
  const loggedInDistributorCode = 'DIST-001';

  const [records, setRecords] = useState<OutstandingRecord[]>(() => {
    const trackingData = localStorage.getItem('pharma_erp_outstanding_records');
    return trackingData ? JSON.parse(trackingData) : initialOutstandingRecords;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Drawer
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const trackingData = localStorage.getItem('pharma_erp_outstanding_records');
    if (trackingData) {
      setRecords(JSON.parse(trackingData));
    } else {
      localStorage.setItem('pharma_erp_outstanding_records', JSON.stringify(initialOutstandingRecords));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Identify My Record ---
  const myRecord = useMemo(() => {
    return records.find(r => r.distributorCode === loggedInDistributorCode) || {
      creditLimit: 0,
      availableCredit: 0,
      totalOutstanding: 0,
      overdueAmount: 0,
      invoices: []
    } as unknown as OutstandingRecord;
  }, [records]);

  // --- Filtering ---
  const visibleInvoices = useMemo(() => {
    return myRecord.invoices.filter(inv => {
      const matchSearch = inv.invoiceNo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? inv.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [myRecord, search, statusFilter]);

  // --- Export Protocols Engine ---
  const handleExportExcel = () => {
    const data = visibleInvoices.map(inv => ({
      'Invoice No': inv.invoiceNo,
      'Invoice Date': inv.date,
      'Due Date': inv.dueDate,
      'Amount': inv.amount,
      'Aging Days': inv.status === 'Paid' ? 0 : inv.agingDays,
      'Status': inv.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, `My_Invoices_${new Date().toISOString().slice(0,10)}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Outstanding Balances & Invoices', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 21);

    autoTable(doc, {
      startY: 28,
      head: [['Invoice No', 'Date', 'Due Date', 'Amount', 'Aging Days', 'Status']],
      body: visibleInvoices.map(inv => [
        inv.invoiceNo, inv.date, inv.dueDate, formatCurrency(inv.amount),
        inv.status === 'Paid' ? '-' : inv.agingDays, inv.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }
    });
    doc.save(`My_Invoices.pdf`);
    setShowExportMenu(false);
  };

  const getOutstandingAmount = (inv: Invoice) => {
    if (inv.status === 'Paid') return 0;
    if (inv.paidAmount !== undefined) return inv.amount - inv.paidAmount;
    return inv.amount; // Assume fully unpaid if no paidAmount specified and status is not Paid
  };

  const getPaidAmount = (inv: Invoice) => {
    if (inv.status === 'Paid') return inv.amount;
    if (inv.paidAmount !== undefined) return inv.paidAmount;
    return 0; // Assume 0 paid if not specified
  };

  // --- Grid Column Models ---
  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'date', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className="text-slate-600">{row.dueDate}</span> },
    { key: 'amount', label: 'Outstanding Amount', render: (row) => <span className="font-bold text-slate-900">{formatCurrency(getOutstandingAmount(row))}</span> },
    { key: 'agingDays', label: 'Aging (Days)', render: (row) => <span className={`font-mono ${(row.status === 'Unpaid' || row.status === 'Overdue') && row.agingDays > 30 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>{row.status === 'Paid' ? '-' : row.agingDays}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Paid') variant = 'success';
        else if (row.status === 'Partially Paid') variant = 'info';
        else if (row.status === 'Unpaid') variant = 'warning';
        else if (row.status === 'Overdue') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedInvoice(row)} className="text-slate-400 hover:text-violet-600 p-1 transition-colors" title="View Invoice">
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-slate-400 hover:text-slate-900 transition-colors p-1" title="Download Invoice">
            <FileText className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outstanding Tracking"
        subtitle="Track and manage your outstanding invoices and account balance."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Statement
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF Report (.pdf)</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* --- Executive Dashboard KPI Metrics Panel Header Layout --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Outstanding</span>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(myRecord.totalOutstanding || 0)}</span>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Overdue Amount</span>
            <span className={`text-2xl font-black ${(myRecord.overdueAmount || 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(myRecord.overdueAmount || 0)}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice number..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Status:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Paid', value: 'Paid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' }
          ]}
          placeholder="All Invoices"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleInvoices}
            emptyMessage="No invoices found."
          />
        </div>
      </TableCard>

      {/* --- Detail Invoice Drawer --- */}
      <Drawer open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Details">
        {selectedInvoice && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <DrawerField label="Invoice No" value={<span className="font-bold text-slate-900">{selectedInvoice.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={selectedInvoice.date} />
                <DrawerField label="Due Date" value={selectedInvoice.dueDate} />
                <DrawerField label="Status" value={
                  <Badge variant={selectedInvoice.status === 'Paid' ? 'success' : selectedInvoice.status === 'Partially Paid' ? 'info' : selectedInvoice.status === 'Unpaid' ? 'warning' : 'danger'}>
                    {selectedInvoice.status}
                  </Badge>
                } />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Amount Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm col-span-2">
                  <span className="text-xs text-slate-400 block">Invoice Amount</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Paid Amount</span>
                  <span className="text-base font-bold text-emerald-600">{formatCurrency(getPaidAmount(selectedInvoice))}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Outstanding Amount</span>
                  <span className={`text-base font-bold ${getOutstandingAmount(selectedInvoice) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(getOutstandingAmount(selectedInvoice))}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Credit Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Credit Limit</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(myRecord.creditLimit)}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Available Credit</span>
                  <span className="text-base font-bold text-emerald-600">{formatCurrency(myRecord.availableCredit)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <DrawerField label="Aging Days" value={selectedInvoice.status === 'Paid' ? '-' : `${selectedInvoice.agingDays} Days`} />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}