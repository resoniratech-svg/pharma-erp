import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, AlertTriangle, Eye, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader, FilterBar, SearchInput, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

import { 
  ROLE_SUPER_ADMIN, 
  ROLE_DISTRIBUTOR 
} from '../../constants/roles';

// --- Types ---
type Status = 'Clear' | 'Warning' | 'Critical' | 'Blocked';

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  paidAmount: number;
  balanceAmount: number;
  aging: number;
  status: Status;
  lastPaymentDate: string;
}

interface DistributorRecord {
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
  status: Status;
  lastPaymentDate: string;
  invoices: Invoice[];
}

// --- Mock Data ---
const mockData: DistributorRecord[] = [
  {
    id: '1', distributorName: 'Carewell Agencies', distributorCode: 'DIST-003', contactPerson: 'Ramesh Sharma', mobile: '+91 9876543210', gstin: '27AADCA2230F1Z5',
    creditLimit: 1000000, usedCredit: 845000, availableCredit: 155000, totalOutstanding: 845000, overdueAmount: 420000, maxAging: 75, status: 'Critical', lastPaymentDate: '10-Sep-2026',
    invoices: [
      { id: 'INV-2026-0801', invoiceNo: 'INV-2026-0801', invoiceDate: '01-Aug-2026', dueDate: '31-Aug-2026', invoiceAmount: 500000, paidAmount: 80000, balanceAmount: 420000, aging: 75, status: 'Critical', lastPaymentDate: '10-Sep-2026' },
      { id: 'INV-2026-0915', invoiceNo: 'INV-2026-0915', invoiceDate: '15-Sep-2026', dueDate: '15-Oct-2026', invoiceAmount: 425000, paidAmount: 0, balanceAmount: 425000, aging: 0, status: 'Clear', lastPaymentDate: '-' },
    ]
  },
  {
    id: '2', distributorName: 'Metro Pharma Distributors', distributorCode: 'DIST-001', contactPerson: 'Vikram Singh', mobile: '+91 9988776655', gstin: '27AABCM1234E1Z2',
    creditLimit: 500000, usedCredit: 210000, availableCredit: 290000, totalOutstanding: 210000, overdueAmount: 50000, maxAging: 40, status: 'Warning', lastPaymentDate: '25-Sep-2026',
    invoices: [
      { id: 'INV-2026-0810', invoiceNo: 'INV-2026-0810', invoiceDate: '10-Aug-2026', dueDate: '10-Sep-2026', invoiceAmount: 150000, paidAmount: 100000, balanceAmount: 50000, aging: 40, status: 'Warning', lastPaymentDate: '25-Sep-2026' },
      { id: 'INV-2026-0925', invoiceNo: 'INV-2026-0925', invoiceDate: '25-Sep-2026', dueDate: '25-Oct-2026', invoiceAmount: 160000, paidAmount: 0, balanceAmount: 160000, aging: 0, status: 'Clear', lastPaymentDate: '-' },
    ]
  },
  {
    id: '3', distributorName: 'Global Health Supply', distributorCode: 'DIST-002', contactPerson: 'Amit Patel', mobile: '+91 9123456789', gstin: '24AAACG3344D1Z8',
    creditLimit: 800000, usedCredit: 55000, availableCredit: 745000, totalOutstanding: 55000, overdueAmount: 0, maxAging: 15, status: 'Clear', lastPaymentDate: '05-Oct-2026',
    invoices: [
      { id: 'INV-2026-1005', invoiceNo: 'INV-2026-1005', invoiceDate: '05-Oct-2026', dueDate: '04-Nov-2026', invoiceAmount: 100000, paidAmount: 45000, balanceAmount: 55000, aging: 15, status: 'Clear', lastPaymentDate: '05-Oct-2026' },
    ]
  },
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OutstandingTracking() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  // Assume logged in distributor details
  const loggedInDistributorCode = 'DIST-001'; 

  const [search, setSearch] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // View state
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Logic based on Role
  const filteredData = useMemo(() => {
    if (activeRole === ROLE_DISTRIBUTOR) {
      const myData = mockData.find(d => d.distributorCode === loggedInDistributorCode);
      if (!myData) return [];
      return myData.invoices.filter(inv => 
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      return mockData.filter(d => 
        d.distributorName.toLowerCase().includes(search.toLowerCase())
      );
    }
  }, [activeRole, search]);

  // Status Badge Helper
  const getStatusVariant = (status: Status): BadgeVariant => {
    if (status === 'Clear') return 'success';
    if (status === 'Warning') return 'warning';
    if (status === 'Critical' || status === 'Blocked') return 'danger';
    return 'neutral';
  };

  // Admin Table Columns
  const adminColumns: Column<DistributorRecord>[] = [
    { key: 'distributorName', label: 'Distributor', render: (row) => <span className="font-semibold text-slate-900">{row.distributorName}</span> },
    { key: 'totalOutstanding', label: 'Outstanding Amount', render: (row) => <span className="font-medium text-slate-800">{formatCurrency(row.totalOutstanding)}</span> },
    { key: 'overdueAmount', label: 'Overdue Amount', render: (row) => <span className={row.overdueAmount > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>{formatCurrency(row.overdueAmount)}</span> },
    { key: 'maxAging', label: 'Aging', render: (row) => `${row.maxAging} Days` },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedDistributor(row); }} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  // Distributor Table Columns
  const distColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'balanceAmount', label: 'Outstanding Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.balanceAmount)}</span> },
    { key: 'aging', label: 'Aging', render: (row) => `${row.aging} Days` },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row); }} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  // Export Logic
  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    let exportData: any[] = [];
    if (activeRole === ROLE_DISTRIBUTOR) {
      exportData = (filteredData as Invoice[]).map(row => ({
        'Invoice No': row.invoiceNo,
        'Invoice Date': row.invoiceDate,
        'Due Date': row.dueDate,
        'Outstanding Amount': row.balanceAmount,
        'Aging (Days)': row.aging,
        'Status': row.status
      }));
    } else {
      exportData = (filteredData as DistributorRecord[]).map(row => ({
        'Distributor': row.distributorName,
        'Outstanding Amount': row.totalOutstanding,
        'Overdue Amount': row.overdueAmount,
        'Aging (Days)': row.maxAging,
        'Status': row.status
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aging Report');
    XLSX.writeFile(workbook, `aging_report_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    let csvContent = '';
    if (activeRole === ROLE_DISTRIBUTOR) {
      const headers = ['Invoice No', 'Invoice Date', 'Due Date', 'Outstanding Amount', 'Aging (Days)', 'Status'];
      csvContent = [
        headers.join(','),
        ...(filteredData as Invoice[]).map(row => 
          [`"${row.invoiceNo}"`, `"${row.invoiceDate}"`, `"${row.dueDate}"`, row.balanceAmount, row.aging, `"${row.status}"`].join(',')
        )
      ].join('\n');
    } else {
      const headers = ['Distributor', 'Outstanding Amount', 'Overdue Amount', 'Aging (Days)', 'Status'];
      csvContent = [
        headers.join(','),
        ...(filteredData as DistributorRecord[]).map(row => 
          [`"${row.distributorName}"`, row.totalOutstanding, row.overdueAmount, row.maxAging, `"${row.status}"`].join(',')
        )
      ].join('\n');
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aging_report_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Outstanding & Aging Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    if (activeRole === ROLE_DISTRIBUTOR) {
      autoTable(doc, {
        startY: 30,
        head: [['Invoice No', 'Date', 'Due Date', 'Outstanding Amount', 'Aging', 'Status']],
        body: (filteredData as Invoice[]).map(row => [
          row.invoiceNo, row.invoiceDate, row.dueDate, formatCurrency(row.balanceAmount), `${row.aging} Days`, row.status
        ]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] }
      });
    } else {
      autoTable(doc, {
        startY: 30,
        head: [['Distributor', 'Outstanding Amount', 'Overdue Amount', 'Aging', 'Status']],
        body: (filteredData as DistributorRecord[]).map(row => [
          row.distributorName, formatCurrency(row.totalOutstanding), formatCurrency(row.overdueAmount), `${row.maxAging} Days`, row.status
        ]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] }
      });
    }

    doc.save(`aging_report_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outstanding Tracking"
        subtitle={activeRole === ROLE_DISTRIBUTOR ? "Track your outstanding invoices, payments, and aging status." : "Track distributor payments, aging reports, and credit limits."}
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Report
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

      {activeRole === ROLE_SUPER_ADMIN && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Payment Collection Alert</h3>
            <p className="text-sm text-amber-700 mt-1">
              {formatCurrency(mockData.reduce((acc, curr) => acc + curr.overdueAmount, 0))} is currently overdue across all distributors.
            </p>
          </div>
        </div>
      )}

      <FilterBar>
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder={activeRole === ROLE_DISTRIBUTOR ? "Search by Invoice No..." : "Search by Distributor Name..."} 
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={activeRole === ROLE_DISTRIBUTOR ? distColumns as any : adminColumns as any}
            data={filteredData as any}
            emptyMessage="No outstanding records found."
          />
        </div>
      </TableCard>

      {/* --- Super Admin View Drawer --- */}
      <Drawer open={!!selectedDistributor} onClose={() => setSelectedDistributor(null)} title="Distributor Outstanding Profile">
        {selectedDistributor && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Distributor Information</h3>
              <div className="space-y-2">
                <DrawerField label="Distributor Name" value={<span className="font-semibold text-slate-900">{selectedDistributor.distributorName}</span>} />
                <DrawerField label="Distributor Code" value={selectedDistributor.distributorCode} />
                <DrawerField label="Contact Person" value={selectedDistributor.contactPerson} />
                <DrawerField label="Mobile" value={selectedDistributor.mobile} />
                <DrawerField label="GSTIN" value={selectedDistributor.gstin} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Credit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Credit Limit" value={<span className="font-semibold">{formatCurrency(selectedDistributor.creditLimit)}</span>} />
                <DrawerField label="Used Credit" value={formatCurrency(selectedDistributor.usedCredit)} />
                <DrawerField label="Available Credit" value={<span className="text-emerald-600 font-semibold">{formatCurrency(selectedDistributor.availableCredit)}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Outstanding Summary</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total Outstanding</span>
                  <span className="font-medium text-slate-900">{formatCurrency(selectedDistributor.totalOutstanding)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Overdue Amount</span>
                  <span className={selectedDistributor.overdueAmount > 0 ? "font-bold text-rose-600" : "font-medium"}>{formatCurrency(selectedDistributor.overdueAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Oldest Aging</span>
                  <span className="font-medium">{selectedDistributor.maxAging} Days</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-slate-200 mt-2">
                  <span>Last Payment Date</span>
                  <span className="font-medium">{selectedDistributor.lastPaymentDate}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoice Breakdown</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 uppercase text-xs whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Invoice No</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Due Date</th>
                      <th className="px-4 py-3 font-semibold text-right">Inv Amount</th>
                      <th className="px-4 py-3 font-semibold text-right">Paid</th>
                      <th className="px-4 py-3 font-semibold text-right">Balance</th>
                      <th className="px-4 py-3 font-semibold text-center">Aging</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                    {selectedDistributor.invoices.map((inv, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-slate-900">{inv.invoiceNo}</td>
                        <td className="px-4 py-3 text-slate-600">{inv.invoiceDate}</td>
                        <td className="px-4 py-3 text-slate-600">{inv.dueDate}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.invoiceAmount)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.paidAmount)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(inv.balanceAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={inv.aging > 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>{inv.aging} Days</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedDistributor(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* --- Distributor View Drawer --- */}
      <Drawer open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Outstanding Details">
        {selectedInvoice && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="space-y-2">
                <DrawerField label="Invoice No" value={<span className="font-semibold text-slate-900">{selectedInvoice.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={selectedInvoice.invoiceDate} />
                <DrawerField label="Due Date" value={selectedInvoice.dueDate} />
                <DrawerField label="Invoice Amount" value={<span className="font-semibold">{formatCurrency(selectedInvoice.invoiceAmount)}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="space-y-2">
                <DrawerField label="Paid Amount" value={<span className="text-emerald-600 font-semibold">{formatCurrency(selectedInvoice.paidAmount)}</span>} />
                <DrawerField label="Outstanding Amount" value={<span className="font-bold text-rose-600">{formatCurrency(selectedInvoice.balanceAmount)}</span>} />
                <DrawerField label="Aging" value={`${selectedInvoice.aging} Days`} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status Information</h3>
              <div className="space-y-2">
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(selectedInvoice.status)}>{selectedInvoice.status}</Badge>} />
                <DrawerField label="Last Payment Date" value={selectedInvoice.lastPaymentDate} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
