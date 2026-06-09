import { useState } from 'react';
import { Plus, Download, Filter, User } from 'lucide-react';
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

interface Lead {
  id: string;
  name: string;
  type: string;
  source: string;
  contact: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
}

const mockData: Lead[] = [
  { id: '1', name: 'Dr. Ramesh Sharma', type: 'Doctor', source: 'Medical Camp', contact: '+91 9876543210', status: 'New' },
  { id: '2', name: 'Metro Distributors', type: 'Distributor', source: 'Referral', contact: 'metro@example.com', status: 'Qualified' },
  { id: '3', name: 'Wellness Pharmacy', type: 'Retailer', source: 'Website', contact: '+91 9988776655', status: 'Contacted' },
];

export default function Leads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Lead>[] = [
    { key: 'name', label: 'Lead Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'type', label: 'Type' },
    { key: 'contact', label: 'Contact Info' },
    { key: 'source', label: 'Source' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Qualified' ? 'success' : row.status === 'New' ? 'info' : row.status === 'Contacted' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><User className="w-4 h-4" /></ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Lead Creation"
        subtitle="Track and manage potential doctors, distributors, and retail partners."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Leads</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Lead</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search leads..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'New', value: 'New' },
            { label: 'Contacted', value: 'Contacted' },
            { label: 'Qualified', value: 'Qualified' },
            { label: 'Lost', value: 'Lost' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No leads found."
        />
      </TableCard>
    </div>
  );
}
