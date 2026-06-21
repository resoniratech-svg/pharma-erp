import { useState, useMemo, useRef } from 'react';
import { CheckCircle2, Eye, Upload, AlertCircle, X } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SelectFilter,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';

// Type Definitions
type StatusType = 'Matched' | 'Partially Matched' | 'Unmatched' | 'Reconciled' | 'Pending Review';
type TransactionType = 'Receipt' | 'Payment' | 'Contra' | 'Bank Charges' | 'Interest';

interface ReconEntry {
  id: string;
  date: string;
  voucherNo: string;
  referenceNo: string;
  particulars: string;
  type: TransactionType;
  erpAmount: number;
  bankAmount: number;
  difference: number;
  status: StatusType;
}

const initialMockData: ReconEntry[] = [
  {
    id: '1',
    date: '18-Oct-2026',
    voucherNo: 'REC-2026-001',
    referenceNo: 'NEFT-123456',
    particulars: 'Apollo Pharmacy',
    type: 'Receipt',
    erpAmount: 45000,
    bankAmount: 45000,
    difference: 0,
    status: 'Matched'
  },
  {
    id: '2',
    date: '19-Oct-2026',
    voucherNo: 'PAY-2026-089',
    referenceNo: 'CHQ-00123',
    particulars: 'Sun Pharma (Vendor)',
    type: 'Payment',
    erpAmount: 120000,
    bankAmount: 120000,
    difference: 0,
    status: 'Reconciled'
  },
  {
    id: '3',
    date: '20-Oct-2026',
    voucherNo: 'JRN-2026-012',
    referenceNo: 'UPI-98765',
    particulars: 'Wellness Medicos',
    type: 'Receipt',
    erpAmount: 15000,
    bankAmount: 14500,
    difference: 500,
    status: 'Partially Matched'
  },
  {
    id: '4',
    date: '21-Oct-2026',
    voucherNo: '-',
    referenceNo: 'CHG-101',
    particulars: 'Monthly Account Maintenance',
    type: 'Bank Charges',
    erpAmount: 0,
    bankAmount: 500,
    difference: -500,
    status: 'Unmatched'
  },
  {
    id: '5',
    date: '22-Oct-2026',
    voucherNo: 'PAY-2026-090',
    referenceNo: 'RTGS-99221',
    particulars: 'Cipla Ltd.',
    type: 'Payment',
    erpAmount: 250000,
    bankAmount: 0,
    difference: 250000,
    status: 'Pending Review'
  },
  {
    id: '6',
    date: '23-Oct-2026',
    voucherNo: 'CON-2026-005',
    referenceNo: 'CASH-DEP',
    particulars: 'Cash Deposit - Main Branch',
    type: 'Contra',
    erpAmount: 50000,
    bankAmount: 50000,
    difference: 0,
    status: 'Matched'
  },
];

