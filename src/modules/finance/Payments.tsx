import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown, Printer, Eye, FileText, Edit, Plus, Upload, } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { generateReceiptVoucherPdf } from '../../documents/generators/pdfGenerator';
import { generateReceiptVoucherPrint } from '../../documents/generators/printGenerator';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// --- Types ---
type PaymentStatus = 'Pending' | 'Cleared' | 'Bounced' | 'Cancelled';
type TxnType = 'Receipt' | 'Payment';
type PaymentMode = 'Cash' | 'Cheque' | 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';

interface TxnEntry {
  id: string;
  receiptNo: string;
  date: string;
  type: TxnType;
  partyName: string;
  partyType: string;
  invoiceRef: string;
  mode: PaymentMode;
  amount: number;
  bankAccount: string;
  referenceNo: string;
  remarks: string;
  hasAttachment: boolean;
  status: PaymentStatus;
  createdBy: string;
  createdDate: string;
}

// --- Helpers ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusVariant = (status: PaymentStatus): BadgeVariant => {
  if (status === 'Cleared') return 'success';
  if (status === 'Pending') return 'warning';
  if (status === 'Bounced') return 'danger';
  if (status === 'Cancelled') return 'neutral';
  return 'neutral';
};

const getFormattedDate = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// --- Mock Data ---
const initialData: TxnEntry[] = [
  {
    id: '1', receiptNo: 'RCT/26/105', date: '2026-10-18', type: 'Receipt', partyName: 'Apollo Pharmacy', partyType: 'Customer', invoiceRef: 'INV/26/001',
    mode: 'NEFT', amount: 45000, bankAccount: 'HDFC Bank - 1234', referenceNo: 'N294829482', remarks: 'Part payment', hasAttachment: true, status: 'Cleared',
    createdBy: 'System User', createdDate: '2026-10-18 10:30 AM'
  },
  {
    id: '2', receiptNo: 'RCT/26/106', date: '2026-10-19', type: 'Receipt', partyName: 'Wellness Medicos', partyType: 'Customer', invoiceRef: 'INV/26/050',
    mode: 'Cheque', amount: 20000, bankAccount: 'SBI - 5678', referenceNo: 'CHQ-001928', remarks: 'Awaiting clearance', hasAttachment: false, status: 'Pending',
    createdBy: 'System User', createdDate: '2026-10-19 11:15 AM'
  },
  {
    id: '3', receiptNo: 'RCT/26/107', date: '2026-10-15', type: 'Receipt', partyName: 'Metro Distributors', partyType: 'Distributor', invoiceRef: 'INV/26/101',
    mode: 'Cheque', amount: 15000, bankAccount: 'HDFC Bank - 1234', referenceNo: 'CHQ-001888', remarks: 'Signature mismatch', hasAttachment: true, status: 'Bounced',
    createdBy: 'Admin', createdDate: '2026-10-15 09:00 AM'
  },
  {
    id: '4', receiptNo: 'PMT/26/040', date: '2026-10-20', type: 'Payment', partyName: 'Sun Pharma', partyType: 'Supplier', invoiceRef: 'PUR/26/001',
    mode: 'RTGS', amount: 150000, bankAccount: 'ICICI - 9999', referenceNo: 'R8838382', remarks: 'Full settlement', hasAttachment: false, status: 'Cleared',
    createdBy: 'Finance Mgr', createdDate: '2026-10-20 14:20 PM'
  }
];

const mockInvoices = [
  { ref: 'INV/26/001', amount: 50400, paid: 5400, party: 'Apollo Pharmacy' },
  { ref: 'INV/26/045', amount: 50000, paid: 0, party: 'Apollo Pharmacy' },
  { ref: 'INV/26/101', amount: 32000, paid: 15000, party: 'Metro Distributors' },
  { ref: 'PUR/26/001', amount: 150000, paid: 0, party: 'Sun Pharma' },
];

