import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router';
import { ledgerService } from '../../services/ledgerService';

import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
} from './components/shared';
import { type Column } from './components/shared';

// -- TYPES --
interface Transaction {
  id: string;
  date: string;
  particulars: string;
  vchType: string;
  vchNo: string;
  referenceNo: string;
  debit: number;
  credit: number;
  partyId: string;
  partyType: string;
}

// -- HELPERS --
const formatCurrency = (amount: number) => {
  if (amount === 0) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
};

const formatBalance = (amount: number) => {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(absAmount);
  
  if (amount > 0) return `${formatted} Dr`;
  if (amount < 0) return `${formatted} Cr`;
  return `${formatted}`;
};

const formatPdfCurrency = (val: number) => {
  if (!val || val === 0) return '-';
  const num = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num);
  return `Rs. ${formatted}`;
};

const formatPdfBalance = (val: number) => {
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(absVal);
  if (val > 0) return `Rs. ${formatted} Dr`;
  if (val < 0) return `Rs. ${formatted} Cr`;
  return `Rs. ${formatted}`;
};

const getFormattedDate = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// No mock data - fetching from API
export default function PartyLedger() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [party, setParty] = useState(location.state?.partyId || '');
  const [partyType, setPartyType] = useState(location.state?.partyType || '');
  const [vchTypeFilter, setVchTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Fetch Data
    const fetchLedgers = async () => {
      setIsLoading(true);
      try {
        const rawLedgers = await ledgerService.getAll();
        const mapped: Transaction[] = rawLedgers.map(l => ({
          id: l.id,
          date: l.date,
          particulars: l.distributor || 'General Ledger Entry',
          vchType: l.type,
          vchNo: l.id.toString(), // or an actual invoice number
          referenceNo: l.refNo,
          debit: l.debitAmount,
          credit: l.creditAmount,
          partyId: l.distributorCode,
          partyType: 'Distributor' // We might infer this from a proper type field if we had one
        }));
        setTransactions(mapped);
      } catch (err) {
        console.error("Error fetching ledgers:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLedgers();

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -- ACCOUNTING LOGIC --
  
  // 1. Sort transactions chronologically
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  // 2. Compute opening balance based on From Date
  const { openingBalance, filteredTransactions } = useMemo(() => {
    let openingBal = 0;
    const filtered: Transaction[] = [];

    sortedTransactions.forEach(t => {
      // 1. Filter by Party & Party Type first
      if (party && t.partyId !== party) return;
      if (partyType && t.partyType !== partyType) return;

      // 2. Filter by date and compute opening balance
      if (fromDate && new Date(t.date) < new Date(fromDate)) {
        openingBal += (t.debit - t.credit);
      } else {
        // Apply To Date
        if (toDate && new Date(t.date) > new Date(toDate)) return;
        
        // Apply other filters
        const s = search.toLowerCase();
        const matchSearch = t.particulars.toLowerCase().includes(s) || t.vchNo.toLowerCase().includes(s) || t.referenceNo.toLowerCase().includes(s);
        const matchVch = vchTypeFilter ? t.vchType === vchTypeFilter : true;
        
        if (matchSearch && matchVch) {
          filtered.push(t);
        }
      }
    });

    return { openingBalance: openingBal, filteredTransactions: filtered };
  }, [sortedTransactions, fromDate, toDate, search, vchTypeFilter, party, partyType]);

  // 3. Compute running balance rows
  const ledgerRows = useMemo(() => {
    let runningBal = openingBalance;
    return filteredTransactions.map(t => {
      runningBal += (t.debit - t.credit);
      return { ...t, balance: runningBal };
    });
  }, [filteredTransactions, openingBalance]);

  const closingBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].balance : openingBalance;

  // -- EXPORTS --
  const handleExportExcel = () => {
    const rowsExport: any[] = [];
    if (fromDate && openingBalance !== 0) {
      rowsExport.push({
        Date: fromDate,
        'Voucher Type': 'Opening Balance',
        'Voucher No': 'OB-B/F',
        Particulars: 'Opening Balance B/F',
        'Reference No': 'OB-REF',
        Debit: openingBalance > 0 ? openingBalance : '',
        Credit: openingBalance < 0 ? Math.abs(openingBalance) : '',
        Balance: formatBalance(openingBalance)
      });
    }

    ledgerRows.forEach(row => {
      rowsExport.push({
        Date: row.date,
        'Voucher Type': row.vchType,
        'Voucher No': row.vchNo || 'OB-2026/01',
        Particulars: row.particulars,
        'Reference No': row.referenceNo || 'REF-101',
        Debit: row.debit > 0 ? row.debit : '',
        Credit: row.credit > 0 ? row.credit : '',
        Balance: formatBalance(row.balance)
      });
    });

    if (ledgerRows.length > 0) {
      const lastRow = ledgerRows[ledgerRows.length - 1];
      rowsExport.push({
        Date: lastRow.date,
        'Voucher Type': 'Closing Balance',
        'Voucher No': 'CB-2026',
        Particulars: 'Closing Balance C/F',
        'Reference No': 'CB-FINAL',
        Debit: '',
        Credit: '',
        Balance: formatBalance(closingBalance)
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rowsExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Party Ledger');
    XLSX.writeFile(workbook, `PartyLedger_${party}_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 60, 120);
    doc.text('MJ HEALTHCARE ERP', 14, 18);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`Party Ledger Statement - ${partyType}`, 14, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 31);

    const pdfTableData: any[] = [];

    // Only add Opening Balance summary header if a From Date was selected and opening balance exists
    if (fromDate && openingBalance !== 0) {
      pdfTableData.push([
        fromDate,
        'Opening Balance',
        'OB-B/F',
        'Opening Balance B/F',
        'OB-REF',
        openingBalance > 0 ? formatPdfCurrency(openingBalance) : '-',
        openingBalance < 0 ? formatPdfCurrency(Math.abs(openingBalance)) : '-',
        formatPdfBalance(openingBalance)
      ]);
    }

    ledgerRows.forEach(row => {
      pdfTableData.push([
        row.date,
        row.vchType,
        row.vchNo && row.vchNo !== '-' ? row.vchNo : 'OB-2026/01',
        row.particulars,
        row.referenceNo && row.referenceNo !== '-' ? row.referenceNo : 'REF-101',
        row.debit > 0 ? formatPdfCurrency(row.debit) : '-',
        row.credit > 0 ? formatPdfCurrency(row.credit) : '-',
        formatPdfBalance(row.balance)
      ]);
    });

    if (ledgerRows.length > 0) {
      const lastRow = ledgerRows[ledgerRows.length - 1];
      pdfTableData.push([
        lastRow.date,
        'Closing Balance',
        'CB-2026',
        'Closing Balance C/F',
        'CB-FINAL',
        '-',
        '-',
        formatPdfBalance(closingBalance)
      ]);
    }

    autoTable(doc, {
      startY: 36,
      head: [['Date', 'Voucher Type', 'Voucher No', 'Particulars', 'Ref No', 'Debit', 'Credit', 'Balance']],
      body: pdfTableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 60, 120], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    doc.save(`PartyLedger_${party}_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  // -- COLUMNS --
  const columns: Column<typeof ledgerRows[0]>[] = [
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600 whitespace-nowrap">{row.date}</span> },
    { key: 'vchType', label: 'Voucher Type', render: (row) => <span className="text-slate-600">{row.vchType}</span> },
    { key: 'vchNo', label: 'Voucher No' },
    { key: 'particulars', label: 'Particulars', render: (row) => <span className="font-medium text-slate-900">{row.particulars}</span> },
    { key: 'referenceNo', label: 'Reference No', render: (row) => <span className="text-slate-500 text-sm">{row.referenceNo}</span> },
    { key: 'debit', label: 'Debit', render: (row) => <span className="text-rose-600 font-medium">{row.debit > 0 ? formatCurrency(row.debit) : '-'}</span> },
    { key: 'credit', label: 'Credit', render: (row) => <span className="text-emerald-600 font-medium">{row.credit > 0 ? formatCurrency(row.credit) : '-'}</span> },
    { key: 'balance', label: 'Running Balance', render: (row) => <span className="font-bold text-slate-800">{formatBalance(row.balance)}</span> },
  ];

  return (
    <div className="animate-in fade-in duration-500 print:m-0 print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="Party Ledger"
          subtitle="Statement of account for customers, suppliers, and distributors."
          actions={
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
                <ChevronDown className="w-3 h-3 ml-1" />
              </ActionButton>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1">
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Download className="w-4 h-4"/> Export Excel</button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Download className="w-4 h-4"/> Export PDF</button>
                </div>
              )}
            </div>
          }
        />

        <FilterBar>
          <div className="flex flex-wrap items-center gap-3 w-full">
            <SelectFilter
              value={party}
              onChange={setParty}
              options={[
                { label: 'All Parties', value: '' },
                { label: 'Apollo Pharmacy', value: 'apollo' },
                { label: 'Metro Distributors', value: 'metro' },
                { label: 'Global Health', value: 'global' },
                { label: 'Sun Pharma', value: 'sun' },
              ]}
              placeholder="Select Party"
            />
            <SelectFilter
              value={partyType}
              onChange={setPartyType}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Customer', value: 'Customer' },
                { label: 'Supplier', value: 'Supplier' },
                { label: 'Distributor', value: 'Distributor' },
                { label: 'Vendor', value: 'Vendor' },
                { label: 'Hospital', value: 'Hospital' },
                { label: 'Retailer', value: 'Retailer' },
              ]}
              placeholder="Party Type"
            />
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
              <span className="text-sm text-slate-500">From</span>
              <input 
                type="date" 
                className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-[110px]"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
              <span className="text-sm text-slate-500">To</span>
              <input 
                type="date" 
                className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-[110px]"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <SelectFilter
              value={vchTypeFilter}
              onChange={setVchTypeFilter}
              options={[
                { label: 'All Vouchers', value: '' },
                { label: 'Sales Invoice', value: 'Sales Invoice' },
                { label: 'Receipt', value: 'Receipt' },
                { label: 'Credit Note', value: 'Credit Note' },
                { label: 'Debit Note', value: 'Debit Note' },
                { label: 'Journal Voucher', value: 'Journal Voucher' },
                { label: 'Opening Balance', value: 'Opening Balance' },
                { label: 'Payment', value: 'Payment' },
              ]}
              placeholder="Voucher Type"
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Search particulars, ref no..." />
          </div>
        </FilterBar>
      </div>

      {/* Accounting Balance Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
        <div className="text-slate-700 font-medium text-sm">
          Opening Balance: <span className="font-bold text-slate-900 ml-1">{formatBalance(openingBalance)}</span>
        </div>
        <div className="text-slate-700 font-medium text-sm mt-2 sm:mt-0">
          Closing Balance: <span className="font-bold text-slate-900 ml-1">{formatBalance(closingBalance)}</span>
        </div>
      </div>

      <div className="print:block print:w-full print:bg-white print:border-none">
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Party Ledger - {partyType}</h1>
          <p className="text-slate-600">Generated On: {new Date().toLocaleString()}</p>
        </div>
        
        <TableCard>
          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading ledger data...</div>
            ) : (
              <DataTable
                columns={columns}
                data={ledgerRows}
                emptyMessage="No ledger entries found for the selected filters."
              />
            )}
          </div>
        </TableCard>
      </div>
    </div>
  );
}
