import { useState } from 'react';
import { ShoppingCart, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface SalesOrder {
  id: string;
  orderNo: string;
  customer: string;
  orderDate: string;
  amount: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  dispatchStatus: 'Not Dispatched' | 'In Transit' | 'Delivered' | 'Returned';
}

const mockOrders: SalesOrder[] = [
  { id: '1', orderNo: 'ORD-2026-001', customer: 'Apollo Pharmacy', orderDate: '01-Nov-2026', amount: '₹ 1,25,000', status: 'Completed', dispatchStatus: 'Delivered' },
  { id: '2', orderNo: 'ORD-2026-002', customer: 'Global Health Agencies', orderDate: '02-Nov-2026', amount: '₹ 4,50,000', status: 'Pending', dispatchStatus: 'Not Dispatched' },
  { id: '3', orderNo: 'ORD-2026-003', customer: 'Metro Distributors', orderDate: '02-Nov-2026', amount: '₹ 8,20,000', status: 'Processing', dispatchStatus: 'In Transit' },
  { id: '4', orderNo: 'ORD-2026-004', customer: 'City Medicos', orderDate: '30-Oct-2026', amount: '₹ 45,500', status: 'Cancelled', dispatchStatus: 'Returned' },
];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<SalesOrder>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'customer', label: 'Customer' },
    { key: 'orderDate', label: 'Order Date' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-slate-700">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Pending' ? 'warning' : row.status === 'Cancelled' ? 'danger' : 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'dispatchStatus',
      label: 'Dispatch Status',
      render: (row) => {
        const variant = row.dispatchStatus === 'Delivered' ? 'success' : row.dispatchStatus === 'In Transit' ? 'info' : row.dispatchStatus === 'Returned' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{row.dispatchStatus}</Badge>;
      }
    }
  ];

  const filteredData = mockOrders.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || item.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Orders Management"
        subtitle="Manage sales orders, order processing, dispatch tracking and order status."
        breadcrumb={[{ label: 'Orders' }, { label: 'All Orders' }]}
        actions={
          <>
            <ExportButton />
            <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />}>Create Order</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Total Orders" value="1,420" icon={<ShoppingCart className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Pending Orders" value="45" icon={<Clock className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Completed Orders" value="1,350" icon={<CheckCircle2 className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Cancelled Orders" value="25" icon={<XCircle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Processing', value: 'Processing' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
