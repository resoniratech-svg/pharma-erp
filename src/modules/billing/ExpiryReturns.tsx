import { useState } from 'react';
import { Download, Filter, AlertTriangle } from 'lucide-react';
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

interface ExpiryReturn {
  id: string;
  returnNo: string;
  customerName: string;
  batchNo: string;
  productName: string;
  qty: string;
  status: 'Settled' | 'Pending Vendor' | 'Scrapped';
}

const mockData: ExpiryReturn[] = [
  { id: '1', returnNo: 'EXP-26-101', customerName: 'Wellness Medicos', productName: 'Cough Syrup 100ml', batchNo: 'B-8991', qty: '50 Bottles', status: 'Pending Vendor' },
  { id: '2', returnNo: 'EXP-26-102', customerName: 'Apollo Pharmacy', productName: 'Paracetamol 650mg', batchNo: 'B-7712', qty: '10 Strips', status: 'Settled' },
];

export default function ExpiryReturns() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<ExpiryReturn>[] = [
    { key: 'returnNo', label: 'Return No', render: (row) => <span className="font-semibold text-slate-900">{row.returnNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'productName', label: 'Product Name' },
    { key: 'batchNo', label: 'Batch No', render: (row) => <span className="font-medium text-slate-600">{row.batchNo}</span> },
    { key: 'qty', label: 'Quantity' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Settled' ? 'success' : row.status === 'Pending Vendor' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.returnNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Return"
        subtitle="Manage expired goods returned from customers for vendor settlement or destruction."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
        }
      />

      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-rose-800">Pending Vendor Settlements</h3>
          <p className="text-sm text-rose-700 mt-1">₹ 45,000 worth of expired stock is pending replacement/credit note from principal companies.</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search return no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Settled', value: 'Settled' },
            { label: 'Pending Vendor', value: 'Pending Vendor' },
            { label: 'Scrapped', value: 'Scrapped' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No expiry returns found."
        />
      </TableCard>
    </div>
  );
}
