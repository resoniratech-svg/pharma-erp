import { useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';
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

interface DispatchItem {
  id: string;
  orderNo: string;
  distributor: string;
  transporter: string;
  lrNo: string;
  status: 'In Transit' | 'Delivered' | 'Pending POD';
}

const mockData: DispatchItem[] = [
  { id: '1', orderNo: 'ORD-26-4412', distributor: 'Metro Pharma Distributors', transporter: 'VRL Logistics', lrNo: 'LR-2026-4412', status: 'In Transit' },
  { id: '2', orderNo: 'ORD-26-4411', distributor: 'Global Health Supply', transporter: 'Gati Express', lrNo: 'LR-2026-4413', status: 'Pending POD' },
  { id: '3', orderNo: 'ORD-26-4410', distributor: 'Carewell Agencies', transporter: 'Delhivery', lrNo: 'LR-2026-4400', status: 'Delivered' },
];

export default function DispatchTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<DispatchItem>[] = [
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-slate-900">{row.orderNo}</span> },
    { key: 'distributor', label: 'Distributor' },
    { key: 'transporter', label: 'Transporter', render: (row) => <span className="font-medium text-slate-700">{row.transporter}</span> },
    { key: 'lrNo', label: 'LR No' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Delivered' ? 'success' : row.status === 'In Transit' ? 'info' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Track',
      render: () => <button className="text-violet-600 hover:text-violet-700 p-1"><Search className="w-4 h-4" /></button>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || item.distributor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch & LR Tracking"
        subtitle="Track distributor shipments and monitor proof of delivery."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Logistics Report</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order or distributor..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Pending POD', value: 'Pending POD' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No dispatch records found."
        />
      </TableCard>
    </div>
  );
}
