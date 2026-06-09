import { useState } from 'react';
import { Plus, Download, Filter, ShoppingBag } from 'lucide-react';
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

interface POB {
  id: string;
  orderNo: string;
  chemist: string;
  date: string;
  amount: string;
  distributor: string;
  status: 'Booked' | 'Forwarded' | 'Fulfilled';
}

const mockData: POB[] = [
  { id: '1', orderNo: 'POB-26-001', chemist: 'Apollo Pharmacy', date: '15-Oct-2026', amount: '₹ 15,000', distributor: 'Metro Pharma', status: 'Booked' },
  { id: '2', orderNo: 'POB-26-002', chemist: 'MedPlus Store', date: '14-Oct-2026', amount: '₹ 8,500', distributor: 'Global Health', status: 'Forwarded' },
  { id: '3', orderNo: 'POB-26-003', chemist: 'Wellness Medicos', date: '10-Oct-2026', amount: '₹ 22,000', distributor: 'Carewell Agencies', status: 'Fulfilled' },
];

export default function OrderBooking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<POB>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-violet-700">{row.orderNo}</span> },
    { key: 'chemist', label: 'Chemist' },
    { key: 'distributor', label: 'Forwarded To' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-medium text-slate-800">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Fulfilled' ? 'success' : row.status === 'Forwarded' ? 'info' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <button className="text-violet-600 hover:text-violet-700 p-1"><ShoppingBag className="w-4 h-4" /></button>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || item.chemist.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Booking"
        subtitle="Manage orders collected from chemists on behalf of distributors."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export POB</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>New Order</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order or chemist..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Booked', value: 'Booked' },
            { label: 'Forwarded', value: 'Forwarded' },
            { label: 'Fulfilled', value: 'Fulfilled' },
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
