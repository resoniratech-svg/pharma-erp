import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown, Printer, Eye, BookOpen, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// --- Types ---
type PartyType = 'Customer' | 'Supplier' | 'Distributor' | 'Vendor';
type Status = 'Current' | 'Overdue' | 'Critical';

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
}

interface PartyRecord {
  id: string;
  partyName: string;
  partyType: PartyType;
  creditDays: number;
  lastPaymentDate: string;
  invoices: Invoice[];
}

interface ComputedAgingRow extends PartyRecord {
  currentAmt: number;
  days31_60: number;
  days61_90: number;
  days91_120: number;
  above120: number;
  totalOutstanding: number;
  status: Status;
}

// --- Helpers ---
const formatCurrency = (amount: number) => {
  if (amount === 0) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusVariant = (status: Status): BadgeVariant => {
  if (status === 'Current') return 'success';
  if (status === 'Overdue') return 'warning';
  if (status === 'Critical') return 'danger';
  return 'neutral';
};

const getFormattedDate = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// --- Mock Data ---
const mockData: PartyRecord[] = [
  {
    id: 'apollo',
    partyName: 'Apollo Pharmacy',
    partyType: 'Customer',
    creditDays: 30,
    lastPaymentDate: '2026-10-18',
    invoices: [
      { id: 'INV-001', invoiceNo: 'INV/26/001', date: '2026-05-01', dueDate: '2026-06-01', amount: 50400, paidAmount: 5400 },
      { id: 'INV-002', invoiceNo: 'INV/26/045', date: '2026-09-25', dueDate: '2026-10-25', amount: 50000, paidAmount: 0 },
    ]
  },
  {
    id: 'sun',
    partyName: 'Sun Pharma',
    partyType: 'Supplier',
    creditDays: 60,
    lastPaymentDate: '2026-09-10',
    invoices: [
      { id: 'PUR-001', invoiceNo: 'PUR/26/001', date: '2026-06-01', dueDate: '2026-07-31', amount: 150000, paidAmount: 0 },
      { id: 'PUR-002', invoiceNo: 'PUR/26/089', date: '2026-08-05', dueDate: '2026-10-04', amount: 350000, paidAmount: 300000 },
    ]
  },
  {
    id: 'metro',
    partyName: 'Metro Distributors',
    partyType: 'Distributor',
    creditDays: 45,
    lastPaymentDate: '2026-10-28',
    invoices: [
      { id: 'INV-101', invoiceNo: 'INV/26/101', date: '2026-10-20', dueDate: '2026-12-04', amount: 32000, paidAmount: 0 },
    ]
  },
  {
    id: 'wellness',
    partyName: 'Wellness Medicos',
    partyType: 'Customer',
    creditDays: 30,
    lastPaymentDate: '-',
    invoices: [
      { id: 'INV-050', invoiceNo: 'INV/26/050', date: '2026-04-10', dueDate: '2026-05-10', amount: 85000, paidAmount: 0 },
    ]
  }
];

export default function AgingReports() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedParty, setSelectedParty] = useState<ComputedAgingRow | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Core Computations ---
  const today = new Date();
  
  const computedData: ComputedAgingRow[] = useMemo(() => {
    return mockData.map(party => {
      let currentAmt = 0;
      let days31_60 = 0;
      let days61_90 = 0;
      let days91_120 = 0;
      let above120 = 0;
      let totalOutstanding = 0;

      party.invoices.forEach(inv => {
        const bal = inv.amount - inv.paidAmount;
        if (bal > 0) {
          totalOutstanding += bal;
          const dDate = new Date(inv.dueDate);
          const diffDays = Math.floor((today.getTime() - dDate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays <= 30) {
            currentAmt += bal;
          } else if (diffDays <= 60) {
            days31_60 += bal;
          } else if (diffDays <= 90) {
            days61_90 += bal;
          } else if (diffDays <= 120) {
            days91_120 += bal;
          } else {
            above120 += bal;
          }
        }
      });

      let status: Status = 'Current';
      if (above120 > 0) status = 'Critical';
      else if (days31_60 > 0 || days61_90 > 0 || days91_120 > 0) status = 'Overdue';

      return {
        ...party,
        currentAmt,
        days31_60,
        days61_90,
        days91_120,
        above120,
        totalOutstanding,
        status
      };
    });
  }, [today]);

  // --- Filtering ---
  const filteredData = useMemo(() => {
    return computedData.filter(row => {
      if (search && !row.partyName.toLowerCase().includes(search.toLowerCase())) return false;
      if (partyTypeFilter && row.partyType !== partyTypeFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;

      // Filter by any invoice falling in Date Range (if applied)
      if (fromDate || toDate) {
        let hasInvoiceInDateRange = false;
        row.invoices.forEach(inv => {
          const d = new Date(inv.dueDate);
          const matchFrom = fromDate ? d >= new Date(fromDate) : true;
          const matchTo = toDate ? d <= new Date(toDate) : true;
          if (matchFrom && matchTo && (inv.amount - inv.paidAmount > 0)) {
            hasInvoiceInDateRange = true;
          }
        });
        if (!hasInvoiceInDateRange) return false;
      }

      return true;
    });
  }, [computedData, search, partyTypeFilter, statusFilter, fromDate, toDate]);

  // --- KPI Aggregations ---
  const { totalReceivables, totalPayables } = useMemo(() => {
    let rec = 0;
    let pay = 0;
    filteredData.forEach(row => {
      if (row.partyType === 'Customer' || row.partyType === 'Distributor') rec += row.totalOutstanding;
      else pay += row.totalOutstanding;
    });
    return { totalReceivables: rec, totalPayables: pay };
  }, [filteredData]);

  // --- Exports ---
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(row => ({
      'Party Name': row.partyName,
      'Party Type': row.partyType,
      'Credit Days': row.creditDays,
      'Current': row.currentAmt,
      '31-60 Days': row.days31_60,
      '61-90 Days': row.days61_90,
      '91-120 Days': row.days91_120,
      '> 120 Days': row.above120,
      'Total Outstanding': row.totalOutstanding,
      'Last Payment Date': row.lastPaymentDate,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aging');
    XLSX.writeFile(workbook, `Outstanding_Aging_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Outstanding Aging Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 22);

    const pdfTableData = filteredData.map(row => [
      row.partyName,
      row.partyType,
      formatCurrency(row.currentAmt),
      formatCurrency(row.days31_60),
      formatCurrency(row.days61_90),
      formatCurrency(row.days91_120),
      formatCurrency(row.above120),
      formatCurrency(row.totalOutstanding),
      row.status
    ]);

    (doc as any).autoTable({
      head: [['Party Name', 'Type', 'Current', '31-60', '61-90', '91-120', '>120', 'Total', 'Status']],
      body: pdfTableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [80, 80, 80] }
    });

    doc.save(`Outstanding_Aging_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
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
        partyTypeFilter && `Party Type: ${partyTypeFilter}`,
        statusFilter && `Status: ${statusFilter}`,
        fromDate && `From: ${fromDate}`,
        toDate && `To: ${toDate}`
      ].filter(Boolean).join(', ');

      const printRows = filteredData.map(row => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; color: #000;">${row.partyName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.partyType}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.creditDays}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${formatCurrency(row.currentAmt)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${formatCurrency(row.days31_60)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${formatCurrency(row.days61_90)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${formatCurrency(row.days91_120)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; color: #e11d48;">${formatCurrency(row.above120)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; color: #000;">${formatCurrency(row.totalOutstanding)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.status}</td>
        </tr>
      `).join('');

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Outstanding Aging Report</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0;
                color: #000; 
                background: #fff;
                font-size: 9px;
              }
              .header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header h1 { font-size: 18px; margin: 0 0 5px 0; color: #000; }
              .header p { margin: 0 0 3px 0; font-size: 11px; color: #000; }
              .summary { display: flex; gap: 40px; margin-bottom: 20px; }
              .summary div { border: 1px solid #000; padding: 10px; flex: 1; }
              .summary p.label { font-size: 11px; margin: 0 0 5px 0; font-weight: bold; }
              .summary p.val { font-size: 16px; margin: 0; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; page-break-inside: auto; table-layout: fixed; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              th { 
                padding: 8px; 
                border-bottom: 2px solid #000; 
                text-align: left; 
                font-weight: bold; 
                color: #000;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Outstanding Aging Report</h1>
              <p>Generated On: ${new Date().toLocaleString()}</p>
              ${filtersText ? `<p>Filters Applied: ${filtersText}</p>` : ''}
            </div>
            
            <div class="summary">
              <div>
                <p class="label">Total Receivables</p>
                <p class="val">${formatCurrency(totalReceivables)}</p>
              </div>
              <div>
                <p class="label">Total Payables</p>
                <p class="val">${formatCurrency(totalPayables)}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 14%;">Party Name</th>
                  <th style="width: 8%;">Type</th>
                  <th style="width: 6%;">Days</th>
                  <th style="width: 9%;">Current</th>
                  <th style="width: 9%;">31-60</th>
                  <th style="width: 9%;">61-90</th>
                  <th style="width: 9%;">91-120</th>
                  <th style="width: 9%;">>120</th>
                  <th style="width: 10%;">Total</th>
                  <th style="width: 8%;">Status</th>
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

  const handleViewLedger = (party: ComputedAgingRow) => {
    try {
      navigate('/workspace/finance/ledger', { 
        state: { partyId: party.id, partyName: party.partyName, partyType: party.partyType } 
      });
    } catch (error) {
      alert("Party Ledger screen is currently unavailable.");
    }
  };

  // --- Columns ---
  const columns: Column<ComputedAgingRow>[] = [
    { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span> },
    { key: 'partyType', label: 'Party Type', render: (row) => <span className="text-slate-600">{row.partyType}</span> },
    { key: 'creditDays', label: 'Credit Days', render: (row) => <span className="text-slate-600">{row.creditDays}</span> },
    { key: 'currentAmt', label: 'Current (0-30 Days)', render: (row) => <span className="text-slate-600 font-medium">{formatCurrency(row.currentAmt)}</span> },
    { key: 'days31_60', label: '31-60 Days', render: (row) => <span className="text-amber-600 font-medium">{formatCurrency(row.days31_60)}</span> },
    { key: 'days61_90', label: '61-90 Days', render: (row) => <span className="text-orange-600 font-medium">{formatCurrency(row.days61_90)}</span> },
    { key: 'days91_120', label: '91-120 Days', render: (row) => <span className="text-rose-600 font-medium">{formatCurrency(row.days91_120)}</span> },
    { key: 'above120', label: '> 120 Days', render: (row) => <span className="text-rose-700 font-bold">{formatCurrency(row.above120)}</span> },
    { key: 'totalOutstanding', label: 'Total Outstanding', render: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.totalOutstanding)}</span> },
    { key: 'lastPaymentDate', label: 'Last Payment Date', render: (row) => <span className="text-slate-600">{row.lastPaymentDate}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <ActionButton 
            variant="ghost" 
            onClick={() => setSelectedParty(row)} 
            className="text-slate-400 hover:text-violet-600 px-2 py-1 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> <span className="text-xs">View Details</span>
          </ActionButton>
          <ActionButton 
            variant="ghost" 
            onClick={() => handleViewLedger(row)} 
            className="text-slate-400 hover:text-emerald-600 px-2 py-1 flex items-center gap-1"
          >
            <BookOpen className="w-4 h-4" /> <span className="text-xs">View Ledger</span>
          </ActionButton>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 print:m-0 print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="Outstanding Aging"
          subtitle="Monitor outstanding receivables and payables based on aging buckets."
          actions={
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export Aging
                <ChevronDown className="w-3 h-3 ml-1" />
              </ActionButton>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1">
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Download className="w-4 h-4"/> Export Excel</button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Download className="w-4 h-4"/> Export PDF</button>
                  <button onClick={handlePrint} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Printer className="w-4 h-4"/> Print Report</button>
                </div>
              )}
            </div>
          }
        />

        <div className="flex flex-col sm:flex-row gap-6 mb-8 mt-2">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Total Receivables</p>
              <h3 className="text-xl font-bold text-emerald-700">{formatCurrency(totalReceivables)}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Total Payables</p>
              <h3 className="text-xl font-bold text-rose-700">{formatCurrency(totalPayables)}</h3>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>

        <FilterBar>
          <div className="flex flex-wrap items-center gap-3 w-full">
            <SearchInput value={search} onChange={setSearch} placeholder="Search party name..." />
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <SelectFilter
              value={partyTypeFilter}
              onChange={setPartyTypeFilter}
              options={[
                { label: 'All', value: '' },
                { label: 'Customer', value: 'Customer' },
                { label: 'Supplier', value: 'Supplier' },
                { label: 'Distributor', value: 'Distributor' },
              ]}
              placeholder="Party Type"
            />
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All', value: '' },
                { label: 'Current', value: 'Current' },
                { label: 'Overdue', value: 'Overdue' },
                { label: 'Critical', value: 'Critical' },
              ]}
              placeholder="Status"
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
          </div>
        </FilterBar>
      </div>

      <div className="print:block print:w-full print:bg-white print:border-none">
        <TableCard>
          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No aging balances found."
            />
          </div>
        </TableCard>
      </div>

      <Drawer open={!!selectedParty} onClose={() => setSelectedParty(null)} title="Aging Details">
        {selectedParty && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Party Information</h3>
              <div className="space-y-2">
                <DrawerField label="Party Name" value={<span className="font-semibold text-slate-900">{selectedParty.partyName}</span>} />
                <DrawerField label="Party Type" value={selectedParty.partyType} />
                <DrawerField label="Credit Days" value={`${selectedParty.creditDays} Days`} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Aging Invoice List</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 uppercase text-xs whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Invoice No</th>
                      <th className="px-4 py-3 font-semibold">Invoice Date</th>
                      <th className="px-4 py-3 font-semibold">Due Date</th>
                      <th className="px-4 py-3 font-semibold text-right">Pending Amount</th>
                      <th className="px-4 py-3 font-semibold">Bucket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                    {selectedParty.invoices.map((inv, idx) => {
                      const bal = inv.amount - inv.paidAmount;
                      if (bal <= 0) return null; // Only show outstanding
                      
                      const dDate = new Date(inv.dueDate);
                      const diffDays = Math.floor((today.getTime() - dDate.getTime()) / (1000 * 3600 * 24));
                      let bucketStr = '';
                      if (diffDays <= 30) bucketStr = 'Current (0-30)';
                      else if (diffDays <= 60) bucketStr = '31-60 Days';
                      else if (diffDays <= 90) bucketStr = '61-90 Days';
                      else if (diffDays <= 120) bucketStr = '91-120 Days';
                      else bucketStr = '> 120 Days';

                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-slate-900">{inv.invoiceNo}</td>
                          <td className="px-4 py-3 text-slate-600">{inv.date}</td>
                          <td className="px-4 py-3 text-slate-600">{inv.dueDate}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(bal)}</td>
                          <td className="px-4 py-3 text-slate-600">{bucketStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedParty(null)}>Close</ActionButton>
              <ActionButton 
                variant="primary" 
                onClick={() => handleViewLedger(selectedParty)}
              >
                View Ledger
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
