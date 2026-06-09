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

interface Payment {
  id: string;
  receiptNo: string;
  retailer: string;
  date: string;
  amount: string;
  mode: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

const mockData: Payment[] = [
  { id: '1', receiptNo: 'RCPT-RET-1002', retailer: 'Apollo Pharmacy', date: '12-Oct-2026', amount: '₹ 15,000', mode: 'Bank Transfer', status: 'Completed' },
  { id: '2', receiptNo: 'RCPT-RET-1003', retailer: 'MedPlus Store', date: '14-Oct-2026', amount: '₹ 5,000', mode: 'Cheque', status: 'Pending' },
  { id: '3', receiptNo: 'RCPT-RET-1004', retailer: 'Wellness Medicos', date: '10-Oct-2026', amount: '₹ 2,500', mode: 'UPI', status: 'Failed' },
];

export default function Payments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Payment>[] = [
    { key: 'receiptNo', label: 'Receipt No', render: (row) => <span className="font-semibold text-slate-900">{row.receiptNo}</span> },
    { key: 'retailer', label: 'Retailer' },
    { key: 'date', label: 'Date' },
    { key: 'mode', label: 'Payment Mode' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-slate-800">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Pending' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.receiptNo.toLowerCase().includes(search.toLowerCase()) || item.retailer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Payment Tracking"
        subtitle="Track incoming payments, receipts, and settlements from retailers."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Record Payment</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search receipt or retailer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Completed', value: 'Completed' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Failed', value: 'Failed' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No payments found."
        />
      </TableCard>
    </div>
  );
}
