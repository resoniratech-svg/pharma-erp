import { useState } from 'react';
import { Plus, Download, Calendar } from 'lucide-react';
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

interface MTP {
  id: string;
  month: string;
  repName: string;
  hq: string;
  status: 'Approved' | 'Pending Approval' | 'Draft';
}

const mockData: MTP[] = [
  { id: '1', month: 'October 2026', repName: 'Rahul Verma', hq: 'Mumbai West', status: 'Approved' },
  { id: '2', month: 'November 2026', repName: 'Rahul Verma', hq: 'Mumbai West', status: 'Pending Approval' },
];

export default function TourPlanning() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<MTP>[] = [
    { key: 'month', label: 'Planning Month', render: (row) => <span className="font-semibold text-slate-900">{row.month}</span> },
    { key: 'repName', label: 'Rep Name' },
    { key: 'hq', label: 'Headquarters (HQ)' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Approved' ? 'success' : row.status === 'Pending Approval' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><Calendar className="w-4 h-4 mr-1" /> View Plan</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.month.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Tour Planning"
        subtitle="Plan and submit monthly travel routes and daily patch assignments."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export MTP</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Plan</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search month..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Approved', value: 'Approved' },
            { label: 'Pending Approval', value: 'Pending Approval' },
            { label: 'Draft', value: 'Draft' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No tour plans found."
        />
      </TableCard>
    </div>
  );
}
