import { useState } from 'react';
import { IndianRupee, TrendingUp, ShoppingCart } from 'lucide-react';
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

interface StateSales {
  id: string;
  state: string;
  revenue: string;
  orders: number;
  growth: string;
  status: 'High' | 'Medium' | 'Low';
}

const mockData: StateSales[] = [
  { id: '1', state: 'Maharashtra', revenue: '₹ 45,20,000', orders: 1250, growth: '+12.5%', status: 'High' },
  { id: '2', state: 'Gujarat', revenue: '₹ 32,15,000', orders: 980, growth: '+8.2%', status: 'High' },
  { id: '3', state: 'Karnataka', revenue: '₹ 28,40,000', orders: 850, growth: '+5.4%', status: 'Medium' },
  { id: '4', state: 'Delhi NCR', revenue: '₹ 15,20,000', orders: 420, growth: '-2.1%', status: 'Low' },
];

export default function AllIndiaSales() {
  const [search, setSearch] = useState('');

  const columns: Column<StateSales>[] = [
    { key: 'state', label: 'State / Region', render: (row) => <span className="font-semibold text-slate-900">{row.state}</span> },
    { key: 'revenue', label: 'Total Revenue', render: (row) => <span className="font-bold text-slate-700">{row.revenue}</span> },
    { key: 'orders', label: 'Total Orders' },
    { key: 'growth', label: 'YoY Growth', render: (row) => <span className={row.growth.startsWith('+') ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{row.growth}</span> },
    {
      key: 'status',
      label: 'Performance',
      render: (row) => {
        const variant = row.status === 'High' ? 'success' : row.status === 'Medium' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => item.state.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="All India Sales Dashboard"
        subtitle="Macro-level view of nationwide sales performance and revenue trends."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'All India Sales' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Total National Revenue" value="₹ 12.5 Cr" subtitle="+15% from last month" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Total Orders" value="45,230" subtitle="Across 28 states" icon={<ShoppingCart className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Avg. Growth Rate" value="+8.4%" subtitle="Top performer: Maharashtra" icon={<TrendingUp className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
      </div>

      <div className="mb-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Sales Trend (Last 6 Months)</h3>
        <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 border-dashed">
          <span className="text-slate-400 font-medium">[ Analytics Chart Placeholder ]</span>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search state..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
