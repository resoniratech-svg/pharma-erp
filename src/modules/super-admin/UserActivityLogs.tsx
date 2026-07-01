import { useState, useRef, useEffect } from 'react';
import { Activity, UserCheck, ShieldAlert, AlertTriangle, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
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
import activityLogService from '../../services/activityLogService';

interface AuditLog {
  id: string;
  dateTime: string;
  user: string;
  module: string;
  activity: string;
  activityType: string;
  ipAddress: string;
  status: 'Success' | 'Failed' | 'Warning';
}



export default function UserActivityLogs() {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
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

  useEffect(() => {
    const storedLogs = activityLogService.getLogs();

    const formattedLogs = storedLogs.map((log: any) => ({
      id: log.id,
      dateTime: log.timestamp,
      user: log.userName || "Unknown User",
      module: log.module,
      activity: log.action,
      activityType: "User Activity",
      ipAddress: "Localhost",
      status: log.status || "Success",
    }));

    setLogs(formattedLogs);
  }, []);

  const columns: Column<AuditLog>[] = [
    { key: 'dateTime', label: 'Date & Time', render: (row) => <span className="text-sm font-mono text-slate-500">{new Date(row.dateTime).toLocaleString()}</span> },
    { key: 'user', label: 'User Name', render: (row) => <span className="font-semibold text-slate-900">{row.user}</span> },
    { key: 'module', label: 'Module', render: (row) => <span className="text-slate-600">{row.module}</span> },
    { key: 'activity', label: 'Activity', render: (row) => <span className="text-slate-700">{row.activity}</span> },
  

  ];

  const filteredData = logs.filter((item) => {
    let match = true;
    if (search) {
      match = match && (
        item.user.toLowerCase().includes(search.toLowerCase()) || 
        item.activity.toLowerCase().includes(search.toLowerCase()) ||
        item.module.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter) match = match && item.status === statusFilter;
    if (activityTypeFilter) match = match && item.activityType === activityTypeFilter;
    
    if (fromDate) match = match && new Date(item.dateTime) >= new Date(fromDate);
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
      statusFilter && `Status: ${statusFilter}`,
      activityTypeFilter && `Activity Type: ${activityTypeFilter}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['User Activity & Audit Log Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Date & Time', 'User Name / Email', 'Module', 'Activity', 'IP Address', 'Status'];
    const tableRows = filteredData.map(row => [
      new Date(row.dateTime).toLocaleString(),
      row.user,
      row.module,
      row.activity,
      row.ipAddress,
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
    link.download = `User_Activity_Audit_Log_Report_${dateStr}.csv`;
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
    XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `User_Activity_Audit_Log_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  const activeSessions = logs.filter(
    (log: any) => log.action === "Login",
  ).length;
  const failedLogins = logs.filter(
    (log: any) => log.status === "Failed",
  ).length;

  const criticalActivities = logs.filter(
    (log: any) =>
      log.action?.includes("Password") || log.action?.includes("Delete"),
  ).length;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="User Activity & Audit Logs"
        subtitle="Track system access, configuration changes, and user sessions."
        breadcrumb={[{ label: "Super Admin" }, { label: "Activity Logs" }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear all activity logs?",
                  )
                ) {
                  activityLogService.clearLogs();
                  setLogs([]);
                }
              }}
            >
              Clear Logs
            </ActionButton>

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
          </div>
        }
      />
     

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Events Today"
          value={logs.length.toString()}
          icon={<Activity className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-100"
        />
        <SummaryCard
          title="Active Sessions"
          value={activeSessions.toString()}
          icon={<UserCheck className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-100"
        />
        <SummaryCard
          title="Failed Login Attempts"
          value={failedLogins.toString()}
          icon={<ShieldAlert className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-100"
        />
        <SummaryCard
          title="Critical Activities"
          value={criticalActivities.toString()}
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-100"
        />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search user, module, action..."
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Success", value: "Success" },
              { label: "Failed", value: "Failed" },
              { label: "Warning", value: "Warning" },
            ]}
            placeholder="Status"
          />
          <SelectFilter
            value={activityTypeFilter}
            onChange={setActivityTypeFilter}
            options={[
              { label: "Login", value: "Login" },
              { label: "Configuration", value: "Configuration" },
              { label: "Approval", value: "Approval" },
              { label: "Data Export", value: "Data Export" },
              { label: "System", value: "System" },
            ]}
            placeholder="Activity Type"
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
          <div className="audit-log-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .audit-log-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .audit-log-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
