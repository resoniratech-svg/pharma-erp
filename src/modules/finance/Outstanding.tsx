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
type Status = 'Current' | 'Partially Paid' | 'Overdue' | 'Critical Overdue';

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

// --- Computed Types (Table Row) ---
interface ComputedOutstandingRow extends PartyRecord {
  pendingBills: number;
  outstandingAmount: number;
  overdueAmount: number;
  oldestDueDate: string;
  status: Status;
}

// --- Helpers ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusVariant = (status: Status): BadgeVariant => {
  if (status === 'Current') return 'success';
  if (status === 'Partially Paid') return 'warning';
  if (status === 'Overdue') return 'danger';
  if (status === 'Critical Overdue') return 'danger';
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
      { id: 'INV-001', invoiceNo: 'INV/26/001', date: '2026-09-01', dueDate: '2026-10-01', amount: 50400, paidAmount: 0 },
      { id: 'INV-002', invoiceNo: 'INV/26/045', date: '2026-10-25', dueDate: '2026-11-24', amount: 12000, paidAmount: 5000 },
    ]
  },
  {
    id: 'sun',
    partyName: 'Sun Pharma',
    partyType: 'Supplier',
    creditDays: 60,
    lastPaymentDate: '2026-09-10',
    invoices: [
      { id: 'PUR-001', invoiceNo: 'PUR/26/001', date: '2026-08-01', dueDate: '2026-09-30', amount: 150000, paidAmount: 100000 },
      { id: 'PUR-002', invoiceNo: 'PUR/26/089', date: '2026-09-05', dueDate: '2026-11-04', amount: 350000, paidAmount: 0 },
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
    id: 'global',
    partyName: 'Global Health',
    partyType: 'Customer',
    creditDays: 15,
    lastPaymentDate: '-',
    invoices: [
      { id: 'INV-088', invoiceNo: 'INV/26/088', date: '2026-08-10', dueDate: '2026-08-25', amount: 85000, paidAmount: 0 },
    ]
  }
];

