import { useState } from 'react';
import { Download, Filter, CheckCircle2 } from 'lucide-react';
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

interface Delivery {
  id: string;
  orderId: string;
  client: string;
  expectedDate: string;
  actualDate: string;
  status: 'Delivered' | 'Delayed' | 'On Time';
}

const mockData: Delivery[] = [
  { id: '1', orderId: 'ORD-1002', client: 'Apollo Hospitals', expectedDate: '15-Oct-2026', actualDate: '14-Oct-2026', status: 'Delivered' },
  { id: '2', orderId: 'ORD-1000', client: 'City Clinic', expectedDate: '12-Oct-2026', actualDate: '-', status: 'Delayed' },
];

export default function DeliveryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Delivery>[] = [
    { key: 'orderId', label: 'Order ID', render: (row) => <span className="font-semibold text-slate-900">{row.orderId}</span> },
    { key: 'client', label: 'Client / Buyer' },
    { key: 'expectedDate', label: 'Expected Delivery' },
    { key: 'actualDate', label: 'Actual Delivery', render: (row) => <span className="font-medium text-slate-800">{row.actualDate}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Delivered' ? 'success' : row.status === 'Delayed' ? 'danger' : 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'POD',
      render: (row) => row.status === 'Delivered' ? <button className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium"><CheckCircle2 className="w-4 h-4" /> View</button> : <span className="text-slate-300">-</span>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.orderId.toLowerCase().includes(search.toLowerCase()) || item.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Delivery Tracking & POD"
        subtitle="Monitor final mile deliveries and Proof of Delivery documents."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order or client..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Delayed', value: 'Delayed' },
            { label: 'On Time', value: 'On Time' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No delivery records found."
        />
      </TableCard>
    </div>
  );
}