export default function BankReconciliation() {
  const [data, setData] = useState<ReconEntry[]>(initialMockData);
  
  // State for Filters
  const [search, setSearch] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [branch, setBranch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Action States
  const [viewRow, setViewRow] = useState<ReconEntry | null>(null);
  const [reconcileRow, setReconcileRow] = useState<ReconEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    const isNegative = amount < 0;
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    return isNegative ? `- ₹ ${formatted}` : `₹ ${formatted}`;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      alert("Unsupported file format. Please upload .csv, .xlsx, or .xls files only.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Mock parsed data row to append
    const newEntry: ReconEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      voucherNo: '-',
      referenceNo: `UPL-${Math.floor(Math.random() * 10000)}`,
      particulars: `Upload: ${file.name}`,
      type: 'Receipt',
      erpAmount: 0,
      bankAmount: 18500,
      difference: -18500,
      status: 'Unmatched'
    };

    setData(prev => [newEntry, ...prev]);
    
    setToastMessage("Bank statement uploaded successfully.");
    setTimeout(() => setToastMessage(null), 3000);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmReconcile = () => {
    if (!reconcileRow) return;
    
    setData(prev => prev.map(row => {
      if (row.id === reconcileRow.id) {
        return { 
          ...row, 
          status: 'Reconciled', 
          difference: 0, 
          erpAmount: row.bankAmount // Sync the ERP amount with bank
        };
      }
      return row;
    }));
    
    setReconcileRow(null);
  };

  const columns: Column<ReconEntry>[] = [
    { key: 'date', label: 'Date' },
    { key: 'voucherNo', label: 'Voucher No' },
    { key: 'referenceNo', label: 'Reference No' },
    { key: 'particulars', label: 'Particulars', render: (row) => <span className="font-semibold text-slate-900">{row.particulars}</span> },
    {
      key: 'type',
      label: 'Transaction Type',
      render: (row) => {
        let colorClass = 'text-slate-600';
        if (row.type === 'Receipt') colorClass = 'text-emerald-600';
        if (row.type === 'Payment') colorClass = 'text-rose-600';
        if (row.type === 'Contra') colorClass = 'text-blue-600';
        if (row.type === 'Bank Charges') colorClass = 'text-amber-600';
        if (row.type === 'Interest') colorClass = 'text-indigo-600';
        return <span className={`font-medium ${colorClass}`}>{row.type}</span>;
      },
    },
    { key: 'erpAmount', label: 'ERP Amount', render: (row) => formatCurrency(row.erpAmount) },
    { key: 'bankAmount', label: 'Bank Amount', render: (row) => formatCurrency(row.bankAmount) },
    { 
      key: 'difference', 
      label: 'Difference',
      render: (row) => {
        if (row.difference === 0) return <span className="text-slate-400">-</span>;
        return <span className="text-rose-600 font-medium">{formatCurrency(row.difference)}</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (row.status === 'Matched' || row.status === 'Reconciled') variant = 'success';
        if (row.status === 'Partially Matched' || row.status === 'Pending Review') variant = 'warning';
        if (row.status === 'Unmatched') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => {
        const isReconciled = row.status === 'Reconciled' || row.status === 'Matched';
        return (
          <div className="flex items-center gap-2">
            <ActionButton 
              variant="ghost" 
              className="text-xs px-2 py-1"
              onClick={() => setViewRow(row)}
            >
              <Eye className="w-4 h-4 text-slate-500 hover:text-slate-700" />
            </ActionButton>
            {!isReconciled && (
              <ActionButton 
                variant="secondary" 
                className="text-xs px-2 py-1"
                onClick={() => setReconcileRow(row)}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Reconcile
              </ActionButton> 
            )}
          </div>
        );
      }
    }
  ];

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search && !item.particulars.toLowerCase().includes(search.toLowerCase()) && !item.referenceNo.toLowerCase().includes(search.toLowerCase()) && !item.voucherNo.toLowerCase().includes(search.toLowerCase())) return false;
      if (transactionType && item.type !== transactionType) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [data, search, transactionType, statusFilter]);

  const metrics = useMemo(() => {
    // We use a base logic to dynamically calculate metrics from the rows.
    let baseErp = 405000;
    let baseBank = 300000;
    let reconciled = 0;
    let unreconciled = 0;
    let pending = 0;

    data.forEach(row => {
      if (row.status === 'Reconciled' || row.status === 'Matched') {
        reconciled += row.erpAmount;
      } else if (row.status === 'Unmatched' || row.status === 'Partially Matched') {
        unreconciled += Math.abs(row.difference);
      } else if (row.status === 'Pending Review') {
        pending += 1;
      }
      
      // Affecting balances
      if (row.type === 'Receipt') {
        baseErp += row.erpAmount;
        baseBank += row.bankAmount;
      } else {
        baseErp -= row.erpAmount;
        baseBank -= row.bankAmount;
      }
    });

    return {
      companyBooks: baseErp,
      bankStatement: baseBank,
      difference: baseErp - baseBank,
      reconciled,
      unreconciled,
      pending
    };
  }, [data]);

  return (
    <div className="animate-in fade-in duration-500 pb-12 relative">
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Match ERP bank ledger entries with actual bank statements."
      />

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col transition-all">
          <p className="text-sm text-slate-500 mb-1 font-medium">Balance as per Company Books</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.companyBooks)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col transition-all">
          <p className="text-sm text-slate-500 mb-1 font-medium">Balance as per Bank Statement</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.bankStatement)}</p>
        </div>
        <div className="bg-white border border-rose-200 p-5 rounded-xl shadow-sm flex flex-col bg-rose-50/30 transition-all">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-rose-600 font-medium">Difference</p>
            {metrics.difference !== 0 && <AlertCircle className="w-4 h-4 text-amber-500" />}
          </div>
          <p className="text-2xl font-bold text-rose-700">{formatCurrency(metrics.difference)}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col transition-all">
          <p className="text-sm text-slate-500 mb-1 font-medium">Reconciled Amount</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.reconciled)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col transition-all">
          <p className="text-sm text-slate-500 mb-1 font-medium">Unreconciled Amount</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(metrics.unreconciled)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col transition-all">
          <p className="text-sm text-slate-500 mb-1 font-medium">Pending Transactions</p>
          <p className="text-2xl font-bold text-slate-900">{metrics.pending} <span className="text-sm font-normal text-slate-500">records</span></p>
        </div>
      </div>

      <FilterBar>
        <SelectFilter
          value={bankAccount}
          onChange={setBankAccount}
          options={[
            { label: 'HDFC Bank - 1234', value: 'HDFC Bank - 1234' },
            { label: 'SBI Current - 5678', value: 'SBI Current - 5678' }
          ]}
          placeholder="Bank Account"
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>
        <SelectFilter
          value={branch}
          onChange={setBranch}
          options={[
            { label: 'Head Office', value: 'Head Office' },
            { label: 'Mumbai Branch', value: 'Mumbai Branch' }
          ]}
          placeholder="Branch"
        />
        <SelectFilter
          value={transactionType}
          onChange={setTransactionType}
          options={[
            { label: 'Receipt', value: 'Receipt' },
            { label: 'Payment', value: 'Payment' },
            { label: 'Contra', value: 'Contra' },
            { label: 'Bank Charges', value: 'Bank Charges' },
            { label: 'Interest', value: 'Interest' }
          ]}
          placeholder="Transaction Type"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Matched', value: 'Matched' },
            { label: 'Partially Matched', value: 'Partially Matched' },
            { label: 'Unmatched', value: 'Unmatched' },
            { label: 'Reconciled', value: 'Reconciled' },
            { label: 'Pending Review', value: 'Pending Review' }
          ]}
          placeholder="Status"
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search Voucher, Ref, Particulars..." />
      </FilterBar>

      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Reconciliation Entries</h3>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".csv,.xlsx,.xls" 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        <ActionButton onClick={handleUploadClick} variant="primary" icon={<Upload className="w-4 h-4" />}>
          Upload Bank Statement <span className="opacity-80 font-normal ml-1 border-l border-violet-400 pl-2">CSV / Excel</span>
        </ActionButton>
      </div>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No reconciliation entries found for the selected criteria."
        />
      </TableCard>

      {/* View Details Drawer */}
      <Drawer
        open={viewRow !== null}
        onClose={() => setViewRow(null)}
        title="Transaction Details"
      >
        {viewRow && (
          <div className="space-y-1">
            <DrawerField label="Date" value={viewRow.date} />
            <DrawerField label="Voucher No" value={viewRow.voucherNo} />
            <DrawerField label="Reference No" value={viewRow.referenceNo} />
            <DrawerField label="Particulars" value={viewRow.particulars} />
            <DrawerField label="Transaction Type" value={viewRow.type} />
            <DrawerField label="ERP Amount" value={formatCurrency(viewRow.erpAmount)} />
            <DrawerField label="Bank Amount" value={formatCurrency(viewRow.bankAmount)} />
            <DrawerField 
              label="Difference" 
              value={<span className={viewRow.difference !== 0 ? 'text-rose-600 font-semibold' : ''}>{formatCurrency(viewRow.difference)}</span>} 
            />
            <DrawerField label="Current Status" value={<Badge variant="neutral">{viewRow.status}</Badge>} />
            <DrawerField label="Remarks" value={<span className="italic text-slate-500">No remarks provided.</span>} />
          </div>
        )}
      </Drawer>

      {/* Reconcile Confirmation Modal */}
      {reconcileRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-violet-600" /> Confirm Reconciliation
               </h3>
               <button onClick={() => setReconcileRow(null)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 bg-slate-50/50">
              <p className="text-sm text-slate-600 mb-4">Are you sure you want to reconcile this transaction?</p>
              
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 mb-2 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Particulars:</span>
                  <span className="font-medium text-slate-900">{reconcileRow.particulars}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">ERP Amount:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(reconcileRow.erpAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Bank Amount:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(reconcileRow.bankAmount)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Difference:</span>
                  <span className={`font-bold ${reconcileRow.difference !== 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatCurrency(reconcileRow.difference)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setReconcileRow(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmReconcile}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg shadow-sm shadow-violet-200 hover:bg-violet-700 transition-colors flex items-center gap-2 focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:outline-none"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
