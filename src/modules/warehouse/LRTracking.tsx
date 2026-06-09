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

interface LRRecord {
  id: string;
  lrNumber: string;
  transporter: string;
  dispatchId: string;
  date: string;
  status: 'In Transit' | 'Delivered' | 'Pending';
}

const mockData: LRRecord[] = [
  { id: '1', lrNumber: 'LR-2026-4412', transporter: 'VRL Logistics', dispatchId: 'DSP-2026-001', date: '14-Oct-2026', status: 'In Transit' },
  { id: '2', lrNumber: 'LR-2026-4413', transporter: 'Gati Express', dispatchId: 'DSP-2026-002', date: '15-Oct-2026', status: 'Pending' },
];

export default function LRTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<LRRecord>[] = [
    { key: 'lrNumber', label: 'LR Number', render: (row) => <span className="font-semibold text-slate-900">{row.lrNumber}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'dispatchId', label: 'Dispatch ID', render: (row) => <span className="font-medium text-slate-800">{row.dispatchId}</span> },
    { key: 'date', label: 'Date' },
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
    const matchSearch = item.lrNumber.toLowerCase().includes(search.toLowerCase()) || item.transporter.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="LR Number Tracking"
        subtitle="Track Lorry Receipts (LR) and live shipment status."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Log</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search LR or transporter..." />
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
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No LR records found."
        />
      </TableCard>
    </div>
  );
}
