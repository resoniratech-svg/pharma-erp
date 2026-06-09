import { useState } from 'react';
import { Download, Filter, ShoppingCart } from 'lucide-react';
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

interface Product {
  id: string;
  name: string;
  category: string;
  mrp: string;
  ptr: string;
  stock: string;
  status: 'Available' | 'Out of Stock';
}

const mockData: Product[] = [
  { id: '1', name: 'Amoxicillin 500mg', category: 'Antibiotics', mrp: '₹ 110.00', ptr: '₹ 85.50', stock: '5,000 Strips', status: 'Available' },
  { id: '2', name: 'Paracetamol 650mg', category: 'Analgesics', mrp: '₹ 30.00', ptr: '₹ 22.00', stock: '12,000 Strips', status: 'Available' },
  { id: '3', name: 'Cough Syrup 100ml', category: 'Respiratory', mrp: '₹ 120.00', ptr: '₹ 95.00', stock: '0 Bottles', status: 'Out of Stock' },
];

export default function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Product>[] = [
    { key: 'name', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'category', label: 'Category' },
    { key: 'mrp', label: 'MRP' },
    { key: 'ptr', label: 'PTR (Retailer Price)', render: (row) => <span className="font-bold text-violet-700">{row.ptr}</span> },
    { key: 'stock', label: 'Availability', render: (row) => <span className="font-medium text-slate-800">{row.stock}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Available' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><ShoppingCart className="w-4 h-4" /></ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Browsing"
        subtitle="Browse available products and PTR pricing for retailers."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Download Price List</ActionButton>
        }
      />

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
            { label: 'Available', value: 'Available' },
            { label: 'Out of Stock', value: 'Out of Stock' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No products found."
        />
      </TableCard>
    </div>
  );
}
