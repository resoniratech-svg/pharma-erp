import { useState } from 'react';

import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface NotificationLog {
  id: string;
  timestamp: string;
  message: string;
  module: string;
  type: 'Info' | 'Warning' | 'Critical';
}

const mockData: NotificationLog[] = [
  { id: '1', timestamp: 'Today, 10:30 AM', message: 'New order received from Apollo Pharmacy', module: 'Sales', type: 'Info' },
  { id: '2', timestamp: 'Today, 09:15 AM', message: 'System Backup completed successfully', module: 'System', type: 'Info' },
  { id: '3', timestamp: 'Yesterday, 04:00 PM', message: 'E-Way Bill Generation Failed for CHL-099', module: 'Billing', type: 'Critical' },
  { id: '4', timestamp: 'Yesterday, 02:20 PM', message: 'GST Filing Deadline approaching in 5 days', module: 'Finance', type: 'Warning' },
];

export default function ActivityNotifications() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const columns: Column<NotificationLog>[] = [
    { key: 'timestamp', label: 'Date & Time', render: (row) => <span className="text-slate-600 text-xs">{row.timestamp}</span> },
    { key: 'message', label: 'Message', render: (row) => <span className="font-medium text-slate-800">{row.message}</span> },
    { key: 'module', label: 'Module', render: (row) => <span className="text-slate-500 font-mono text-xs">{row.module}</span> },
    {
      key: 'type',
      label: 'Severity',
      render: (row) => {
        const variant = row.type === 'Critical' ? 'danger' : row.type === 'Warning' ? 'warning' : 'info';
        return <Badge variant={variant}>{row.type}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.message.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Activity Notifications"
        subtitle="Global event stream across all ERP modules."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search messages..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Info', value: 'Info' },
            { label: 'Warning', value: 'Warning' },
            { label: 'Critical', value: 'Critical' },
          ]}
          placeholder="All Severities"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No recent activity logs."
        />
      </TableCard>
    </div>
  );
}
