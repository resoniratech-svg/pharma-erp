import { useState } from 'react';
import { Download, Filter, RefreshCcw } from 'lucide-react';
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

interface Reorder {
  id: string;
  retailer: string;
  product: string;
  lastOrderDate: string;
  suggestedQty: string;
  status: 'Pending Review' | 'Auto-Reordered' | 'Ignored';
}

const mockData: Reorder[] = [
  { id: '1', retailer: 'Apollo Pharmacy', product: 'Amoxicillin 500mg', lastOrderDate: '01-Oct-2026', suggestedQty: '500 Strips', status: 'Pending Review' },
  { id: '2', retailer: 'MedPlus Store', product: 'Paracetamol 650mg', lastOrderDate: '15-Sep-2026', suggestedQty: '1000 Strips', status: 'Auto-Reordered' },
  { id: '3', retailer: 'Wellness Medicos', product: 'Cough Syrup 100ml', lastOrderDate: '20-Aug-2026', suggestedQty: '50 Bottles', status: 'Ignored' },
];

export default function Reorders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Reorder>[] = [
    { key: 'retailer', label: 'Retailer', render: (row) => <span className="font-semibold text-slate-900">{row.retailer}</span> },
    { key: 'product', label: 'Product' },
    { key: 'lastOrderDate', label: 'Last Order' },
    { key: 'suggestedQty', label: 'Suggested Qty', render: (row) => <span className="font-medium text-slate-800">{row.suggestedQty}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Auto-Reordered' ? 'success' : row.status === 'Pending Review' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: (row) => row.status === 'Pending Review' ? <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><RefreshCcw className="w-4 h-4 mr-1" /> Reorder</ActionButton> : <span className="text-slate-300">-</span>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.retailer.toLowerCase().includes(search.toLowerCase()) || item.product.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Reorder Functionality"
        subtitle="AI-suggested reorders based on past purchase history and inventory levels."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export List</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search retailer or product..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending Review', value: 'Pending Review' },
            { label: 'Auto-Reordered', value: 'Auto-Reordered' },
            { label: 'Ignored', value: 'Ignored' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No reorder suggestions found."
        />
      </TableCard>
    </div>
  );
}
