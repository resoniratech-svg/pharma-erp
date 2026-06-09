import { useState } from 'react';
import { Download, PhoneCall, Calendar } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface FollowUp {
  id: string;
  date: string;
  contactName: string;
  type: string;
  method: string;
  status: 'Pending' | 'Completed' | 'Overdue';
}

const mockData: FollowUp[] = [
  { id: '1', date: '26-Oct-2026', contactName: 'Dr. Ramesh Sharma', type: 'Lead Check-in', method: 'Phone Call', status: 'Pending' },
  { id: '2', date: '20-Oct-2026', contactName: 'Global Distributors', type: 'Contract Renewal', method: 'Email', status: 'Overdue' },
  { id: '3', date: '22-Oct-2026', contactName: 'Wellness Pharmacy', type: 'Product Demo', method: 'In-Person', status: 'Completed' },
];

export default function FollowUps() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<FollowUp>[] = [
    { key: 'contactName', label: 'Contact Name', render: (row) => <span className="font-semibold text-slate-900">{row.contactName}</span> },
    { key: 'type', label: 'Purpose' },
    { key: 'method', label: 'Method', render: (row) => <span className="text-slate-600">{row.method}</span> },
    { key: 'date', label: 'Due Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Overdue' ? 'danger' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><PhoneCall className="w-4 h-4" /></ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.contactName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Follow-Up Management"
        subtitle="Manage scheduled touchpoints with leads and clients."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export List</ActionButton>
        }
      />

      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Calendar className="w-5 h-5 text-rose-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-rose-800">Overdue Follow-ups</h3>
          <p className="text-sm text-rose-700 mt-1">You have 4 overdue follow-ups from last week that require immediate attention.</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search contacts..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No follow-ups found."
        />
      </TableCard>
    </div>
  );
}
