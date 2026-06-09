import { useState } from 'react';
import { Download, ShoppingCart } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface LowStock {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  suggestedQty: number;
  supplier: string;
}

const mockData: LowStock[] = [
  { id: '1', productName: 'Paracetamol 650mg', sku: 'PRD-002', currentStock: 850, reorderLevel: 2000, suggestedQty: 5000, supplier: 'HealthPlus Inc.' },
  { id: '2', productName: 'Cough Syrup 100ml', sku: 'PRD-003', currentStock: 0, reorderLevel: 500, suggestedQty: 2000, supplier: 'MediCare Supply' },
  { id: '3', productName: 'Bandages 10cm', sku: 'PRD-045', currentStock: 120, reorderLevel: 300, suggestedQty: 1000, supplier: 'Surgicals Ltd.' },
];

export default function LowStockAlerts() {
  const [search, setSearch] = useState('');

  const columns: Column<LowStock>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU' },
    { key: 'currentStock', label: 'Current Stock', render: (row) => <Badge variant="danger">{row.currentStock}</Badge> },
    { key: 'reorderLevel', label: 'Reorder Level', render: (row) => <span className="text-slate-500 font-medium">{row.reorderLevel}</span> },
    { key: 'suggestedQty', label: 'Suggested PO Qty', render: (row) => <span className="font-bold text-violet-700">{row.suggestedQty}</span> },
    { key: 'supplier', label: 'Primary Supplier' },
    {
      key: 'actions',
      label: '',
      render: () => (
        <ActionButton variant="secondary" icon={<ShoppingCart className="w-4 h-4" />}>
          Create PO
        </ActionButton>
      ),
    },
  ];

  const filteredData = mockData.filter((item) => {
    return item.productName.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Low Stock Alerts"
        subtitle="Items that have fallen below their minimum reorder levels."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Replenishment Report</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or SKU..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No low stock alerts. Inventory is healthy."
        />
      </TableCard>
    </div>
  );
}
