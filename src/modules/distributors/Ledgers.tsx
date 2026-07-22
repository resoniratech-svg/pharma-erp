import { useState, useMemo, useEffect, useRef } from 'react';
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
  id?: string;
  date: string;
  distributor: string;
  distributorCode: string;
  contactPerson: string;
  refNo: string;
  type: 'Invoice' | 'Payment' | 'Credit Note' | 'Debit Note';
  debitAmount: number;
  creditAmount: number;
  openingBalanceAmount?: number;
  openingBalanceType?: 'Dr' | 'Cr';
  balanceAmount: number;
  balanceType: 'Dr' | 'Cr';
  remarks?: string;
}

const formatCurrency = (amount: number) => {
  if (amount === 0) return '-';
  return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getDDMMYYYY = (date: Date) => {
  if (isNaN(date.getTime())) return '-';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const parseDateString = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return new Date(NaN);
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) { // DD-MM-YYYY
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else if (parts[0].length === 4) { // YYYY-MM-DD
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
  }
  return new Date(dateStr);
};

export default function Ledgers() {
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

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    // 1. Gather raw transactions
    interface RawTransaction {
      id: string;
      date: string;
      distributor: string;
      distributorCode: string;
      contactPerson: string;
      refNo: string;
      type: 'Invoice' | 'Payment' | 'Credit Note' | 'Debit Note';
      debitAmount: number;
      creditAmount: number;
      remarks?: string;
    }
    const transactions: RawTransaction[] = [];

    // Check if an explicit pre-calculated ledger exists
    const rawLedger = localStorage.getItem('pharma_erp_ledger');
    if (rawLedger) {
      try {
        const parsed = JSON.parse(rawLedger);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((t: any) => transactions.push(t));
        }
      } catch (e) {}
    }

    if (transactions.length === 0) {
      // Load invoices and distributors for data enrichment
      const invoiceData = localStorage.getItem('pharma_erp_invoices') || localStorage.getItem('pharma_erp_sales_invoices');
      let invoices: any[] = [];
      if (invoiceData) {
        try {
          invoices = JSON.parse(invoiceData);
        } catch (e) {}
      }

      const distData = localStorage.getItem('pharma_erp_distributors');
      let distributors: any[] = [];
      if (distData) {
        try {
          distributors = JSON.parse(distData);
        } catch (e) {}
      }

      // Build from integration points if no explicit ledger exists
      const outData = localStorage.getItem('pharma_erp_outstanding_records');
      if (outData) {
        try {
          const records: any[] = JSON.parse(outData);
          records.forEach(rec => {
            if (rec.invoices) {
              rec.invoices.forEach((inv: any) => {
                const matchedDist = distributors.find(d => (d.code || d.distributorCode || d.id) === rec.distributorCode);
                const distName = rec.distributorName || (matchedDist ? (matchedDist.name || matchedDist.distributorName) : '');
                transactions.push({
                  id: inv.id || inv.invoiceNo,
                  date: inv.date,
                  distributor: distName || 'Metro Pharma Distributors',
                  distributorCode: rec.distributorCode,
                  contactPerson: rec.contactPerson || '',
                  refNo: inv.invoiceNo,
                  type: 'Invoice',
                  debitAmount: inv.amount,
                  creditAmount: 0,
                  remarks: 'Sales Invoice'
                });
              });
            }
          });
        } catch (e) {}
      }

      const payData = localStorage.getItem('pharma_erp_payments');
      if (payData) {
        try {
          const payments: any[] = JSON.parse(payData);
          payments.forEach(pay => {
            const matchedInv = invoices.find(inv => inv.invoiceNo === pay.invoiceNo);
            const distCode = pay.distributorCode || (matchedInv ? matchedInv.distributorCode : 'DIST-001');
            const matchedDist = distributors.find(d => (d.code || d.distributorCode || d.id) === distCode);
            const distName = pay.distributorName || pay.distributor || (matchedDist ? (matchedDist.name || matchedDist.distributorName) : 'Metro Pharma Distributors');

            transactions.push({
              id: pay.id || pay.receiptNo || pay.refNo,
              date: pay.date || pay.paymentDate || (matchedInv ? matchedInv.date : ''),
              distributor: distName,
              distributorCode: distCode,
              contactPerson: pay.contactPerson || '',
              refNo: pay.receiptNo || pay.refNo || pay.transactionRef || pay.id,
              type: 'Payment',
              debitAmount: 0,
              creditAmount: pay.amount || pay.creditAmount,
              remarks: pay.remarks || pay.notes || 'Payment Received'
            });
          });
        } catch (e) {}
      }

      const cnData = localStorage.getItem('pharma_erp_credit_notes');
      if (cnData) {
        try {
          const notes: any[] = JSON.parse(cnData);
          notes.forEach(note => {
            const matchedDist = distributors.find(d => (d.code || d.distributorCode || d.id) === note.distributorCode);
            const distName = note.distributorName || note.distributor || (matchedDist ? (matchedDist.name || matchedDist.distributorName) : 'Metro Pharma Distributors');
            transactions.push({
              id: note.id || note.noteNo || note.refNo,
              date: note.date,
              distributor: distName,
              distributorCode: note.distributorCode,
              contactPerson: note.contactPerson || '',
              refNo: note.noteNo || note.refNo,
              type: 'Credit Note',
              debitAmount: 0,
              creditAmount: note.amount || note.creditAmount,
              remarks: note.remarks || 'Credit Note'
            });
          });
        } catch (e) {}
      }

      const dnData = localStorage.getItem('pharma_erp_debit_notes');
      if (dnData) {
        try {
          const notes: any[] = JSON.parse(dnData);
          notes.forEach(note => {
            const matchedDist = distributors.find(d => (d.code || d.distributorCode || d.id) === note.distributorCode);
            const distName = note.distributorName || note.distributor || (matchedDist ? (matchedDist.name || matchedDist.distributorName) : 'Metro Pharma Distributors');
            transactions.push({
              id: note.id || note.noteNo || note.refNo,
              date: note.date,
              distributor: distName,
              distributorCode: note.distributorCode,
              contactPerson: note.contactPerson || '',
              refNo: note.noteNo || note.refNo,
              type: 'Debit Note',
              debitAmount: note.amount || note.debitAmount,
              creditAmount: 0,
              remarks: note.remarks || 'Debit Note'
            });
          });
        } catch (e) {}
      }

      if (transactions.length === 0) {
        transactions.push(
          {
            id: 'LEG-1001',
            date: '01-09-2026',
            distributor: 'Metro Pharma Distributors',
            distributorCode: 'DIST-001',
            contactPerson: 'Rajesh Kumar',
            refNo: 'INV-2026-089',
            type: 'Invoice',
            debitAmount: 45000,
            creditAmount: 0,
            remarks: 'Sales Invoice INV-2026-089'
          },
          {
            id: 'LEG-1002',
            date: '10-09-2026',
            distributor: 'Metro Pharma Distributors',
            distributorCode: 'DIST-001',
            contactPerson: 'Rajesh Kumar',
            refNo: 'PAY-89012',
            type: 'Payment',
            debitAmount: 0,
            creditAmount: 20000,
            remarks: 'NEFT Bank Transfer HDFC'
          },
          {
            id: 'LEG-1003',
            date: '05-10-2026',
            distributor: 'Metro Pharma Distributors',
            distributorCode: 'DIST-001',
            contactPerson: 'Rajesh Kumar',
            refNo: 'INV-2026-095',
            type: 'Invoice',
            debitAmount: 80000,
            creditAmount: 0,
            remarks: 'Sales Invoice INV-2026-095'
          },
          {
            id: 'LEG-1004',
            date: '10-10-2026',
            distributor: 'Global Health Supply',
            distributorCode: 'DIST-002',
            contactPerson: 'Suresh Verma',
            refNo: 'INV-2026-102',
            type: 'Invoice',
            debitAmount: 150000,
            creditAmount: 0,
            remarks: 'Sales Invoice INV-2026-102'
          }
        );
      }
    }

    // 2. Sort chronologically to correctly calculate running balance
    transactions.sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

    // 3. Calculate running balance per distributor
    const grouped: Record<string, RawTransaction[]> = {};
    transactions.forEach(t => {
      if (!grouped[t.distributorCode]) grouped[t.distributorCode] = [];
      grouped[t.distributorCode].push(t);
    });

    const computedLedger: LedgerEntry[] = [];
    Object.keys(grouped).forEach(distCode => {
      let runningBalance = 0; // Opening Balance defaults to 0
      grouped[distCode].forEach(t => {
        const openingBal = runningBalance;
        runningBalance += (t.debitAmount - t.creditAmount);
        computedLedger.push({
          ...t,
          date: getDDMMYYYY(parseDateString(t.date)), // standardize date format
          openingBalanceAmount: Math.abs(openingBal),
          openingBalanceType: openingBal >= 0 ? 'Dr' : 'Cr',
          balanceAmount: Math.abs(runningBalance),
          balanceType: runningBalance >= 0 ? 'Dr' : 'Cr'
        });
      });
    });

    // 4. Sort computed ledger reverse chronologically for display
    computedLedger.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());

    setLedgerEntries(computedLedger);
  }, []);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [viewEntry, setViewEntry] = useState<LedgerEntry | null>(null);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 1. Role-Based Data Filtering
  const roleFilteredData = activeRole === ROLE_DISTRIBUTOR 
    ? ledgerEntries.filter(d => d.distributorCode === loggedInDistributor.code)
    : ledgerEntries;

  // 2. Search & Filter
  const filteredData = roleFilteredData.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = activeRole === ROLE_SUPER_ADMIN 
      ? (item.distributor || '').toLowerCase().includes(searchLower) || (item.refNo || '').toLowerCase().includes(searchLower)
      : (item.refNo || '').toLowerCase().includes(searchLower);
      
    const matchType = typeFilter ? item.type === typeFilter : true;
    const matchDate = dateRange ? item.date === getDDMMYYYY(new Date(dateRange)) : true;
    
    return matchSearch && matchType && matchDate;
  });

  // 3. Dynamic Export Functionality
  const getFormattedDate = () => getDDMMYYYY(new Date());

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
    doc.text(`Generated on: ${getFormattedDate()}`, 14, 22);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Role-Based Table Columns
  const adminColumns: Column<LedgerEntry>[] = [
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'distributor', label: 'Distributor', render: (row) => <span className="font-semibold text-slate-900">{row.distributor}</span> },
    { key: 'refNo', label: 'Voucher No', render: (row) => <span className="font-semibold text-slate-900">{row.refNo}</span> },
    { key: 'type', label: 'Transaction Type', render: (row) => <span className="text-slate-600">{row.type}</span> },
    { key: 'debitAmount', label: 'Debit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.debitAmount)}</span> },
    { key: 'creditAmount', label: 'Credit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.creditAmount)}</span> },
    { key: 'balanceAmount', label: 'Running Balance', render: (row) => <span className="font-bold text-violet-700">₹ {row.balanceAmount.toLocaleString('en-IN')} {row.balanceType}</span> },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewEntry(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View">
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
    { key: 'debitAmount', label: 'Debit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.debitAmount)}</span> },
    { key: 'creditAmount', label: 'Credit Amount', render: (row) => <span className="text-slate-800 font-medium">{formatCurrency(row.creditAmount)}</span> },
    { key: 'balanceAmount', label: 'Running Balance', render: (row) => <span className="font-bold text-violet-700">₹ {row.balanceAmount.toLocaleString('en-IN')} {row.balanceType}</span> },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewEntry(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
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
        <input 
          type="date" 
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
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

      {/* --- View Drawer --- */}
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

            {activeRole === ROLE_SUPER_ADMIN && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Distributor Information</h3>
                <div className="space-y-2">
                  <DrawerField label="Distributor Name" value={viewEntry.distributor} />
                  <DrawerField label="Distributor Code" value={viewEntry.distributorCode} />
                  <DrawerField label="Contact Person" value={viewEntry.contactPerson} />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Financial Information</h3>
              <div className="space-y-2">
                <DrawerField label="Opening Balance" value={<span>₹ {viewEntry.openingBalanceAmount?.toLocaleString('en-IN') || '0'} {viewEntry.openingBalanceType || 'Dr'}</span>} />
                <DrawerField label="Debit Amount" value={formatCurrency(viewEntry.debitAmount)} />
                <DrawerField label="Credit Amount" value={formatCurrency(viewEntry.creditAmount)} />
                <DrawerField label="Running Balance" value={<span className="font-bold text-violet-700">₹ {viewEntry.balanceAmount.toLocaleString('en-IN')} {viewEntry.balanceType}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Reference Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {viewEntry.type === 'Invoice' && <DrawerField label="Invoice No" value={viewEntry.refNo} />}
                {viewEntry.type === 'Payment' && <DrawerField label="Receipt No" value={viewEntry.refNo} />}
                {viewEntry.type === 'Credit Note' && <DrawerField label="Credit Note No" value={viewEntry.refNo} />}
                {viewEntry.type === 'Debit Note' && <DrawerField label="Debit Note No" value={viewEntry.refNo} />}
                <DrawerField label="Narration / Remarks" value={viewEntry.remarks || '-'} />
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