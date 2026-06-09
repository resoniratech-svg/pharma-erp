import { useState } from 'react';
import { 
  TrendingUp, IndianRupee, CreditCard, PieChart, 
  ShoppingCart, ClipboardList, Box, Calculator, Users, Truck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import {
  PageHeader, FilterBar, TableCard, DataTable, 
  ExportPDFButton, ExportExcelButton, SummaryCard, CategoryCard, type Column, Badge
} from './components/shared';

const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
  { name: 'Jul', revenue: 7000 },
  { name: 'Aug', revenue: 8500 },
];

const statePerformanceData = [
  { state: 'Maharashtra', sales: 120 },
  { state: 'Gujarat', sales: 98 },
  { state: 'Karnataka', sales: 86 },
  { state: 'Delhi', sales: 74 },
  { state: 'Tamil Nadu', sales: 65 },
  { state: 'Telangana', sales: 50 },
];

interface ProductProfitability {
  id: string;
  product: string;
  revenue: string;
  profit: string;
  margin: string;
  status: 'High' | 'Medium' | 'Low';
}

const topProducts: ProductProfitability[] = [
  { id: '1', product: 'Azithromycin 500mg', revenue: '₹ 12,45,000', profit: '₹ 4,15,000', margin: '33%', status: 'High' },
  { id: '2', product: 'Paracetamol 650mg', revenue: '₹ 8,30,000', profit: '₹ 1,24,500', margin: '15%', status: 'Low' },
  { id: '3', product: 'Amoxicillin + Clavulanate', revenue: '₹ 15,20,000', profit: '₹ 4,56,000', margin: '30%', status: 'High' },
  { id: '4', product: 'Pantoprazole 40mg', revenue: '₹ 5,10,000', profit: '₹ 1,02,000', margin: '20%', status: 'Medium' },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('This Month');

  const columns: Column<ProductProfitability>[] = [
    { key: 'product', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.product}</span> },
    { key: 'revenue', label: 'Revenue', render: (row) => <span className="font-bold text-slate-700">{row.revenue}</span> },
    { key: 'profit', label: 'Net Profit', render: (row) => <span className="font-medium text-emerald-600">{row.profit}</span> },
    { key: 'margin', label: 'Profit Margin' },
    { 
      key: 'status', 
      label: 'Margin Status', 
      render: (row) => {
        const variant = row.status === 'High' ? 'success' : row.status === 'Medium' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status} Margin</Badge>;
      } 
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Business intelligence and performance reporting."
        breadcrumb={[{ label: 'Reports' }, { label: 'Overview' }]}
        actions={
          <>
            <ExportPDFButton />
            <ExportExcelButton />
          </>
        }
      />

      {/* Filter Bar */}
      <FilterBar>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Date Range:</span>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
      </FilterBar>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Total Revenue" value="₹ 4.2 Cr" subtitle="+12% vs last month" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Monthly Growth" value="+14.5%" subtitle="Strong upward trend" icon={<TrendingUp className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Product Profitability" value="24.8%" subtitle="Average margin" icon={<PieChart className="w-6 h-6" />} colorClass="text-cyan-600" bgClass="bg-cyan-100" />
        <SummaryCard title="Outstanding Payments" value="₹ 1.8 Cr" subtitle="Requires follow up" icon={<CreditCard className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      {/* Report Categories */}
      <h2 className="text-lg font-bold text-slate-800 mb-4">Report Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <CategoryCard title="Sales Reports" description="Invoices, retail sales, order history" icon={<ShoppingCart className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <CategoryCard title="Inventory Reports" description="Stock levels, expiry tracking, dead stock" icon={<ClipboardList className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <CategoryCard title="Warehouse Reports" description="Dispatch tracking, delivery logs" icon={<Box className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <CategoryCard title="Finance Reports" description="P&L, ledgers, outstanding, GST" icon={<Calculator className="w-6 h-6" />} colorClass="text-cyan-600" bgClass="bg-cyan-100" />
        <CategoryCard title="CRM Reports" description="Leads, follow-ups, doctor coverage" icon={<Users className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <CategoryCard title="Dispatch Reports" description="Transport, LR tracking, shipping" icon={<Truck className="w-6 h-6" />} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">State-wise Performance (Lakhs)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statePerformanceData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis type="category" dataKey="state" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="sales" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <h2 className="text-lg font-bold text-slate-800 mb-4">Top Performing Products</h2>
      <TableCard>
        <DataTable columns={columns} data={topProducts} />
      </TableCard>
    </div>
  );
}
