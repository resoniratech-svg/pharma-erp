import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, Eye, DollarSign, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton,
  TableCard, DataTable, Badge, Drawer, DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// -- Mock Roles & Auth --
import { 
  ROLE_SUPER_ADMIN, 
  ROLE_DISTRIBUTOR, 
  ROLE_WAREHOUSE_MANAGER 
} from '../../constants/roles';

// --- Types ---
interface Invoice {
  invoiceNo: string;
  date: string;
  amount: number;
  dueDate: string;
  agingDays: number;
  status: 'Paid' | 'Unpaid';
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
    usedCredit: 10192,
    availableCredit: 489808,
    totalOutstanding: 10192,
    overdueAmount: 0,
    maxAging: 9,
    status: 'Clear',
    lastPaymentDate: '12-Oct-2026',
    invoices: [
      { invoiceNo: 'INV-2026-1001', date: '15-Oct-2026', amount: 10192, dueDate: '18-Oct-2026', agingDays: 9, status: 'Unpaid' },
      { invoiceNo: 'INV-2026-1002', date: '16-Oct-2026', amount: 5040, dueDate: '19-Oct-2026', agingDays: 8, status: 'Paid' }
    ]
  },
  {
    id: '2',
    distributorName: 'Global Health Supply',
    distributorCode: 'DIST-002',
    contactPerson: 'Anjali Desai',
    mobile: '+91 91234 56789',
    gstin: '07BBBBB2222B2Z2',
    creditLimit: 800000,
    usedCredit: 16800,
    availableCredit: 783200,
    totalOutstanding: 16800,
    overdueAmount: 16800,
    maxAging: 35,
    status: 'Overdue',
    lastPaymentDate: '05-Oct-2026',
    invoices: [
      { invoiceNo: 'INV-2026-1003', date: '10-Oct-2026', amount: 16800, dueDate: '14-Oct-2026', agingDays: 35, status: 'Unpaid' }
    ]
  },
  {
    id: '3',
    distributorName: 'Carewell Agencies',
    distributorCode: 'DIST-003',
    contactPerson: 'Vikram Malhotra',
    mobile: '+91 98111 22233',
    gstin: '29CCCCC3333C3Z3',
    creditLimit: 400000,
    usedCredit: 0,
    availableCredit: 400000,
    totalOutstanding: 0,
    overdueAmount: 0,
    maxAging: 0,
    status: 'Clear',
    lastPaymentDate: '20-Sep-2026',
    invoices: [
      { invoiceNo: 'INV-2026-1004', date: '05-Oct-2026', amount: 12320, dueDate: '08-Oct-2026', agingDays: 20, status: 'Paid' }
    ]
  }
];

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OutstandingTracking() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const loggedInDistributorCode = 'DIST-001';

  // State managed via pipeline synced from orders loop
  const [records, setRecords] = useState<OutstandingRecord[]>(() => {
    const trackingData = localStorage.getItem('pharma_erp_outstanding_records');
    return trackingData ? JSON.parse(trackingData) : initialOutstandingRecords;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Drawers
  const [selectedRecord, setSelectedRecord] = useState<OutstandingRecord | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; recordId: string; invoiceNo: string; amount: number } | null>(null);

  // Load latest pipeline mutations on mount or refresh loops
  useEffect(() => {
    const trackingData = localStorage.getItem('pharma_erp_outstanding_records');
    if (trackingData) {
      setRecords(JSON.parse(trackingData));
    } else {
      localStorage.setItem('pharma_erp_outstanding_records', JSON.stringify(initialOutstandingRecords));
    }
  }, []);

  // Handle outside click context layers for Export Dropdown menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Filtering Framework Pipelines ---
  const visibleRecords = useMemo(() => {
    let base = records;
    if (activeRole === ROLE_DISTRIBUTOR) {
      base = records.filter(r => r.distributorCode === loggedInDistributorCode);
    }
    return base.filter(item => {
      const matchSearch = item.distributorName.toLowerCase().includes(search.toLowerCase()) || 
                          item.distributorCode.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [records, activeRole, search, statusFilter]);

  // --- Aggregated Corporate KPI Stats Metrics ---
  const metrics = useMemo(() => {
    const totalOut = visibleRecords.reduce((sum, r) => sum + r.totalOutstanding, 0);
    const totalOver = visibleRecords.reduce((sum, r) => sum + r.overdueAmount, 0);
    const maximumAging = visibleRecords.length > 0 ? Math.max(...visibleRecords.map(r => r.maxAging)) : 0;
    return { totalOut, totalOver, maximumAging };
  }, [visibleRecords]);

  // --- Action Scripts to process collections / updates ---
  const handleClearInvoicePayment = (recordId: string, invoiceNo: string) => {
    const updatedRecords = records.map(rec => {
      if (rec.id !== recordId) return rec;

      const updatedInvoices = rec.invoices.map(inv => 
        inv.invoiceNo === invoiceNo ? { ...inv, status: 'Paid' as const } : inv
      );

      const activeUnpaids = updatedInvoices.filter(i => i.status === 'Unpaid');
      const updatedOutstanding = activeUnpaids.reduce((sum, i) => sum + i.amount, 0);

      return {
        ...rec,
        totalOutstanding: updatedOutstanding,
        usedCredit: updatedOutstanding,
        availableCredit: Math.max(0, rec.creditLimit - updatedOutstanding),
        overdueAmount: Math.round(updatedOutstanding * 0.10),
        maxAging: activeUnpaids.length > 0 ? Math.max(...activeUnpaids.map(i => i.agingDays)) : 0,
        status: updatedOutstanding > rec.creditLimit ? ('Overdue' as const) : ('Clear' as const),
        lastPaymentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        invoices: updatedInvoices
      };
    });

    setRecords(updatedRecords);
    localStorage.setItem('pharma_erp_outstanding_records', JSON.stringify(updatedRecords));
    
    // Auto-update orders file states mirror matrix
    const savedOrdersRaw = localStorage.getItem('pharma_erp_orders');
    if (savedOrdersRaw) {
      try {
        const parsedOrders = JSON.parse(savedOrdersRaw);
        const matchOrderNo = invoiceNo.replace('INV-', 'ORD-');
        const updatedOrders = parsedOrders.map((o: any) => 
          o.orderNo === matchOrderNo ? { ...o, status: 'Fulfilled' } : o
        );
        localStorage.setItem('pharma_erp_orders', JSON.stringify(updatedOrders));
      } catch (e) {
        console.error("Order fulfillment loop mapping bypass", e);
      }
    }

    setPaymentModal(null);
    setSelectedRecord(null);
  };

  // --- Export Protocols Engine ---
  const handleExportExcel = () => {
    const data = visibleRecords.map(r => ({
      'Code': r.distributorCode,
      'Distributor Name': r.distributorName,
      'Credit Limit': r.creditLimit,
      'Outstanding': r.totalOutstanding,
      'Overdue Value': r.overdueAmount,
      'Max Aging Days': r.maxAging,
      'Status': r.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger Summary');
    XLSX.writeFile(wb, `Outstanding_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Outstanding Balances & Credit Ledger Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 21);

    autoTable(doc, {
      startY: 28,
      head: [['Code', 'Distributor Profile Name', 'Credit Limit', 'Total Outstanding', 'Overdue Amount', 'Max Aging']],
      body: visibleRecords.map(r => [
        r.distributorCode, r.distributorName, formatCurrency(r.creditLimit),
        formatCurrency(r.totalOutstanding), formatCurrency(r.overdueAmount), `${r.maxAging} Days`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }
    });
    doc.save(`Outstanding_Statement.pdf`);
    setShowExportMenu(false);
  };

  // --- Grid Column Models ---
  const columns: Column<OutstandingRecord>[] = [
    { key: 'distributorCode', label: 'Distributor Code', render: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.distributorCode}</span> },
    { key: 'distributorName', label: 'Distributor Name', render: (row) => <span className="font-semibold text-slate-900">{row.distributorName}</span> },
    { key: 'creditLimit', label: 'Credit Limit', render: (row) => <span>{formatCurrency(row.creditLimit)}</span> },
    { key: 'totalOutstanding', label: 'Outstanding Balance', render: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.totalOutstanding)}</span> },
    { key: 'overdueAmount', label: 'Overdue Amount', render: (row) => <span className={`font-medium ${row.overdueAmount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>{formatCurrency(row.overdueAmount)}</span> },
    { key: 'maxAging', label: 'Max Aging', render: (row) => <span className={`font-mono ${row.maxAging > 30 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>{row.maxAging} Days</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant: BadgeVariant = row.status === 'Overdue' ? 'danger' : 'success';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedRecord(row)} className="text-slate-400 hover:text-violet-600 p-1 transition-colors" title="View Statement Ledger">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outstanding & Credit Tracking"
        subtitle="Monitor distributor accounts, outstanding credit limits, collection schedules, and aging invoices."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Outstanding Pipeline</span>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(metrics.totalOut)}</span>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Overdue Bracket</span>
            <span className={`text-2xl font-black ${metrics.totalOver > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(metrics.totalOver)}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Highest Account Peak Aging</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{metrics.maximumAging} Days</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Filter className="w-6 h-6" /></div>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by distributor name or registration code..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Quick Filter:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Clear Accounts', value: 'Clear' },
            { label: 'Overdue Breached', value: 'Overdue' }
          ]}
          placeholder="All Standings"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={visibleRecords}
            emptyMessage="No outstanding account tracking parameters located."
          />
        </div>
      </TableCard>

      {/* --- Detail Statements Account Invoice History Side Drawer --- */}
      <Drawer open={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Account Statement Ledger">
        {selectedRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Distributor Profile Meta</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <DrawerField label="Corporate Name" value={<span className="font-bold text-slate-900">{selectedRecord.distributorName}</span>} />
                <DrawerField label="Account ID" value={<span className="font-mono text-xs">{selectedRecord.distributorCode}</span>} />
                <DrawerField label="Contact Person" value={selectedRecord.contactPerson} />
                <DrawerField label="Mobile Context" value={selectedRecord.mobile} />
                <DrawerField label="Tax Matrix GSTIN" value={selectedRecord.gstin} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Credit Metrics Limits Mapping</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Assigned Credit Limit</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(selectedRecord.creditLimit)}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Available Headroom</span>
                  <span className="text-base font-bold text-emerald-600">{formatCurrency(selectedRecord.availableCredit)}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Utilized Exposure</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(selectedRecord.usedCredit)}</span>
                </div>
                <div className="border border-slate-100 bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-xs text-slate-400 block">Last Allocation Collection</span>
                  <span className="text-sm font-semibold text-slate-600 mt-1 block">{selectedRecord.lastPaymentDate}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Invoiced Ledgers Log</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Invoice Ref</th>
                        <th className="px-3 py-2.5">Net Bill Value</th>
                        <th className="px-3 py-2.5">Aging Track</th>
                        <th className="px-3 py-2.5">Standing</th>
                        {activeRole !== ROLE_DISTRIBUTOR && <th className="px-3 py-2.5 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedRecord.invoices.map((inv, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3 font-mono font-medium">
                            {inv.invoiceNo}
                            <div className="text-[10px] text-slate-400 font-normal">{inv.date}</div>
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-900">{formatCurrency(inv.amount)}</td>
                          <td className="px-3 py-3 font-mono text-slate-500">{inv.status === 'Paid' ? '-' : `${inv.agingDays} Days`}</td>
                          <td className="px-3 py-3">
                            <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>{inv.status}</Badge>
                          </td>
                          {activeRole !== ROLE_DISTRIBUTOR && (
                            <td className="px-3 py-3 text-center">
                              {inv.status === 'Unpaid' ? (
                                <button
                                  onClick={() => setPaymentModal({ open: true, recordId: selectedRecord.id, invoiceNo: inv.invoiceNo, amount: inv.amount })}
                                  className="text-emerald-600 hover:text-emerald-800 p-1 font-semibold flex items-center gap-0.5 mx-auto transition-colors"
                                  title="Log Payment Collection Receive"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Pay
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Settled</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedRecord(null)}>Close Statement</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* --- Collection Entry Prompt Window Modal --- */}
      {paymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-base font-bold text-slate-900 mb-1">Record Inward Collection Settlement</h4>
            <p className="text-xs text-slate-500 mb-4">You are confirming full receipt parameters against balance invoice sheet item <span className="font-mono font-bold text-slate-800">{paymentModal.invoiceNo}</span>.</p>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-5 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Receipt Net Value:</span>
              <span className="text-base font-black text-slate-900">{formatCurrency(paymentModal.amount)}</span>
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button 
                onClick={() => setPaymentModal(null)} 
                className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleClearInvoicePayment(paymentModal.recordId, paymentModal.invoiceNo)} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors"
              >
                Approve Payment Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}