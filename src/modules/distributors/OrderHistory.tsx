import { useState } from 'react';
import { Download, Filter, ShoppingCart, CheckCircle2, Clock, IndianRupee } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
} from './components/shared';
import { type Column } from './components/shared';

interface OrderHistoryItem {
  id: string;
  orderNo: string;
  orderDate: string;
  totalItems: number;
  orderValue: string;
  dispatchStatus: string;
  paymentStatus: string;
  deliveryDate: string;
  orderStatus: 'Pending' | 'Approved' | 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled';
}

const mockData: OrderHistoryItem[] = [
  { id: '1', orderNo: 'ORD-2024-001', orderDate: '24-Oct-2024', totalItems: 120, orderValue: '₹ 45,000', dispatchStatus: 'Fully Dispatched', paymentStatus: 'Paid', deliveryDate: '26-Oct-2024', orderStatus: 'Delivered' },
  { id: '2', orderNo: 'ORD-2024-002', orderDate: '26-Oct-2024', totalItems: 45, orderValue: '₹ 12,500', dispatchStatus: 'In Transit', paymentStatus: 'Pending', deliveryDate: '28-Oct-2024', orderStatus: 'Dispatched' },
  { id: '3', orderNo: 'ORD-2024-003', orderDate: '27-Oct-2024', totalItems: 300, orderValue: '₹ 1,20,000', dispatchStatus: 'Packing', paymentStatus: 'Paid', deliveryDate: '30-Oct-2024', orderStatus: 'Processing' },
  { id: '4', orderNo: 'ORD-2024-004', orderDate: '28-Oct-2024', totalItems: 10, orderValue: '₹ 3,400', dispatchStatus: 'Pending', paymentStatus: 'Pending', deliveryDate: 'TBD', orderStatus: 'Pending' },
];

export default function OrderHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<OrderHistoryItem>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'orderDate', label: 'Order Date' },
    { key: 'totalItems', label: 'Total Items', render: (row) => <span className="font-mono text-slate-700">{row.totalItems}</span> },
    { key: 'orderValue', label: 'Order Value', render: (row) => <span className="font-bold text-slate-800">{row.orderValue}</span> },
    { key: 'dispatchStatus', label: 'Dispatch Status' },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => <span className={`font-medium ${row.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{row.paymentStatus}</span> },
    { key: 'deliveryDate', label: 'Delivery Date' },
    {
      key: 'orderStatus',
      label: 'Order Status',
      render: (row) => {
        let variant: any = 'default';
        switch (row.orderStatus) {
          case 'Delivered':
            variant = 'success';
            break;
          case 'Dispatched':
          case 'Processing':
            variant = 'info';
            break;
          case 'Pending':
          case 'Approved':
            variant = 'warning';
            break;
          case 'Cancelled':
            variant = 'danger';
            break;
        }
        return <Badge variant={variant}>{row.orderStatus}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.orderStatus === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order History"
        subtitle="Track and review all previously placed distributor orders."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export History</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Orders"
          value="1,248"
          subtitle="All time"
          icon={<ShoppingCart className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Delivered Orders"
          value="1,120"
          subtitle="Successfully fulfilled"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Orders"
          value="24"
          subtitle="Awaiting processing"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Total Order Value"
          value="₹ 4.5 Cr"
          subtitle="Lifetime value"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by order number..." />
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
            { label: 'Processing', value: 'Processing' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Order Status"
        />
        {/* Additional filters like Date Range, Product, Company can be added here */}
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No order history found."
        />
      </TableCard>
    </div>
  );
}
