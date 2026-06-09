import { useState } from 'react';
import { Plus, Download, Filter } from 'lucide-react';
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

interface Scheme {
  id: string;
  schemeCode: string;
  title: string;
  validity: string;
  eligibility: string;
  status: 'Active' | 'Upcoming' | 'Expired';
}

const mockData: Scheme[] = [
  { id: '1', schemeCode: 'SCH-OCT-10', title: 'Buy 10 Get 1 Free (Amoxicillin)', validity: '01 Oct - 31 Oct 26', eligibility: 'All Distributors', status: 'Active' },
  { id: '2', schemeCode: 'SCH-FEST-5', title: 'Diwali 5% Additional CD', validity: '15 Oct - 05 Nov 26', eligibility: 'Gold Tier Only', status: 'Upcoming' },
  { id: '3', schemeCode: 'SCH-SEP-2', title: 'Quarter End Q2 Target Bonus', validity: '15 Sep - 30 Sep 26', eligibility: 'All Stockists', status: 'Expired' },
];

export default function Schemes() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-violet-700">{row.schemeCode}</span> },
    { key: 'title', label: 'Title / Description', render: (row) => <span className="font-medium text-slate-800">{row.title}</span> },
    { key: 'validity', label: 'Validity Period' },
    { key: 'eligibility', label: 'Eligibility' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Upcoming' ? 'info' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.schemeCode.toLowerCase().includes(search.toLowerCase()) || item.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Visibility"
        subtitle="Manage trade offers, cash discounts (CD), and bonus schemes."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export List</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Scheme</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search scheme or code..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Upcoming', value: 'Upcoming' },
            { label: 'Expired', value: 'Expired' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No schemes found."
        />
      </TableCard>
    </div>
  );
}