// --- Local Modal Implementation ---
function LocalModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Payments() {
  const [data, setData] = useState<TxnEntry[]>(initialData);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [selectedTxn, setSelectedTxn] = useState<TxnEntry | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Receipt Form State
  const [formType, setFormType] = useState<TxnType>('Receipt');
  const [formParty, setFormParty] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMode, setFormMode] = useState<PaymentMode>('NEFT');
  const [formBank, setFormBank] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formInvData, setFormInvData] = useState<{ amount: number, paid: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Auto Calculation Logic ---
  useEffect(() => {
    const matched = mockInvoices.find(i => i.ref === formInvoice);
    if (matched) {
      setFormInvData({ amount: matched.amount, paid: matched.paid });
      if (!formParty) setFormParty(matched.party);
    } else {
      setFormInvData(null);
    }
  }, [formInvoice]);

  // --- Derived Data ---
  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (search) {
        const query = search.toLowerCase();
        if (!row.partyName.toLowerCase().includes(query) && 
            !row.receiptNo.toLowerCase().includes(query) && 
            !row.invoiceRef.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (statusFilter && row.status !== statusFilter) return false;
      if (typeFilter && row.type !== typeFilter) return false;
      if (modeFilter && row.mode !== modeFilter) return false;
      
      if (fromDate || toDate) {
        const d = new Date(row.date);
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
      }
      return true;
    });
  }, [data, search, statusFilter, typeFilter, modeFilter, fromDate, toDate]);

  // --- Form Actions ---
  const handleSaveReceipt = () => {
    const amt = parseFloat(formAmount) || 0;
    if (amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const newEntry: TxnEntry = {
      id: Math.random().toString(),
      receiptNo: formType === 'Receipt' ? `RCT/26/GEN${Math.floor(Math.random()*100)}` : `PMT/26/GEN${Math.floor(Math.random()*100)}`,
      date: new Date().toISOString().split('T')[0],
      type: formType,
      partyName: formParty || 'Unknown',
      partyType: formType === 'Receipt' ? 'Customer' : 'Supplier',
      invoiceRef: formInvoice || '-',
      mode: formMode,
      amount: amt,
      bankAccount: formBank,
      referenceNo: formRef,
      remarks: formRemarks,
      hasAttachment: false,
      status: 'Pending',
      createdBy: 'Current User',
      createdDate: new Date().toLocaleString()
    };
    setData([newEntry, ...data]);
    setShowNewModal(false);
    
    // Reset
    setFormType('Receipt'); setFormParty(''); setFormInvoice(''); setFormAmount(''); setFormMode('NEFT'); setFormBank(''); setFormRef(''); setFormRemarks(''); setFormInvData(null);
  };

  // --- Print Voucher ---
  const handlePrintVoucher = (txn: TxnEntry) => {
    generateReceiptVoucherPrint(txn);
  };

  const handleDownloadPDF = (txn: TxnEntry) => {
    generateReceiptVoucherPdf(txn);
  };

  // --- Register Exports ---
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(row => ({
      'Receipt No': row.receiptNo,
      'Date': row.date,
      'Type': row.type,
      'Party Name': row.partyName,
      'Invoice Ref': row.invoiceRef,
      'Mode': row.mode,
      'Amount': row.amount,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, `Payment_Tracking_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Payment Tracking Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 22);

    const pdfTableData = filteredData.map(row => [
      row.receiptNo, row.date, row.type, row.partyName, row.invoiceRef, row.mode, formatCurrency(row.amount), row.status
    ]);

    (doc as any).autoTable({
      head: [['Receipt No', 'Date', 'Type', 'Party Name', 'Invoice Ref', 'Mode', 'Amount', 'Status']],
      body: pdfTableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [80, 80, 80] }
    });

    doc.save(`Payment_Tracking_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const handlePrintRegister = () => {
    setShowExportMenu(false);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      
      const filtersText = [
        search && `Search: ${search}`,
        statusFilter && `Status: ${statusFilter}`,
        typeFilter && `Type: ${typeFilter}`,
        modeFilter && `Mode: ${modeFilter}`,
        fromDate && `From: ${fromDate}`,
        toDate && `To: ${toDate}`
      ].filter(Boolean).join(', ');

      const printRows = filteredData.map(row => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.receiptNo}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.date}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.type}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; color: #000;">${row.partyName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.invoiceRef}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.mode}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; color: #000;">${formatCurrency(row.amount)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.status}</td>
        </tr>
      `).join('');

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Tracking Report</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; background: #fff; font-size: 10px; }
              .header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header h1 { font-size: 18px; margin: 0 0 5px 0; color: #000; }
              .header p { margin: 0 0 3px 0; font-size: 11px; color: #000; }
              table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              th { padding: 8px; border-bottom: 2px solid #000; text-align: left; font-weight: bold; color: #000; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payment Tracking Report</h1>
              <p>Generated On: ${new Date().toLocaleString()}</p>
              ${filtersText ? `<p>Filters Applied: ${filtersText}</p>` : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Party Name</th>
                  <th>Invoice Ref</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${printRows}
              </tbody>
            </table>
          </body>
        </html>
      `);
      doc.close();

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    }
  };

  // --- Columns ---
  const columns: Column<TxnEntry>[] = [
    { key: 'receiptNo', label: 'Receipt No', render: (row) => <span className="font-semibold text-slate-900">{row.receiptNo}</span> },
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-medium text-slate-800">{row.partyName}</span> },
    { key: 'invoiceRef', label: 'Invoice Ref', render: (row) => <span className="text-slate-600">{row.invoiceRef}</span> },
    { key: 'mode', label: 'Mode', render: (row) => <span className="text-slate-600">{row.mode}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className={`font-bold ${row.type === 'Receipt' ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <ActionButton variant="ghost" onClick={() => setSelectedTxn(row)} className="text-slate-400 hover:text-violet-600 px-2 py-1 flex items-center gap-1">
            <Eye className="w-4 h-4" /> <span className="text-xs hidden lg:inline">View</span>
          </ActionButton>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 print:m-0 print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="Payment Tracking"
          subtitle="Manage incoming receipts and outgoing payments."
          actions={
            <div className="flex items-center gap-3">
              <div className="relative inline-block text-left" ref={exportMenuRef}>
                <ActionButton variant="secondary" onClick={() => setShowExportMenu(!showExportMenu)}>
                  Export <ChevronDown className="w-3 h-3 ml-1" />
                </ActionButton>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1">
                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Download className="w-4 h-4"/> Export Excel</button>
                    <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Download className="w-4 h-4"/> Export PDF</button>
                    <button onClick={handlePrintRegister} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Printer className="w-4 h-4"/> Print Report</button>
                  </div>
                )}
              </div>
              <ActionButton variant="primary" onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Receipt
              </ActionButton>
            </div>
          }
        />

        <FilterBar>
          <div className="flex flex-wrap items-center gap-3 w-full">
            <SearchInput value={search} onChange={setSearch} placeholder="Search receipt, invoice or party..." />
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <SelectFilter
              value={statusFilter} onChange={setStatusFilter}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Cleared', value: 'Cleared' },
                { label: 'Bounced', value: 'Bounced' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
              placeholder="Status"
            />
            <SelectFilter
              value={typeFilter} onChange={setTypeFilter}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Receipt', value: 'Receipt' },
                { label: 'Payment', value: 'Payment' },
              ]}
              placeholder="Type"
            />
            <SelectFilter
              value={modeFilter} onChange={setModeFilter}
              options={[
                { label: 'All Modes', value: '' },
                { label: 'Cash', value: 'Cash' },
                { label: 'Cheque', value: 'Cheque' },
                { label: 'NEFT', value: 'NEFT' },
                { label: 'RTGS', value: 'RTGS' },
                { label: 'IMPS', value: 'IMPS' },
                { label: 'UPI', value: 'UPI' },
              ]}
              placeholder="Mode"
            />
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
              <span className="text-sm text-slate-500">From</span>
              <input type="date" className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-[110px]" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
              <span className="text-sm text-slate-500">To</span>
              <input type="date" className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-[110px]" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </FilterBar>
      </div>

      <div className="print:block print:w-full print:bg-white print:border-none">
        <TableCard>
          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            <DataTable columns={columns} data={filteredData} emptyMessage="No transactions found." />
          </div>
        </TableCard>
      </div>

      {/* View Details Drawer */}
      <Drawer open={!!selectedTxn} onClose={() => setSelectedTxn(null)} title="Transaction Details">
        {selectedTxn && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Basic Information</h3>
              <div className="space-y-2">
                <DrawerField label="Receipt No" value={selectedTxn.receiptNo} />
                <DrawerField label="Date" value={selectedTxn.date} />
                <DrawerField label="Transaction Type" value={selectedTxn.type} />
                <DrawerField label="Party Name" value={<span className="font-semibold text-slate-900">{selectedTxn.partyName} ({selectedTxn.partyType})</span>} />
                <DrawerField label="Invoice Ref" value={selectedTxn.invoiceRef} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="space-y-2">
                <DrawerField label="Mode" value={selectedTxn.mode} />
                <DrawerField label="Bank Account" value={selectedTxn.bankAccount || '-'} />
                <DrawerField label="Ref / Cheque No" value={selectedTxn.referenceNo || '-'} />
                <DrawerField label="Amount" value={<span className={`font-bold text-lg ${selectedTxn.type === 'Receipt' ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(selectedTxn.amount)}</span>} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(selectedTxn.status)}>{selectedTxn.status}</Badge>} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">System Information</h3>
              <div className="space-y-2">
                <DrawerField label="Remarks" value={selectedTxn.remarks || '-'} />
                <DrawerField label="Attachment" value={selectedTxn.hasAttachment ? <span className="text-blue-600 flex items-center gap-1"><FileText className="w-3 h-3"/> View Document</span> : 'None'} />
                <DrawerField label="Created By" value={selectedTxn.createdBy} />
                <DrawerField label="Created Date" value={selectedTxn.createdDate} />
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex flex-wrap justify-end gap-3">
              {selectedTxn.status === 'Pending' && (
                <ActionButton variant="secondary" onClick={() => {}} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </ActionButton>
              )}
              <ActionButton variant="secondary" onClick={() => handleDownloadPDF(selectedTxn)} className="text-amber-700 border-amber-200 hover:bg-amber-50">
                <FileText className="w-4 h-4 mr-2" /> Download PDF
              </ActionButton>
              <ActionButton variant="primary" onClick={() => handlePrintVoucher(selectedTxn)}>
                <Printer className="w-4 h-4 mr-2" /> Print Voucher
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedTxn(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Receipt Modal */}
      <LocalModal open={showNewModal} onClose={() => setShowNewModal(false)} title="Create New Receipt/Payment">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Transaction Type</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formType} onChange={(e) => setFormType(e.target.value as TxnType)}>
                <option value="Receipt">Receipt (Incoming)</option>
                <option value="Payment">Payment (Outgoing)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Receipt Date</label>
              <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Reference</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" 
              placeholder="e.g., INV/26/001" 
              value={formInvoice}
              onChange={(e) => setFormInvoice(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Mock values: INV/26/001, INV/26/045, PUR/26/001</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Party Name</label>
            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Party Name" value={formParty} onChange={(e) => setFormParty(e.target.value)} />
          </div>

          {formInvData && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-slate-500">Invoice Amount</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(formInvData.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Paid Amount</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(formInvData.paid)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Outstanding</p>
                <p className="text-sm font-bold text-rose-600">{formatCurrency(formInvData.amount - formInvData.paid)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-violet-700" placeholder="0.00" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Mode</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formMode} onChange={(e) => setFormMode(e.target.value as PaymentMode)}>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          {formMode !== 'Cash' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Account</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g., HDFC - 1234" value={formBank} onChange={(e) => setFormBank(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reference No.</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Cheque / UTR No." value={formRef} onChange={(e) => setFormRef(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Optional remarks" value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)}></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attachment</label>
            <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-violet-300 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-xs">Click to upload document</span>
            </div>
          </div>

          <div className="pt-6 mt-6 flex justify-end gap-3 border-t border-slate-100">
            <ActionButton variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleSaveReceipt}>Save {formType}</ActionButton>
          </div>
        </div>
      </LocalModal>
    </div>
  );
}
