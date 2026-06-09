import { useState } from 'react';
import { PackageSearch, AlertTriangle, Box } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface StockStatus {
  id: string;
  sku: string;
  product: string;
  warehouse: string;
  qty: number;
  status: 'In Stock' | 'Low Stock' | 'Near Expiry' | 'Dead Stock';
}

const mockData: StockStatus[] = [
  { id: '1', sku: 'PR-1001', product: 'Paracetamol 500mg', warehouse: 'Mumbai HQ', qty: 15400, status: 'In Stock' },
  { id: '2', sku: 'AM-2022', product: 'Amoxicillin 250mg', warehouse: 'Pune Depot', qty: 120, status: 'Low Stock' },
  { id: '3', sku: 'VC-3003', product: 'Vitamin C Syrup', warehouse: 'Delhi NCR', qty: 450, status: 'Near Expiry' },
  { id: '4', sku: 'CO-4004', product: 'Cough Syrup (Old Batch)', warehouse: 'Mumbai HQ', qty: 50, status: 'Dead Stock' },
];

export default function LiveStockMonitoring() {
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const columns: Column<StockStatus>[] = [
    { key: 'sku', label: 'SKU', render: (row) => <span className="font-mono text-sm text-slate-500">{row.sku}</span> },
    { key: 'product', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.product}</span> },
    { key: 'warehouse', label: 'Location' },
    { key: 'qty', label: 'Quantity', render: (row) => <span className="font-bold text-slate-700">{row.qty}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'In Stock' ? 'success' : row.status === 'Low Stock' ? 'warning' : row.status === 'Near Expiry' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.product.toLowerCase().includes(search.toLowerCase());
    const matchLocation = warehouseFilter ? item.warehouse === warehouseFilter : true;
    return matchSearch && matchLocation;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Live Stock Monitoring"
        subtitle="Real-time inventory visibility across all warehouses and depots."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Live Stock' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Units" value="1.2M" icon={<Box className="w-5 h-5" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Low Stock Items" value="45" icon={<PackageSearch className="w-5 h-5" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Near Expiry" value="12" icon={<AlertTriangle className="w-5 h-5" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <SummaryCard title="Dead Stock Val." value="₹ 4.2L" icon={<AlertTriangle className="w-5 h-5" />} colorClass="text-slate-600" bgClass="bg-slate-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={warehouseFilter}
          onChange={setWarehouseFilter}
          options={[
            { label: 'Mumbai HQ', value: 'Mumbai HQ' },
            { label: 'Pune Depot', value: 'Pune Depot' },
            { label: 'Delhi NCR', value: 'Delhi NCR' },
          ]}
          placeholder="All Locations"
        />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
