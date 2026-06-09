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

interface Distributor {
  id: string;
  name: string;
  region: string;
  contact: string;
  creditLimit: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

const mockData: Distributor[] = [
  { id: '1', name: 'Metro Pharma Distributors', region: 'North Zone', contact: '+91 9876543210', creditLimit: '₹ 15,00,000', status: 'Active' },
  { id: '2', name: 'Global Health Supply', region: 'South Zone', contact: '+91 9876543211', creditLimit: '₹ 8,50,000', status: 'Active' },
  { id: '3', name: 'Carewell Agencies', region: 'East Zone', contact: '+91 9876543212', creditLimit: '₹ 5,00,000', status: 'On Hold' },
];

export default function DistributorList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Distributor>[] = [
    { key: 'name', label: 'Distributor Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'region', label: 'Region' },
    { key: 'contact', label: 'Contact' },
    { key: 'creditLimit', label: 'Credit Limit', render: (row) => <span className="font-medium text-slate-800">{row.creditLimit}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'On Hold' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Distributor Master List"
        subtitle="Manage your network of distributors, stockists, and wholesale partners."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Distributor</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search distributor name..." />
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
            { label: 'On Hold', value: 'On Hold' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No distributors found."
        />
      </TableCard>
    </div>
  );
}
