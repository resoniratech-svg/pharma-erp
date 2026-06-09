import { useState } from 'react';
import { Plus, Download, Filter, ArrowRightLeft } from 'lucide-react';
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

interface Transfer {
  id: string;
  transferNo: string;
  date: string;
  fromWH: string;
  toWH: string;
  itemsCount: number;
  status: 'In Transit' | 'Completed';
}

const mockData: Transfer[] = [
  { id: '1', transferNo: 'TRF-2026-001', date: '14-Oct-2026', fromWH: 'Central WH (A)', toWH: 'North WH (B)', itemsCount: 4, status: 'In Transit' },
  { id: '2', transferNo: 'TRF-2026-002', date: '10-Oct-2026', fromWH: 'South WH (C)', toWH: 'Central WH (A)', itemsCount: 1, status: 'Completed' },
];

export default function WarehouseTransfer() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Transfer>[] = [
    { key: 'transferNo', label: 'Transfer ID', render: (row) => <span className="font-semibold text-slate-900">{row.transferNo}</span> },
    { key: 'date', label: 'Date' },
    {
      key: 'fromWH',
      label: 'Transfer Path',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-700">{row.fromWH}</span>
          <ArrowRightLeft className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-slate-700">{row.toWH}</span>
        </div>
      ),
    },
    { key: 'itemsCount', label: 'Total Items', render: (row) => `${row.itemsCount} Items` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.transferNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Warehouse Transfer Management"
        subtitle="Manage stock transfers between internal warehouses."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Initiate Transfer</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search transfer ID..." />
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
            { label: 'Completed', value: 'Completed' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No transfer records found."
        />
      </TableCard>
    </div>
  );
}
