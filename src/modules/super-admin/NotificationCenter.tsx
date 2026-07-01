import { useState, useRef, useEffect } from 'react';
import { BellRing, AlertTriangle, AlertCircle, Info, Eye, Check, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';

interface AppNotification {
  id: string;
  dateTime: string;
  module: string;
  notificationType: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Info';
  status: 'Unread' | 'Read' | 'Archived';
}

const initialMockData: AppNotification[] = [
  { id: '1', dateTime: '2026-11-02T10:15:00', module: 'Inventory Module', notificationType: 'Stock Alert', message: 'Paracetamol 500mg batch expiring in 30 days', severity: 'Warning', status: 'Unread' },
  { id: '2', dateTime: '2026-11-02T09:30:00', module: 'Finance Module', notificationType: 'Payment Failed', message: 'Auto-debit for License renewal failed', severity: 'Critical', status: 'Unread' },
  { id: '3', dateTime: '2026-11-01T16:45:00', module: 'Dispatch Module', notificationType: 'Shipment Delayed', message: 'Order ORD-5501 delayed due to transport strike', severity: 'Warning', status: 'Read' },
  { id: '4', dateTime: '2026-11-01T11:20:00', module: 'System Module', notificationType: 'System Update', message: 'ERP version 2.4.1 deployed successfully', severity: 'Info', status: 'Read' },
  { id: '5', dateTime: '2026-10-28T14:00:00', module: 'Sales Module', notificationType: 'Order Approved', message: 'Bulk order ORD-5490 approved by Regional Head', severity: 'Info', status: 'Archived' },
];

export default function NotificationCenter() {
  const [data, setData] = useState<AppNotification[]>(initialMockData);
  const [search, setSearch] = useState('');
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const markAsRead = (id: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Read' } : item));
  };

  const columns: Column<AppNotification>[] = [
    { key: 'dateTime', label: 'Date & Time', render: (row) => <span className="text-sm text-slate-500">{new Date(row.dateTime).toLocaleString()}</span> },
    { key: 'module', label: 'Module', render: (row) => <Badge variant="neutral">{row.module}</Badge> },
    { key: 'notificationType', label: 'Notification Type', render: (row) => <span className="font-medium text-slate-700">{row.notificationType}</span> },
    { key: 'message', label: 'Message', render: (row) => <span className={`text-slate-900 ${row.status === 'Unread' ? 'font-semibold' : ''}`}>{row.message}</span> },
    {
      key: 'severity',
      label: 'Severity',
      render: (row) => {
        const variant = row.severity === 'Critical' ? 'danger' : row.severity === 'Warning' ? 'warning' : 'info';
        return <Badge variant={variant}>{row.severity}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Unread' ? 'info' : row.status === 'Read' ? 'success' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          <ActionButton variant="ghost">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">View</span>
          </ActionButton>
          {row.status === 'Unread' && (
            <ActionButton variant="ghost" onClick={() => markAsRead(row.id)}>
              <Check className="w-4 h-4 text-violet-600" />
              <span className="text-violet-600">Mark Read</span>
            </ActionButton>
          )}
        </div>
      )
    }
  ];

  const filteredData = data.filter((item) => {
    let match = true;
    if (search) {
      match = match && (
        item.message.toLowerCase().includes(search.toLowerCase()) ||
        item.notificationType.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (severityFilter) match = match && item.severity === severityFilter;
    if (moduleFilter) match = match && item.module === moduleFilter;
    if (statusFilter) match = match && item.status === statusFilter;
    
    if (fromDate) match = match && new Date(item.dateTime) >= new Date(fromDate);
    // Add 1 day to toDate to include the entire day
    if (toDate) {
      const end = new Date(toDate);
      end.setDate(end.getDate() + 1);
      match = match && new Date(item.dateTime) < end;
    }

    return match;
  });

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      severityFilter && `Severity: ${severityFilter}`,
      moduleFilter && `Module: ${moduleFilter}`,
      statusFilter && `Status: ${statusFilter}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['Notification Center Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Date & Time', 'Module', 'Notification Type', 'Message', 'Severity', 'Status'];
    const tableRows = filteredData.map(row => [
      new Date(row.dateTime).toLocaleString(),
      row.module,
      row.notificationType,
      row.message,
      row.severity,
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
    link.download = `Notification_Center_Report_${dateStr}.csv`;
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
    XLSX.utils.book_append_sheet(wb, ws, "Notifications");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Notification_Center_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Notification Center"
        subtitle="Global alerts and critical system messages."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Notification Center' }]}
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
        <SummaryCard title="Critical Alerts" value="1" icon={<AlertTriangle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <SummaryCard title="Warnings" value="5" icon={<AlertCircle className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Unread Notifications" value="2" icon={<BellRing className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Today's Alerts" value="12" icon={<Info className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search messages..." />
          <SelectFilter
            value={severityFilter} onChange={setSeverityFilter}
            options={[
              { label: 'Critical', value: 'Critical' },
              { label: 'Warning', value: 'Warning' },
              { label: 'Info', value: 'Info' },
            ]}
            placeholder="Severity"
          />
          <SelectFilter
            value={moduleFilter} onChange={setModuleFilter}
            options={[
              { label: 'Inventory Module', value: 'Inventory Module' },
              { label: 'Sales Module', value: 'Sales Module' },
              { label: 'Finance Module', value: 'Finance Module' },
              { label: 'Dispatch Module', value: 'Dispatch Module' },
              { label: 'System Module', value: 'System Module' },
            ]}
            placeholder="Module"
          />
          <SelectFilter
            value={statusFilter} onChange={setStatusFilter}
            options={[
              { label: 'Unread', value: 'Unread' },
              { label: 'Read', value: 'Read' },
              { label: 'Archived', value: 'Archived' },
            ]}
            placeholder="Status"
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
          <div className="notification-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .notification-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .notification-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
