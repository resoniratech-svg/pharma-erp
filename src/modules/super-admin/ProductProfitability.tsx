import { useState } from 'react';
import { Package, Percent, TrendingUp } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface ProductProfit {
  id: string;
  product: string;
  category: string;
  cogs: string;
  revenue: string;
  margin: string;
  trend: 'Up' | 'Down';
}

const mockData: ProductProfit[] = [
  { id: '1', product: 'Paracetamol 500mg (Strip)', category: 'Analgesics', cogs: '₹ 8.50', revenue: '₹ 15.00', margin: '43.3%', trend: 'Up' },
  { id: '2', product: 'Amoxicillin 250mg', category: 'Antibiotics', cogs: '₹ 22.00', revenue: '₹ 45.00', margin: '51.1%', trend: 'Up' },
  { id: '3', product: 'Cough Syrup 100ml', category: 'Syrups', cogs: '₹ 35.00', revenue: '₹ 45.00', margin: '22.2%', trend: 'Down' },
];

export default function ProductProfitability() {
  const [search, setSearch] = useState('');

  const columns: Column<ProductProfit>[] = [
    { key: 'product', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.product}</span> },
    { key: 'category', label: 'Category' },
    { key: 'cogs', label: 'Avg. COGS (Unit)' },
    { key: 'revenue', label: 'Avg. Selling Price' },
    { key: 'margin', label: 'Gross Margin', render: (row) => <span className="font-bold text-violet-600">{row.margin}</span> },
    {
      key: 'trend',
      label: 'Trend',
      render: (row) => {
        const variant = row.trend === 'Up' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.trend}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => item.product.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Profitability Reports"
        subtitle="Analyze margins, cost of goods sold, and product-wise revenue performance."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Product Profitability' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Highest Margin Product" value="Amoxicillin 250mg" subtitle="Margin: 51.1%" icon={<TrendingUp className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Total Products Tracked" value="1,240" icon={<Package className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Average Portfolio Margin" value="38.5%" icon={<Percent className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
