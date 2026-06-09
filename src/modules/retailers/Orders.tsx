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
  retailer: string;
  date: string;
  amount: string;
  status: 'Pending' | 'In Process' | 'Delivered';
}

const mockData: Order[] = [
  { id: '1', orderNo: 'RET-ORD-4412', retailer: 'Apollo Pharmacy', date: '15-Oct-2026', amount: '₹ 45,000', status: 'Pending' },
  { id: '2', orderNo: 'RET-ORD-4411', retailer: 'MedPlus Store', date: '14-Oct-2026', amount: '₹ 12,000', status: 'In Process' },
  { id: '3', orderNo: 'RET-ORD-4410', retailer: 'Wellness Medicos', date: '12-Oct-2026', amount: '₹ 5,500', status: 'Delivered' },
];

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Order>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-violet-700">{row.orderNo}</span> },
    { key: 'retailer', label: 'Retailer' },
    { key: 'date', label: 'Order Date' },
    { key: 'amount', label: 'Order Value', render: (row) => <span className="font-medium text-slate-800">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Delivered' ? 'success' : row.status === 'In Process' ? 'info' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || item.retailer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Placement"
        subtitle="Manage and track incoming purchase orders from retailers."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Order</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order no or retailer..." />
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
            { label: 'In Process', value: 'In Process' },
            { label: 'Delivered', value: 'Delivered' },
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
