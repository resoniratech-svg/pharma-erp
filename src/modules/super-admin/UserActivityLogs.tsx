import { useState } from 'react';
import { Activity, UserCheck, ShieldAlert } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
}

const mockData: AuditLog[] = [
  { id: '1', timestamp: '2026-11-02 14:30:22', user: 'admin@pharmatech.com', action: 'Modified Role: Inventory Manager', ipAddress: '192.168.1.105', status: 'Success' },
  { id: '2', timestamp: '2026-11-02 13:15:10', user: 'unknown', action: 'Failed Login Attempt', ipAddress: '45.22.11.99', status: 'Failed' },
  { id: '3', timestamp: '2026-11-02 10:05:00', user: 'jane@pharmatech.com', action: 'Approved PO #PO-102', ipAddress: '192.168.1.112', status: 'Success' },
  { id: '4', timestamp: '2026-11-01 18:45:00', user: 'admin@pharmatech.com', action: 'Exported All India Sales Report', ipAddress: '192.168.1.105', status: 'Success' },
];

export default function UserActivityLogs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<AuditLog>[] = [
    { key: 'timestamp', label: 'Date & Time', render: (row) => <span className="text-sm font-mono text-slate-500">{row.timestamp}</span> },
    { key: 'user', label: 'User / Email', render: (row) => <span className="font-semibold text-slate-900">{row.user}</span> },
    { key: 'action', label: 'Action Performed' },
    { key: 'ipAddress', label: 'IP Address', render: (row) => <span className="text-sm font-mono text-slate-500">{row.ipAddress}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Success' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.user.toLowerCase().includes(search.toLowerCase()) || item.action.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="User Activity & Audit Logs"
        subtitle="Track system access, configuration changes, and user sessions."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Activity Logs' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Total Events (Today)" value="1,284" icon={<Activity className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Active Sessions" value="45" icon={<UserCheck className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Failed Logins" value="12" icon={<ShieldAlert className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user or action..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Success', value: 'Success' },
            { label: 'Failed', value: 'Failed' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
