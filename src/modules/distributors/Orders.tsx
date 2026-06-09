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

interface Order {
  id: string;
  orderNo: string;
  distributor: string;
  date: string;
  amount: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled';
}

const mockData: Order[] = [
  { id: '1', orderNo: 'ORD-26-4412', distributor: 'Metro Pharma Distributors', date: '15-Oct-2026', amount: '₹ 2,45,000', status: 'Pending' },
  { id: '2', orderNo: 'ORD-26-4411', distributor: 'Global Health Supply', date: '14-Oct-2026', amount: '₹ 1,12,000', status: 'Approved' },
  { id: '3', orderNo: 'ORD-26-4410', distributor: 'Carewell Agencies', date: '12-Oct-2026', amount: '₹ 45,500', status: 'Fulfilled' },
];

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Order>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-violet-700">{row.orderNo}</span> },
    { key: 'distributor', label: 'Distributor' },
    { key: 'date', label: 'Order Date' },
    { key: 'amount', label: 'Order Value', render: (row) => <span className="font-medium text-slate-800">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Fulfilled' ? 'success' : row.status === 'Approved' ? 'info' : row.status === 'Pending' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || item.distributor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Placement"
        subtitle="Manage and approve incoming purchase orders from distributors."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Orders</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Order manually</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order no or distributor..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Fulfilled', value: 'Fulfilled' },
            { label: 'Rejected', value: 'Rejected' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No orders found."
        />
      </TableCard>
    </div>
  );
}
