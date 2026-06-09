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

interface Dispatch {
  id: string;
  dispatchId: string;
  orderId: string;
  client: string;
  date: string;
  status: 'Ready to Ship' | 'Shipped' | 'Packing';
}

const mockData: Dispatch[] = [
  { id: '1', dispatchId: 'DSP-2026-001', orderId: 'ORD-1002', client: 'Apollo Hospitals', date: '14-Oct-2026', status: 'Ready to Ship' },
  { id: '2', dispatchId: 'DSP-2026-002', orderId: 'ORD-1003', client: 'Care Pharmacy', date: '14-Oct-2026', status: 'Packing' },
  { id: '3', dispatchId: 'DSP-2026-003', orderId: 'ORD-0991', client: 'City Clinic', date: '13-Oct-2026', status: 'Shipped' },
];

export default function DispatchManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Dispatch>[] = [
    { key: 'dispatchId', label: 'Dispatch ID', render: (row) => <span className="font-semibold text-slate-900">{row.dispatchId}</span> },
    { key: 'orderId', label: 'Order ID' },
    { key: 'client', label: 'Client / Buyer', render: (row) => <span className="font-medium text-slate-800">{row.client}</span> },
    { key: 'date', label: 'Scheduled Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Shipped' ? 'success' : row.status === 'Ready to Ship' ? 'info' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.dispatchId.toLowerCase().includes(search.toLowerCase()) || item.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch Management"
        subtitle="Manage pick, pack, and ship operations."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export List</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>New Dispatch</ActionButton>
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
            { label: 'Ready to Ship', value: 'Ready to Ship' },
            { label: 'Packing', value: 'Packing' },
            { label: 'Shipped', value: 'Shipped' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No dispatch records found."
        />
      </TableCard>
    </div>
  );
}
