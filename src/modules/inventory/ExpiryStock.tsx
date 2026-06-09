import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
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

interface Expiry {
  id: string;
  productName: string;
  batchNo: string;
  expDate: string;
  qty: number;
  value: string;
  status: 'Expired' | 'Nearing Expiry';
}

const mockData: Expiry[] = [
  { id: '1', productName: 'Cough Syrup 100ml', batchNo: 'B-2023-112', expDate: '31-Oct-2025', qty: 150, value: '₹ 12,750', status: 'Expired' },
  { id: '2', productName: 'Ibuprofen 400mg', batchNo: 'B-2024-331', expDate: '09-Jul-2026', qty: 800, value: '₹ 52,000', status: 'Nearing Expiry' },
  { id: '3', productName: 'Eye Drops 5ml', batchNo: 'B-2024-001', expDate: '15-Aug-2026', qty: 120, value: '₹ 18,000', status: 'Nearing Expiry' },
];

export default function ExpiryStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Expiry>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'batchNo', label: 'Batch No' },
    { key: 'expDate', label: 'Expiry Date', render: (row) => <span className="font-medium text-rose-600">{row.expDate}</span> },
    { key: 'qty', label: 'Quantity' },
    { key: 'value', label: 'Est. Loss', render: (row) => <span className="font-bold text-slate-800">{row.value}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Expired' ? 'danger' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || item.batchNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Stock Tracking"
        subtitle="Monitor expired batches and items nearing expiration."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or batch..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Expired', value: 'Expired' },
            { label: 'Nearing Expiry', value: 'Nearing Expiry' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No expiry issues found. Great job!"
        />
      </TableCard>
    </div>
  );
}
