import { useState } from 'react';
import { BellRing, AlertTriangle, Info } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  module: string;
  severity: 'Critical' | 'Warning' | 'Info';
}

const mockData: Notification[] = [
  { id: '1', timestamp: 'Today, 11:30 AM', title: 'Payment Failed', message: 'Auto-debit for License renewal failed.', module: 'Accounting & Finance', severity: 'Critical' },
  { id: '2', timestamp: 'Today, 09:15 AM', title: 'Low Stock Alert', message: 'Amoxicillin 250mg is below reorder level.', module: 'Inventory & Warehouse Management', severity: 'Warning' },
  { id: '3', timestamp: 'Yesterday, 04:00 PM', title: 'System Update', message: 'ERP version 2.4.1 deployed successfully.', module: 'System', severity: 'Info' },
];

export default function NotificationCenter() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const columns: Column<Notification>[] = [
    { key: 'timestamp', label: 'Time', render: (row) => <span className="text-sm text-slate-500">{row.timestamp}</span> },
    { key: 'module', label: 'Module', render: (row) => <Badge variant="neutral">{row.module}</Badge> },
    { key: 'title', label: 'Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
    { key: 'message', label: 'Message', render: (row) => <span className="text-slate-600">{row.message}</span> },
    {
      key: 'severity',
      label: 'Severity',
      render: (row) => {
        const variant = row.severity === 'Critical' ? 'danger' : row.severity === 'Warning' ? 'warning' : 'info';
        return <Badge variant={variant}>{row.severity}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.message.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter ? item.severity === severityFilter : true;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Super Admin Notification Center"
        subtitle="Global alerts and critical system messages."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Notification Center' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Critical Alerts" value="1" icon={<AlertTriangle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <SummaryCard title="System Warnings" value="5" icon={<BellRing className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Info Messages" value="24" icon={<Info className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search messages..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={severityFilter}
          onChange={setSeverityFilter}
          options={[
            { label: 'Critical', value: 'Critical' },
            { label: 'Warning', value: 'Warning' },
            { label: 'Info', value: 'Info' },
          ]}
          placeholder="All Severities"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
