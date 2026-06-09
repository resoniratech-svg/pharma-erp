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

interface Inward {
  id: string;
  grnNo: string;
  date: string;
  supplier: string;
  itemsCount: number;
  totalAmount: string;
  status: 'Completed' | 'Pending QC';
}

const mockData: Inward[] = [
  { id: '1', grnNo: 'GRN-2026-001', date: '12-Oct-2026', supplier: 'PharmaCorp Ltd.', itemsCount: 5, totalAmount: '₹ 1,45,000', status: 'Completed' },
  { id: '2', grnNo: 'GRN-2026-002', date: '12-Oct-2026', supplier: 'HealthPlus Inc.', itemsCount: 2, totalAmount: '₹ 28,500', status: 'Pending QC' },
  { id: '3', grnNo: 'GRN-2026-003', date: '10-Oct-2026', supplier: 'MediCare Supply', itemsCount: 12, totalAmount: '₹ 4,12,000', status: 'Completed' },
];

export default function InwardStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Inward>[] = [
    { key: 'grnNo', label: 'GRN Number', render: (row) => <span className="font-semibold text-violet-700">{row.grnNo}</span> },
    { key: 'date', label: 'Inward Date' },
    { key: 'supplier', label: 'Supplier / Vendor', render: (row) => <span className="font-medium text-slate-800">{row.supplier}</span> },
    { key: 'itemsCount', label: 'Total Items', render: (row) => `${row.itemsCount} Items` },
    { key: 'totalAmount', label: 'Total Value' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.grnNo.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Inward Stock Management"
        subtitle="Manage Goods Receipt Notes and incoming inventory."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create GRN</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search GRN or supplier..." />
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
            { label: 'Pending QC', value: 'Pending QC' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No inward records found."
        />
      </TableCard>
    </div>
  );
}
