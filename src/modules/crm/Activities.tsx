import { useState } from 'react';
import { Download } from 'lucide-react';
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

interface ActivityLog {
  id: string;
  date: string;
  user: string;
  action: string;
  entity: string;
  type: 'Email' | 'Call' | 'Meeting' | 'Note';
}

const mockData: ActivityLog[] = [
  { id: '1', date: '24-Oct-2026 10:30 AM', user: 'Rahul Verma', action: 'Sent Proposal', entity: 'Metro Distributors', type: 'Email' },
  { id: '2', date: '24-Oct-2026 11:15 AM', user: 'Amit Singh', action: 'Logged Call', entity: 'Dr. Ramesh Sharma', type: 'Call' },
  { id: '3', date: '23-Oct-2026 04:00 PM', user: 'Rahul Verma', action: 'Added Note', entity: 'Wellness Pharmacy', type: 'Note' },
];

export default function Activities() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const columns: Column<ActivityLog>[] = [
    { key: 'date', label: 'Date & Time', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'user', label: 'User', render: (row) => <span className="font-medium text-slate-900">{row.user}</span> },
    { key: 'action', label: 'Action Taken' },
    { key: 'entity', label: 'Related To' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const variant = row.type === 'Email' ? 'info' : row.type === 'Call' ? 'success' : row.type === 'Meeting' ? 'purple' : 'neutral';
        return <Badge variant={variant}>{row.type}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.entity.toLowerCase().includes(search.toLowerCase()) || item.user.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Activity Tracking"
        subtitle="Audit log of all interactions and updates across the CRM."
        actions={
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200">
            <Download className="w-4 h-4" /> Export Log
          </button>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user or entity..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Email', value: 'Email' },
            { label: 'Call', value: 'Call' },
            { label: 'Meeting', value: 'Meeting' },
            { label: 'Note', value: 'Note' },
          ]}
          placeholder="All Types"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No activities found."
        />
      </TableCard>
    </div>
  );
}
