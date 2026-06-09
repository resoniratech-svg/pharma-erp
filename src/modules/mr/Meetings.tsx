import { useState } from 'react';
import { Plus, Video, Users } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface Meeting {
  id: string;
  title: string;
  date: string;
  type: 'Cycle Meeting' | 'Training' | 'Review';
  status: 'Scheduled' | 'Completed';
}

const mockData: Meeting[] = [
  { id: '1', title: 'Q3 Cycle Meeting & Product Launch', date: '25-Oct-2026', type: 'Cycle Meeting', status: 'Scheduled' },
  { id: '2', title: 'Monthly Sales Review', date: '30-Oct-2026', type: 'Review', status: 'Scheduled' },
  { id: '3', title: 'New Product Detailing Training', date: '05-Oct-2026', type: 'Training', status: 'Completed' },
];

export default function Meetings() {
  const [search, setSearch] = useState('');

  const columns: Column<Meeting>[] = [
    { key: 'title', label: 'Meeting Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type', render: (row) => <span className="font-medium text-slate-600">{row.type}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'neutral' : 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: (row) => row.status === 'Scheduled' ? <ActionButton variant="secondary" className="text-xs px-2 py-1 border-violet-200 text-violet-700"><Video className="w-4 h-4 mr-1" /> Join</ActionButton> : <span className="text-slate-300">-</span>
    }
  ];

  const filteredData = mockData.filter((item) => {
    return item.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Meeting Scheduling"
        subtitle="Manage cycle meetings, territory reviews, and corporate training sessions."
        actions={
          <ActionButton icon={<Plus className="w-4 h-4" />}>Schedule Meeting</ActionButton>
        }
      />

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-indigo-800">Upcoming Regional Meeting</h3>
          <p className="text-sm text-indigo-700 mt-1">You are required to attend the Q3 Cycle Meeting on Oct 25th in Mumbai.</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search meetings..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No meetings found."
        />
      </TableCard>
    </div>
  );
}
