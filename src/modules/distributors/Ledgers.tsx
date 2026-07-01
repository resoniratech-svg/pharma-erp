import { useState, useRef } from 'react';
import { Download, Filter, Eye, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Drawer,
  DrawerField,
} from './components/shared';
import { type Column } from './components/shared';

// -- Mock Roles & Auth --
import { ROLE_SUPER_ADMIN, ROLE_DISTRIBUTOR } from '../../constants/roles';

interface LedgerEntry {
  id: string;
  date: string;
  distributor: string;
  distributorCode: string;
  contactPerson: string;
  refNo: string;
  type: 'Invoice' | 'Payment' | 'Credit Note' | 'Debit Note';
  debitAmount: number;
  creditAmount: number;
  balanceAmount: number;
  balanceType: 'Dr' | 'Cr';
}

const mockData: LedgerEntry[] = [
  { id: '1', date: '15-Oct-2026', distributor: 'Metro Pharma Distributors', distributorCode: 'DIST-001', contactPerson: 'Rahul Sharma', refNo: 'INV-2026-991', type: 'Invoice', debitAmount: 150000, creditAmount: 0, balanceAmount: 360000, balanceType: 'Dr' },
  { id: '2', date: '14-Oct-2026', distributor: 'Metro Pharma Distributors', distributorCode: 'DIST-001', contactPerson: 'Rahul Sharma', refNo: 'RCPT-1002', type: 'Payment', debitAmount: 0, creditAmount: 50000, balanceAmount: 210000, balanceType: 'Dr' },
  { id: '3', date: '10-Oct-2026', distributor: 'Global Health Supply', distributorCode: 'DIST-002', contactPerson: 'Amit Patel', refNo: 'CN-2026-04', type: 'Credit Note', debitAmount: 0, creditAmount: 12000, balanceAmount: 43000, balanceType: 'Dr' },
];

