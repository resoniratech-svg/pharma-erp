import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
} from './components/shared';
import { type Column } from './components/shared';

interface LocationStock {
  id: string;
  productName: string;
  sku: string;
  warehouseA: number;
  warehouseB: number;
  warehouseC: number;
  totalQty: number;
}

const mockData: LocationStock[] = [
  { id: '1', productName: 'Amoxicillin 500mg', sku: 'PRD-001', warehouseA: 5400, warehouseB: 8000, warehouseC: 2000, totalQty: 15400 },
  { id: '2', productName: 'Paracetamol 650mg', sku: 'PRD-002', warehouseA: 850, warehouseB: 0, warehouseC: 0, totalQty: 850 },
  { id: '3', productName: 'Vitamin C 1000mg', sku: 'PRD-004', warehouseA: 1200, warehouseB: 2000, warehouseC: 2000, totalQty: 5200 },
];

export default function MultiLocationStock() {
  const [search, setSearch] = useState('');

  const columns: Column<LocationStock>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU' },
    { key: 'warehouseA', label: 'Central WH (A)', render: (row) => <span className={row.warehouseA === 0 ? 'text-slate-300' : ''}>{row.warehouseA}</span> },
    { key: 'warehouseB', label: 'North WH (B)', render: (row) => <span className={row.warehouseB === 0 ? 'text-slate-300' : ''}>{row.warehouseB}</span> },
    { key: 'warehouseC', label: 'South WH (C)', render: (row) => <span className={row.warehouseC === 0 ? 'text-slate-300' : ''}>{row.warehouseC}</span> },
    { key: 'totalQty', label: 'Total Stock', render: (row) => <span className="font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded">{row.totalQty}</span> },
  ];

  const filteredData = mockData.filter((item) => {
    return item.productName.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Multi-Location Inventory Management"
        subtitle="Track inventory levels across all registered warehouses and branches."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Matrix</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or SKU..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No location stock data found."
        />
      </TableCard>
    </div>
  );
}
