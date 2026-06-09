import { useState } from 'react';
import { IndianRupee, AlertCircle, Clock } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface PendingPayment {
  id: string;
  partyName: string;
  type: 'Distributor' | 'Retailer';
  invoiceNo: string;
  amount: string;
  daysOverdue: number;
  status: 'Critical' | 'Overdue' | 'Due Soon';
}

const mockData: PendingPayment[] = [
  { id: '1', partyName: 'Global Health Agencies', type: 'Distributor', invoiceNo: 'INV/26/105', amount: '₹ 4,50,000', daysOverdue: 45, status: 'Critical' },
  { id: '2', partyName: 'Apollo Pharmacy', type: 'Retailer', invoiceNo: 'INV/26/112', amount: '₹ 1,25,000', daysOverdue: 15, status: 'Overdue' },
  { id: '3', partyName: 'Metro Distributors', type: 'Distributor', invoiceNo: 'INV/26/120', amount: '₹ 8,20,000', daysOverdue: 2, status: 'Due Soon' },
];

export default function PendingPaymentTracking() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const columns: Column<PendingPayment>[] = [
    { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span> },
    { key: 'type', label: 'Type' },
    { key: 'invoiceNo', label: 'Invoice No.' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-rose-600">{row.amount}</span> },
    { key: 'daysOverdue', label: 'Days Overdue', render: (row) => <span className="text-slate-600">{row.daysOverdue} days</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Critical' ? 'danger' : row.status === 'Overdue' ? 'warning' : 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.partyName.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Pending Payment Tracking"
        subtitle="Monitor outstanding receivables from distributors and retailers."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Pending Payments' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Total Outstanding" value="₹ 2.4 Cr" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <SummaryCard title="Distributor Dues" value="₹ 1.8 Cr" icon={<AlertCircle className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Retailer Dues" value="₹ 60 L" icon={<Clock className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search party name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Distributor', value: 'Distributor' },
            { label: 'Retailer', value: 'Retailer' },
          ]}
          placeholder="All Types"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
