import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
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

interface Offer {
  id: string;
  offerCode: string;
  title: string;
  validity: string;
  type: string;
  status: 'Active' | 'Upcoming' | 'Expired';
}

const mockData: Offer[] = [
  { id: '1', offerCode: 'OFF-OCT-10', title: 'Buy 10 Get 1 Free (Amoxicillin)', validity: '01 Oct - 31 Oct 26', type: 'Product Bonus', status: 'Active' },
  { id: '2', offerCode: 'OFF-FEST-5', title: 'Diwali 5% Additional CD', validity: '15 Oct - 05 Nov 26', type: 'Cash Discount', status: 'Upcoming' },
  { id: '3', offerCode: 'OFF-SEP-2', title: 'Month End 2% Bonus', validity: '15 Sep - 30 Sep 26', type: 'Cash Discount', status: 'Expired' },
];

export default function Offers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Offer>[] = [
    { key: 'offerCode', label: 'Offer Code', render: (row) => <span className="font-semibold text-violet-700">{row.offerCode}</span> },
    { key: 'title', label: 'Offer Description', render: (row) => <span className="font-medium text-slate-800">{row.title}</span> },
    { key: 'type', label: 'Offer Type' },
    { key: 'validity', label: 'Validity Period' },
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
    const matchSearch = item.offerCode.toLowerCase().includes(search.toLowerCase()) || item.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Offer Visibility"
        subtitle="View active trade offers, cash discounts, and bonus deals for retailers."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Offers</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search offer code or title..." />
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
          emptyMessage="No offers found."
        />
      </TableCard>
    </div>
  );
}
