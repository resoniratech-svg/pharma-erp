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

interface PaymentEntry {
  id: string;
  receiptNo: string;
  date: string;
  partyName: string;
  mode: string;
  amount: string;
  status: 'Cleared' | 'Pending' | 'Bounced';
}

const mockData: PaymentEntry[] = [
  { id: '1', receiptNo: 'RCT/26/105', date: '18-Oct-2026', partyName: 'Apollo Pharmacy', mode: 'NEFT', amount: '₹ 45,000', status: 'Cleared' },
  { id: '2', receiptNo: 'RCT/26/106', date: '19-Oct-2026', partyName: 'Wellness Medicos', mode: 'Cheque', amount: '₹ 20,000', status: 'Pending' },
  { id: '3', receiptNo: 'RCT/26/107', date: '15-Oct-2026', partyName: 'Metro Distributors', mode: 'Cheque', amount: '₹ 15,000', status: 'Bounced' },
];

export default function Payments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<PaymentEntry>[] = [
    { key: 'receiptNo', label: 'Receipt No.', render: (row) => <span className="font-semibold text-slate-900">{row.receiptNo}</span> },
    { key: 'date', label: 'Date' },
    { key: 'partyName', label: 'Party Name' },
    { key: 'mode', label: 'Mode', render: (row) => <span className="text-slate-600">{row.mode}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-violet-700">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Cleared' ? 'success' : row.status === 'Pending' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.partyName.toLowerCase().includes(search.toLowerCase()) || item.receiptNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Payment Tracking"
        subtitle="Manage incoming receipts and outgoing payments."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>New Receipt</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search receipt or party..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Cleared', value: 'Cleared' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Bounced', value: 'Bounced' },
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
