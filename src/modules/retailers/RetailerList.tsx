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

interface Retailer {
  id: string;
  name: string;
  location: string;
  contact: string;
  creditLimit: string;
  status: 'Active' | 'Inactive' | 'On Hold';
}

const mockData: Retailer[] = [
  { id: '1', name: 'Apollo Pharmacy', location: 'Downtown', contact: '+91 9876500001', creditLimit: '₹ 2,00,000', status: 'Active' },
  { id: '2', name: 'MedPlus Store', location: 'Uptown', contact: '+91 9876500002', creditLimit: '₹ 1,50,000', status: 'Active' },
  { id: '3', name: 'Wellness Medicos', location: 'Suburbs', contact: '+91 9876500003', creditLimit: '₹ 50,000', status: 'On Hold' },
];

export default function RetailerList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Retailer>[] = [
    { key: 'name', label: 'Retailer Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'location', label: 'Location' },
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
        title="Retailer Master List"
        subtitle="Manage your network of retail pharmacies and medical stores."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Retailer</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search retailer name..." />
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
          emptyMessage="No retailers found."
        />
      </TableCard>
    </div>
  );
}
