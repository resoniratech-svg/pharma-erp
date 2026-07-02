import { useState, useRef, useEffect } from 'react';
import { IndianRupee, AlertCircle, Clock, Percent, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';

interface PendingPayment {
  id: string;
  customerCode: string;
  customerName: string;
  partyType: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  outstandingAmount: string;
  daysOverdue: number;
  branch: string;
  status: 'Due Soon' | 'Overdue' | 'Critical' | 'Paid';
}

const mockData: PendingPayment[] = [
  { id: '1', customerCode: 'CUS-1001', customerName: 'Global Health Agencies', partyType: 'Distributor', invoiceNo: 'INV/25/105', invoiceDate: '2025-10-01', dueDate: '2025-11-01', outstandingAmount: '₹ 4,50,000', daysOverdue: 45, branch: 'Mumbai Central', status: 'Critical' },
  { id: '2', customerCode: 'CUS-1022', customerName: 'Apollo Pharmacy', partyType: 'Retailer', invoiceNo: 'INV/25/112', invoiceDate: '2025-11-15', dueDate: '2025-12-15', outstandingAmount: '₹ 1,25,000', daysOverdue: 15, branch: 'Pune East', status: 'Overdue' },
  { id: '3', customerCode: 'CUS-1045', customerName: 'Metro Distributors', partyType: 'Distributor', invoiceNo: 'INV/25/120', invoiceDate: '2025-12-25', dueDate: '2026-01-25', outstandingAmount: '₹ 8,20,000', daysOverdue: 2, branch: 'Delhi North', status: 'Due Soon' },
  { id: '4', customerCode: 'CUS-1088', customerName: 'LifeCare Hospitals', partyType: 'Hospital', invoiceNo: 'INV/25/133', invoiceDate: '2025-09-10', dueDate: '2025-10-10', outstandingAmount: '₹ 12,50,000', daysOverdue: 65, branch: 'Chennai South', status: 'Critical' },
  { id: '5', customerCode: 'CUS-1102', customerName: 'City Medicos', partyType: 'Retailer', invoiceNo: 'INV/25/145', invoiceDate: '2025-12-01', dueDate: '2025-12-31', outstandingAmount: '₹ 0', daysOverdue: 0, branch: 'Mumbai Central', status: 'Paid' },
];

export default function PendingPaymentTracking() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [partyType, setPartyType] = useState('');
  const [status, setStatus] = useState('');
  const [branch, setBranch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns: Column<PendingPayment>[] = [
    { key: 'customerCode', label: 'Customer Code', render: (row) => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.customerCode}</span> },
    { key: 'customerName', label: 'Customer Name', render: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span> },
    { key: 'partyType', label: 'Party Type', render: (row) => <span className="text-slate-600">{row.partyType}</span> },
    { key: 'invoiceNo', label: 'Invoice No' },
    { key: 'invoiceDate', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{new Date(row.invoiceDate).toLocaleDateString()}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className="text-slate-600 font-medium">{new Date(row.dueDate).toLocaleDateString()}</span> },
    { key: 'outstandingAmount', label: 'Outstanding Amount', render: (row) => <span className="font-bold text-rose-600">{row.outstandingAmount}</span> },
    { key: 'daysOverdue', label: 'Days Overdue', render: (row) => <span className="text-slate-700">{row.daysOverdue > 0 ? `${row.daysOverdue} days` : '-'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (row.status === 'Paid') variant = 'success';
        if (row.status === 'Due Soon') variant = 'info';
        if (row.status === 'Overdue') variant = 'warning';
        if (row.status === 'Critical') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: () => (
        <ActionButton variant="ghost">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">View</span>
        </ActionButton>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    let match = true;
    if (search) match = match && item.customerName.toLowerCase().includes(search.toLowerCase());
    if (partyType) match = match && item.partyType === partyType;
    if (status) match = match && item.status === status;
    if (branch) match = match && item.branch === branch;
    
    if (fromDate) match = match && new Date(item.dueDate) >= new Date(fromDate);
    if (toDate) match = match && new Date(item.dueDate) <= new Date(toDate);

    return match;
  });

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      partyType && `Party Type: ${partyType}`,
      status && `Status: ${status}`,
      branch && `Branch: ${branch}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['Pending Payment Tracking Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Customer Code', 'Customer Name', 'Party Type', 'Invoice No', 'Invoice Date', 'Due Date', 'Outstanding Amount', 'Days Overdue', 'Status'];
    const tableRows = filteredData.map(row => [
      row.customerCode,
      row.customerName,
      row.partyType,
      row.invoiceNo,
      row.invoiceDate,
      row.dueDate,
      row.outstandingAmount,
      row.daysOverdue.toString(),
      row.status
    ]);

    return { headerRows, tableHeaders, tableRows };
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }
    
    const { headerRows, tableHeaders, tableRows } = getExportData();
    const csvContent = [
      ...headerRows.map(row => `"${row.join('","')}"`),
      `"${tableHeaders.join('","')}"`,
      ...tableRows.map(row => `"${row.join('","')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = URL.createObjectURL(blob);
    link.download = `Pending_Payment_Report_${dateStr}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }

    const { headerRows, tableHeaders, tableRows } = getExportData();
    const wsData = [
      ...headerRows,
      tableHeaders,
      ...tableRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pending Payments");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Pending_Payment_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Pending Payment Tracking"
        subtitle="Monitor outstanding receivables and collection efficiency."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Pending Payments' }]}
        actions={
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel (.xlsx)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Total Outstanding Receivables" value="₹ 4.2 Cr" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Overdue Amount" value="₹ 1.8 Cr" icon={<Clock className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Critical Outstanding Cases" value="24" icon={<AlertCircle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <SummaryCard title="Collection Efficiency %" value="82.4%" icon={<Percent className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customer name..." />
          <SelectFilter
            value={partyType} onChange={setPartyType}
            options={[
              { label: 'Distributor', value: 'Distributor' },
              { label: 'Retailer', value: 'Retailer' },
              { label: 'Hospital', value: 'Hospital' },
              { label: 'Institution', value: 'Institution' },
            ]}
            placeholder="Party Type"
          />
          <SelectFilter
            value={status} onChange={setStatus}
            options={[
              { label: 'Due Soon', value: 'Due Soon' },
              { label: 'Overdue', value: 'Overdue' },
              { label: 'Critical', value: 'Critical' },
              { label: 'Paid', value: 'Paid' },
            ]}
            placeholder="Status"
          />
          <SelectFilter
            value={branch} onChange={setBranch}
            options={[
              { label: 'Mumbai Central', value: 'Mumbai Central' },
              { label: 'Delhi North', value: 'Delhi North' },
              { label: 'Pune East', value: 'Pune East' },
              { label: 'Chennai South', value: 'Chennai South' },
            ]}
            placeholder="Branch"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TableCard>
          <div className="pending-payment-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .pending-payment-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pending-payment-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