export default function Ledgers() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const loggedInDistributorName = 'Metro Pharma Distributors';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewEntry, setViewEntry] = useState<LedgerEntry | null>(null);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Role-Based Data Filtering
  const roleFilteredData = activeRole === ROLE_DISTRIBUTOR 
    ? mockData.filter(d => d.distributor === loggedInDistributorName)
    : mockData;

  // 2. Search & Filter
  const filteredData = roleFilteredData.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = activeRole === ROLE_SUPER_ADMIN 
      ? item.distributor.toLowerCase().includes(searchLower) || item.refNo.toLowerCase().includes(searchLower)
      : item.refNo.toLowerCase().includes(searchLower);
      
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  // 3. Dynamic Export Functionality
  const getFormattedDate = () => new Date().toISOString().split('T')[0];

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => {
      const base = {
        Date: row.date,
        'Voucher No': row.refNo,
        'Transaction Type': row.type,
        'Debit Amount': row.debitAmount > 0 ? row.debitAmount : 0,
        'Credit Amount': row.creditAmount > 0 ? row.creditAmount : 0,
        'Running Balance': `${row.balanceAmount} ${row.balanceType}`
      };
      if (activeRole === ROLE_SUPER_ADMIN) {
        const { Date, ...rest } = base;
        return { Date, Distributor: row.distributor, ...rest };
      }
      return base;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger Statement');
    XLSX.writeFile(wb, `ledger_statement_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = activeRole === ROLE_SUPER_ADMIN 
      ? ['Date', 'Distributor', 'Voucher No', 'Transaction Type', 'Debit Amount', 'Credit Amount', 'Running Balance']
      : ['Date', 'Voucher No', 'Transaction Type', 'Debit Amount', 'Credit Amount', 'Running Balance'];

    const rows = filteredData.map(row => {
      const base = [
        row.date,
        row.refNo,
        row.type,
        row.debitAmount > 0 ? row.debitAmount : '0',
        row.creditAmount > 0 ? row.creditAmount : '0',
        `${row.balanceAmount} ${row.balanceType}`
      ];
      if (activeRole === ROLE_SUPER_ADMIN) {
        return [row.date, `"${row.distributor}"`, ...base.slice(1)];
      }
      return base;
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ledger_statement_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Statement of Account', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const head = activeRole === ROLE_SUPER_ADMIN
      ? [['Date', 'Distributor', 'Voucher No', 'Type', 'Debit', 'Credit', 'Balance']]
      : [['Date', 'Voucher No', 'Type', 'Debit', 'Credit', 'Balance']];

    const body = filteredData.map(row => {
      const base = [
        row.date,
        row.refNo,
        row.type,
        formatCurrency(row.debitAmount),
        formatCurrency(row.creditAmount),
        `Rs. ${row.balanceAmount.toLocaleString('en-IN')} ${row.balanceType}`
      ];
      if (activeRole === ROLE_SUPER_ADMIN) {
        return [row.date, row.distributor, ...base.slice(1)];
      }
      return base;
    });

    autoTable(doc, {
      startY: 30,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    doc.save(`ledger_statement_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  // 4. Role-Based Table Columns
  const adminColumns: Column<LedgerEntry>[] = [
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'distributor', label: 'Distributor', render: (row) => <span className="font-semibold text-slate-900">{row.distributor}</span> },
    { key: 'refNo', label: 'Voucher No', render: (row) => <span className="font-semibold text-slate-900">{row.refNo}</span> },
    { key: 'type', label: 'Transaction Type', render: (row) => <span className="text-slate-600">{row.type}</span> },
    { key: 'debit', label: 'Debit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.debitAmount)}</span> },
    { key: 'credit', label: 'Credit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.creditAmount)}</span> },
    { key: 'balance', label: 'Running Balance', render: (row) => <span className="font-bold text-violet-700">₹ {row.balanceAmount.toLocaleString('en-IN')} {row.balanceType}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewEntry(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const distributorColumns: Column<LedgerEntry>[] = [
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'refNo', label: 'Voucher No', render: (row) => <span className="font-semibold text-slate-900">{row.refNo}</span> },
    { key: 'type', label: 'Transaction Type', render: (row) => <span className="text-slate-600">{row.type}</span> },
    { key: 'debit', label: 'Debit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.debitAmount)}</span> },
    { key: 'credit', label: 'Credit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.creditAmount)}</span> },
    { key: 'balance', label: 'Running Balance', render: (row) => <span className="font-bold text-violet-700">₹ {row.balanceAmount.toLocaleString('en-IN')} {row.balanceType}</span> },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Ledger Access"
        subtitle="Financial account statements and transaction history."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Statement of Account
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV (.csv)</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF (.pdf)</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder={activeRole === ROLE_SUPER_ADMIN ? "Search distributor or voucher no..." : "Search voucher no..."} 
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Invoice', value: 'Invoice' },
            { label: 'Payment', value: 'Payment' },
            { label: 'Credit Note', value: 'Credit Note' },
            { label: 'Debit Note', value: 'Debit Note' },
          ]}
          placeholder="All Types"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          {activeRole === ROLE_SUPER_ADMIN ? (
            <DataTable
              columns={adminColumns}
              data={filteredData}
              emptyMessage="No ledger transactions found."
            />
          ) : (
            <DataTable
              columns={distributorColumns}
              data={filteredData}
              emptyMessage="No ledger transactions found."
            />
          )}
        </div>
      </TableCard>

      {/* --- View Drawer (Admin Only) --- */}
      <Drawer open={!!viewEntry} onClose={() => setViewEntry(null)} title="Transaction Details">
        {viewEntry && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transaction Information</h3>
              <div className="space-y-2">
                <DrawerField label="Date" value={viewEntry.date} />
                <DrawerField label="Voucher No" value={<span className="font-semibold text-slate-900">{viewEntry.refNo}</span>} />
                <DrawerField label="Transaction Type" value={viewEntry.type} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Distributor Information</h3>
              <div className="space-y-2">
                <DrawerField label="Distributor Name" value={viewEntry.distributor} />
                <DrawerField label="Distributor Code" value={viewEntry.distributorCode} />
                <DrawerField label="Contact Person" value={viewEntry.contactPerson} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Financial Information</h3>
              <div className="space-y-2">
                <DrawerField label="Debit Amount" value={formatCurrency(viewEntry.debitAmount)} />
                <DrawerField label="Credit Amount" value={formatCurrency(viewEntry.creditAmount)} />
                <DrawerField label="Running Balance" value={<span className="font-bold text-violet-700">₹ {viewEntry.balanceAmount.toLocaleString('en-IN')} {viewEntry.balanceType}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Reference Information</h3>
              <div className="space-y-2">
                {viewEntry.type === 'Invoice' && <DrawerField label="Invoice No" value={viewEntry.refNo} />}
                {viewEntry.type === 'Payment' && <DrawerField label="Receipt No" value={viewEntry.refNo} />}
                {viewEntry.type === 'Credit Note' && <DrawerField label="Credit Note No" value={viewEntry.refNo} />}
                {viewEntry.type === 'Debit Note' && <DrawerField label="Debit Note No" value={viewEntry.refNo} />}
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={() => setViewEntry(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
