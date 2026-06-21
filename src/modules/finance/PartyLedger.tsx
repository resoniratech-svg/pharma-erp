import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown, Filter, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router';

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

const getFormattedDate = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// -- MOCK DATA --
// Assuming positive is Debit (Customer balance)
const mockTransactions: Transaction[] = [
  // Apollo Pharmacy (Customer)
  { id: '1', date: '2026-10-01', particulars: 'Opening Balance', vchType: 'Opening Balance', vchNo: '-', referenceNo: '-', debit: 45000, credit: 0, partyId: 'apollo', partyType: 'Customer' },
  { id: '2', date: '2026-10-15', particulars: 'Sales (Apollo Pharmacy)', vchType: 'Sales Invoice', vchNo: 'INV/26/001', referenceNo: 'PO-1029', debit: 50400, credit: 0, partyId: 'apollo', partyType: 'Customer' },
  { id: '3', date: '2026-10-18', particulars: 'Bank Receipt (NEFT)', vchType: 'Receipt', vchNo: 'RCT/26/105', referenceNo: 'INV/26/001', debit: 0, credit: 45000, partyId: 'apollo', partyType: 'Customer' },
  { id: '4', date: '2026-10-20', particulars: 'Sales Return', vchType: 'Credit Note', vchNo: 'CN/26/012', referenceNo: 'INV/26/001', debit: 0, credit: 5400, partyId: 'apollo', partyType: 'Customer' },
  { id: '5', date: '2026-10-25', particulars: 'Sales (Apollo Pharmacy)', vchType: 'Sales Invoice', vchNo: 'INV/26/045', referenceNo: 'PO-1088', debit: 12000, credit: 0, partyId: 'apollo', partyType: 'Customer' },
  { id: '6', date: '2026-10-28', particulars: 'Bank Receipt (Cheque)', vchType: 'Receipt', vchNo: 'RCT/26/112', referenceNo: 'INV/26/045', debit: 0, credit: 12000, partyId: 'apollo', partyType: 'Customer' },
  
  // Metro Distributors (Distributor)
  { id: '7', date: '2026-10-01', particulars: 'Opening Balance', vchType: 'Opening Balance', vchNo: '-', referenceNo: '-', debit: 12000, credit: 0, partyId: 'metro', partyType: 'Distributor' },
  { id: '8', date: '2026-10-10', particulars: 'Sales (Metro)', vchType: 'Sales Invoice', vchNo: 'INV/26/045', referenceNo: 'PO-1088', debit: 32000, credit: 0, partyId: 'metro', partyType: 'Distributor' },
  { id: '9', date: '2026-10-28', particulars: 'Bank Receipt (RTGS)', vchType: 'Receipt', vchNo: 'RCT/26/112', referenceNo: 'INV/26/045', debit: 0, credit: 20000, partyId: 'metro', partyType: 'Distributor' },

  // Global Health (Hospital)
  { id: '10', date: '2026-10-05', particulars: 'Sales (Global Health)', vchType: 'Sales Invoice', vchNo: 'INV/26/018', referenceNo: 'PO-GH-001', debit: 85000, credit: 0, partyId: 'global', partyType: 'Hospital' },
  { id: '11', date: '2026-10-12', particulars: 'Bank Receipt (NEFT)', vchType: 'Receipt', vchNo: 'RCT/26/089', referenceNo: 'INV/26/018', debit: 0, credit: 50000, partyId: 'global', partyType: 'Hospital' },
  { id: '12', date: '2026-10-15', particulars: 'Sales Return', vchType: 'Credit Note', vchNo: 'CN/26/020', referenceNo: 'INV/26/018', debit: 0, credit: 5000, partyId: 'global', partyType: 'Hospital' },
  
  // Sun Pharma (Supplier)
  { id: '13', date: '2026-10-02', particulars: 'Purchase (Sun Pharma)', vchType: 'Purchase Invoice', vchNo: 'PUR/26/001', referenceNo: 'BILL-882', debit: 0, credit: 150000, partyId: 'sun', partyType: 'Supplier' },
  { id: '14', date: '2026-10-10', particulars: 'Bank Payment (RTGS)', vchType: 'Payment', vchNo: 'PMT/26/001', referenceNo: 'PUR/26/001', debit: 100000, credit: 0, partyId: 'sun', partyType: 'Supplier' },
  { id: '15', date: '2026-10-15', particulars: 'Purchase Return', vchType: 'Debit Note', vchNo: 'DN/26/001', referenceNo: 'PUR/26/001', debit: 15000, credit: 0, partyId: 'sun', partyType: 'Supplier' },
];

export default function PartyLedger() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [party, setParty] = useState(location.state?.partyId || 'apollo');
  const [partyType, setPartyType] = useState(location.state?.partyType || 'Customer');
  const [vchTypeFilter, setVchTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -- ACCOUNTING LOGIC --
  
  // 1. Sort transactions chronologically
  const sortedTransactions = useMemo(() => {
    return [...mockTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

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
    const dataToExport = [
      { Date: '', 'Voucher Type': '', 'Voucher No': '', Particulars: 'Opening Balance', 'Reference No': '', Debit: '', Credit: '', Balance: formatBalance(openingBalance) },
      ...ledgerRows.map(row => ({
        Date: row.date,
        'Voucher Type': row.vchType,
        'Voucher No': row.vchNo,
        Particulars: row.particulars,
        'Reference No': row.referenceNo,
        Debit: row.debit > 0 ? row.debit : '',
        Credit: row.credit > 0 ? row.credit : '',
        Balance: formatBalance(row.balance)
      })),
      { Date: '', 'Voucher Type': '', 'Voucher No': '', Particulars: 'Closing Balance', 'Reference No': '', Debit: '', Credit: '', Balance: formatBalance(closingBalance) },
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Party Ledger');
    XLSX.writeFile(workbook, `PartyLedger_${party}_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Party Ledger Statement - ${partyType}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 22);
    
    let filterText = `Filters Applied -> From: ${fromDate || 'Start'} To: ${toDate || 'End'} | Vch: ${vchTypeFilter || 'All'}`;
    doc.text(filterText, 14, 28);

    const pdfTableData = [
      ['', '', '', 'Opening Balance', '', '', '', formatBalance(openingBalance)],
      ...ledgerRows.map(row => [
        row.date, row.vchType, row.vchNo, row.particulars, row.referenceNo,
        row.debit > 0 ? formatCurrency(row.debit) : '-',
        row.credit > 0 ? formatCurrency(row.credit) : '-',
        formatBalance(row.balance)
      ]),
      ['', '', '', 'Closing Balance', '', '', '', formatBalance(closingBalance)]
    ];

    (doc as any).autoTable({
      head: [['Date', 'Voucher Type', 'Voucher No', 'Particulars', 'Ref No', 'Debit', 'Credit', 'Running Balance']],
      body: pdfTableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [80, 80, 80] } // Dark grey as requested for professional look
    });

    doc.save(`PartyLedger_${party}_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
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
                  <button onClick={handlePrint} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Printer className="w-4 h-4"/> Print Ledger</button>
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
            <DataTable
              columns={columns}
              data={ledgerRows}
              emptyMessage="No ledger entries found for the selected filters."
            />
          </div>
        </TableCard>
      </div>
    </div>
  );
}
