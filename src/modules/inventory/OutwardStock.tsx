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

interface Outward {
  id: string;
  dispatchNo: string;
  date: string;
  client: string;
  itemsCount: number;
  totalAmount: string;
  status: 'Dispatched' | 'Processing';
}

const mockData: Outward[] = [
  { id: '1', dispatchNo: 'OUT-2026-001', date: '14-Oct-2026', client: 'Apollo Hospitals', itemsCount: 15, totalAmount: '₹ 2,45,000', status: 'Dispatched' },
  { id: '2', dispatchNo: 'OUT-2026-002', date: '14-Oct-2026', client: 'Care Pharmacy', itemsCount: 3, totalAmount: '₹ 18,500', status: 'Processing' },
  { id: '3', dispatchNo: 'OUT-2026-003', date: '13-Oct-2026', client: 'City Clinic', itemsCount: 8, totalAmount: '₹ 1,12,000', status: 'Dispatched' },
];

export default function OutwardStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Outward>[] = [
    { key: 'dispatchNo', label: 'Dispatch Number', render: (row) => <span className="font-semibold text-blue-700">{row.dispatchNo}</span> },
    { key: 'date', label: 'Outward Date' },
    { key: 'client', label: 'Client / Buyer', render: (row) => <span className="font-medium text-slate-800">{row.client}</span> },
    { key: 'itemsCount', label: 'Total Items', render: (row) => `${row.itemsCount} Items` },
    { key: 'totalAmount', label: 'Total Value' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Dispatched' ? 'success' : 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.dispatchNo.toLowerCase().includes(search.toLowerCase()) || item.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outward Stock Management"
        subtitle="Manage inventory leaving the warehouse and delivery challans."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Dispatch</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search dispatch or client..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'Processing', value: 'Processing' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No outward records found."
        />
      </TableCard>
    </div>
  );
}
