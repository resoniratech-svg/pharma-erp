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

interface CRMMeeting {
  id: string;
  title: string;
  client: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

const mockData: CRMMeeting[] = [
  { id: '1', title: 'Product Demo', client: 'Apollo Hospitals', date: '25-Oct-2026', time: '10:00 AM', status: 'Scheduled' },
  { id: '2', title: 'Quarterly Review', client: 'Metro Distributors', date: '26-Oct-2026', time: '02:30 PM', status: 'Scheduled' },
  { id: '3', title: 'Initial Consultation', client: 'Dr. Ramesh Sharma', date: '20-Oct-2026', time: '11:00 AM', status: 'Completed' },
];

export default function Meetings() {
  const [search, setSearch] = useState('');

  const columns: Column<CRMMeeting>[] = [
    { key: 'title', label: 'Meeting Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
    { key: 'client', label: 'Client / Lead' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Scheduled' ? 'info' : 'neutral';
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
    return item.title.toLowerCase().includes(search.toLowerCase()) || item.client.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Meeting Scheduling"
        subtitle="Schedule and manage virtual or in-person meetings with clients."
        actions={
          <ActionButton icon={<Plus className="w-4 h-4" />}>Schedule Meeting</ActionButton>
        }
      />

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-indigo-800">Upcoming Sync</h3>
          <p className="text-sm text-indigo-700 mt-1">You have a product demo with Apollo Hospitals in 30 minutes.</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search meetings or clients..." />
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