export default function Outstanding() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedParty, setSelectedParty] = useState<ComputedOutstandingRow | null>(null);

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
  
  const computedData: ComputedOutstandingRow[] = useMemo(() => {
    return mockData.map(party => {
      let outstandingAmount = 0;
      let overdueAmount = 0;
      let pendingBills = 0;
      let oldestDate: Date | null = null;
      let hasPartial = false;

      party.invoices.forEach(inv => {
        const balance = inv.amount - inv.paidAmount;
        if (balance > 0) {
          pendingBills++;
          outstandingAmount += balance;
          if (inv.paidAmount > 0) hasPartial = true;

          const dDate = new Date(inv.dueDate);
          if (dDate < today) {
            overdueAmount += balance;
          }

          if (!oldestDate || dDate < oldestDate) {
            oldestDate = dDate;
          }
        }
      });

      let status: Status = 'Current';
      if (overdueAmount > 0) {
        // Simple critical threshold logic: if oldest due date is > 60 days past due
        if (oldestDate && (today.getTime() - (oldestDate as Date).getTime()) / (1000 * 3600 * 24) > 60) {
          status = 'Critical Overdue';
        } else {
          status = 'Overdue';
        }
      } else if (hasPartial && outstandingAmount > 0) {
        status = 'Partially Paid';
      }

      return {
        ...party,
        pendingBills,
        outstandingAmount,
        overdueAmount,
        oldestDueDate: oldestDate ? (oldestDate as Date).toISOString().split('T')[0] : '-',
        status
      };
    });
  }, [today]);

  // --- Filtering ---
  const filteredData = useMemo(() => {
    return computedData.filter(row => {
      // Must have outstanding balance to be on this screen generally, but we'll show all from mock
      // 1. Party Name Search
      if (search && !row.partyName.toLowerCase().includes(search.toLowerCase())) return false;
      
      // 2. Party Type
      if (partyTypeFilter && row.partyType !== partyTypeFilter) return false;

      // 3. Status
      if (statusFilter && row.status !== statusFilter) return false;

      // 4. Date Range (filtering by Oldest Due Date)
      if (fromDate || toDate) {
        if (row.oldestDueDate === '-') return false;
        const d = new Date(row.oldestDueDate);
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
      }

      return true;
    });
  }, [computedData, search, partyTypeFilter, statusFilter, fromDate, toDate]);

  // --- KPI Aggregations ---
  const { totalReceivables, totalPayables } = useMemo(() => {
    let rec = 0;
    let pay = 0;
    filteredData.forEach(row => {
      if (row.partyType === 'Customer' || row.partyType === 'Distributor') {
        rec += row.outstandingAmount;
      } else if (row.partyType === 'Supplier' || row.partyType === 'Vendor') {
        pay += row.outstandingAmount;
      }
    });
    return { totalReceivables: rec, totalPayables: pay };
  }, [filteredData]);

  // --- Exports ---
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(row => ({
      'Party Name': row.partyName,
      'Party Type': row.partyType,
      'Pending Bills': row.pendingBills,
      'Outstanding Amount': row.outstandingAmount,
      'Overdue Amount': row.overdueAmount,
      'Last Payment Date': row.lastPaymentDate,
      'Oldest Due Date': row.oldestDueDate,
      'Credit Days': row.creditDays,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Outstanding');
    XLSX.writeFile(workbook, `Outstanding_Report_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Outstanding Tracking Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 22);

    const pdfTableData = filteredData.map(row => [
      row.partyName,
      row.partyType,
      row.pendingBills.toString(),
      formatCurrency(row.outstandingAmount),
      formatCurrency(row.overdueAmount),
      row.lastPaymentDate,
      row.oldestDueDate,
      row.status
    ]);

    (doc as any).autoTable({
      head: [['Party Name', 'Party Type', 'Pending Bills', 'Outstanding', 'Overdue', 'Last Payment', 'Oldest Due', 'Status']],
      body: pdfTableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [80, 80, 80] }
    });

    doc.save(`Outstanding_Report_${getFormattedDate()}.pdf`);
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
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.pendingBills}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; color: #000;">${formatCurrency(row.outstandingAmount)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; color: #000;">${formatCurrency(row.overdueAmount)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.lastPaymentDate}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.oldestDueDate}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.creditDays}</td>
          <td style="padding: 8px; border-bottom: 1px solid #000; color: #000;">${row.status}</td>
        </tr>
      `).join('');

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Outstanding Tracking Report</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0;
                color: #000; 
                background: #fff;
                font-size: 10px;
              }
              .header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header h1 { font-size: 18px; margin: 0 0 5px 0; color: #000; }
              .header p { margin: 0 0 3px 0; font-size: 11px; color: #000; }
              .summary { display: flex; gap: 40px; margin-bottom: 20px; }
              .summary div { border: 1px solid #000; padding: 10px; flex: 1; }
              .summary p.label { font-size: 11px; margin: 0 0 5px 0; font-weight: bold; }
              .summary p.val { font-size: 16px; margin: 0; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
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
              <h1>Outstanding Tracking Report</h1>
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
                  <th>Party Name</th>
                  <th>Type</th>
                  <th>Bills</th>
                  <th>Outstanding</th>
                  <th>Overdue</th>
                  <th>Last Payment</th>
                  <th>Oldest Due</th>
                  <th>Cr. Days</th>
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

  const handleViewLedger = (party: ComputedOutstandingRow) => {
    try {
      navigate('/workspace/finance/ledger', { 
        state: { partyId: party.id, partyName: party.partyName, partyType: party.partyType } 
      });
    } catch (error) {
      alert("Party Ledger screen is currently unavailable.");
    }
  };

  // --- Columns ---
  const columns: Column<ComputedOutstandingRow>[] = [
    { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span> },
    { key: 'partyType', label: 'Party Type', render: (row) => <span className="text-slate-600">{row.partyType}</span> },
    { key: 'pendingBills', label: 'Pending Bills', render: (row) => <span className="text-slate-600">{row.pendingBills}</span> },
    { key: 'outstandingAmount', label: 'Outstanding Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.outstandingAmount)}</span> },
    { key: 'overdueAmount', label: 'Overdue Amount', render: (row) => <span className={row.overdueAmount > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>{formatCurrency(row.overdueAmount)}</span> },
    { key: 'lastPaymentDate', label: 'Last Payment Date', render: (row) => <span className="text-slate-600">{row.lastPaymentDate}</span> },
    { key: 'oldestDueDate', label: 'Oldest Due Date', render: (row) => <span className="text-slate-600">{row.oldestDueDate}</span> },
    { key: 'creditDays', label: 'Credit Days', render: (row) => <span className="text-slate-600">{row.creditDays}</span> },
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
          title="Outstanding Tracking"
          subtitle="Track accounts receivable and accounts payable."
          actions={
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export Report
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between">
              <div>
                  <p className="text-emerald-700 font-medium mb-1">Total Receivables</p>
                  <h3 className="text-3xl font-bold text-emerald-900">{formatCurrency(totalReceivables)}</h3>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                  <IndianRupee className="w-6 h-6" />
              </div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-center justify-between">
              <div>
                  <p className="text-rose-700 font-medium mb-1">Total Payables</p>
                  <h3 className="text-3xl font-bold text-rose-900">{formatCurrency(totalPayables)}</h3>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-600 shadow-sm">
                  <IndianRupee className="w-6 h-6" />
              </div>
          </div>
        </div>

        <FilterBar>
          <div className="flex flex-wrap items-center gap-3 w-full">
            <SearchInput value={search} onChange={setSearch} placeholder="Search Party Name..." />
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <SelectFilter
              value={partyTypeFilter}
              onChange={setPartyTypeFilter}
              options={[
                { label: 'All Party Types', value: '' },
                { label: 'Customer', value: 'Customer' },
                { label: 'Supplier', value: 'Supplier' },
                { label: 'Distributor', value: 'Distributor' },
                { label: 'Vendor', value: 'Vendor' },
              ]}
              placeholder="Party Type"
            />
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Current', value: 'Current' },
                { label: 'Partially Paid', value: 'Partially Paid' },
                { label: 'Overdue', value: 'Overdue' },
                { label: 'Critical Overdue', value: 'Critical Overdue' },
              ]}
              placeholder="Status"
            />
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
              <span className="text-sm text-slate-500">Due From</span>
              <input 
                type="date" 
                className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-[110px]"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
              <span className="text-sm text-slate-500">Due To</span>
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
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Outstanding Tracking Report</h1>
          <p className="text-slate-600">Generated On: {new Date().toLocaleString()}</p>
          <div className="mt-4 flex gap-8">
            <p><strong>Total Receivables:</strong> {formatCurrency(totalReceivables)}</p>
            <p><strong>Total Payables:</strong> {formatCurrency(totalPayables)}</p>
          </div>
        </div>

        <TableCard>
          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No outstanding balances found."
            />
          </div>
        </TableCard>
      </div>

      <Drawer open={!!selectedParty} onClose={() => setSelectedParty(null)} title="Outstanding Details">
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Outstanding Summary</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Outstanding Amount</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedParty.outstandingAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Overdue Amount</span>
                  <span className={selectedParty.overdueAmount > 0 ? "font-bold text-rose-600" : "font-medium"}>{formatCurrency(selectedParty.overdueAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-slate-200 mt-2">
                  <span>Pending Bills</span>
                  <span className="font-medium">{selectedParty.pendingBills}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Oldest Due Date</span>
                  <span className="font-medium">{selectedParty.oldestDueDate}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Last Payment Date</span>
                  <span className="font-medium">{selectedParty.lastPaymentDate}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoice-wise Outstanding List</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 uppercase text-xs whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Invoice No</th>
                      <th className="px-4 py-3 font-semibold">Due Date</th>
                      <th className="px-4 py-3 font-semibold text-right">Amount</th>
                      <th className="px-4 py-3 font-semibold text-right">Paid</th>
                      <th className="px-4 py-3 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                    {selectedParty.invoices.map((inv, idx) => {
                      const bal = inv.amount - inv.paidAmount;
                      if (bal <= 0) return null; // Only show outstanding
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-slate-900">{inv.invoiceNo}</td>
                          <td className="px-4 py-3 text-slate-600">{inv.dueDate}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.amount)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.paidAmount)}</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-600">{formatCurrency(bal)}</td>
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


