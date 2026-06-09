import { useState } from 'react';
import { Download, Filter, Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
} from './components/shared';
import { type Column } from './components/shared';

interface StockItem {
  id: string;
  productName: string;
  category: string;
  qty: number;
  value: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const mockData: StockItem[] = [
  { id: '1', productName: 'Amoxicillin 500mg', category: 'Antibiotics', qty: 15400, value: '₹ 15,40,000', status: 'In Stock' },
  { id: '2', productName: 'Paracetamol 650mg', category: 'Analgesics', qty: 850, value: '₹ 42,500', status: 'Low Stock' },
  { id: '3', productName: 'Cough Syrup 100ml', category: 'Respiratory', qty: 0, value: '₹ 0', status: 'Out of Stock' },
  { id: '4', productName: 'Vitamin C 1000mg', category: 'Vitamins', qty: 5200, value: '₹ 6,24,000', status: 'In Stock' },
];

export default function InventoryOverview() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<StockItem>[] = [
    { key: 'productName', label: 'Product', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'category', label: 'Category' },
    { key: 'qty', label: 'Total Qty', render: (row) => <span className="font-mono text-slate-700">{row.qty}</span> },
    { key: 'value', label: 'Est. Value', render: (row) => <span className="font-bold text-slate-800">{row.value}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'In Stock' ? 'success' : row.status === 'Low Stock' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Inventory Overview"
        subtitle="Global stock valuation and real-time inventory levels."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Stock Value"
          value="₹ 4.2 Cr"
          subtitle="Across all warehouses"
          icon={<Package className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Items Low in Stock"
          value="24"
          subtitle="Requires reordering"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Stock Inward (This Month)"
          value="15.2k"
          subtitle="Units received"
          icon={<ArrowDownToLine className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Stock Outward (This Month)"
          value="8.4k"
          subtitle="Units dispatched"
          icon={<ArrowUpFromLine className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'In Stock', value: 'In Stock' },
            { label: 'Low Stock', value: 'Low Stock' },
            { label: 'Out of Stock', value: 'Out of Stock' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No stock items found."
        />
      </TableCard>
    </div>
  );
}
