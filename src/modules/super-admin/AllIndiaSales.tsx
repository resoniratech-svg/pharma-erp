import { useState, useRef, useEffect } from 'react';
import { IndianRupee, TrendingUp, ShoppingCart, Users, AlertCircle, MapPin, Eye, CheckCircle2, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

interface StateSales {
  id: string;
  state: string;
  revenue: string;
  revenueVal: number;
  orders: number;
  activeCustomers: number;
  outstanding: string;
  growth: string;
  status: 'High' | 'Medium' | 'Low';
}

const mockStateSales: StateSales[] = [
  { id: '1', state: 'Maharashtra', revenue: '₹ 45.2 Cr', revenueVal: 45.2, orders: 12500, activeCustomers: 1205, outstanding: '₹ 4.1 Cr', growth: '+12.5%', status: 'High' },
  { id: '2', state: 'Gujarat', revenue: '₹ 32.1 Cr', revenueVal: 32.1, orders: 9800, activeCustomers: 850, outstanding: '₹ 3.2 Cr', growth: '+8.2%', status: 'High' },
  { id: '3', state: 'Karnataka', revenue: '₹ 28.4 Cr', revenueVal: 28.4, orders: 8500, activeCustomers: 720, outstanding: '₹ 2.8 Cr', growth: '+5.4%', status: 'Medium' },
  { id: '4', state: 'Tamil Nadu', revenue: '₹ 24.5 Cr', revenueVal: 24.5, orders: 7200, activeCustomers: 640, outstanding: '₹ 2.1 Cr', growth: '+4.1%', status: 'Medium' },
  { id: '5', state: 'Delhi NCR', revenue: '₹ 15.2 Cr', revenueVal: 15.2, orders: 4200, activeCustomers: 410, outstanding: '₹ 1.5 Cr', growth: '-2.1%', status: 'Low' },
  { id: '6', state: 'Uttar Pradesh', revenue: '₹ 12.8 Cr', revenueVal: 12.8, orders: 3800, activeCustomers: 350, outstanding: '₹ 2.2 Cr', growth: '-4.5%', status: 'Low' },
];

const mockTrendData = [
  { month: 'Apr', target: 20, revenue: 22 },
  { month: 'May', target: 22, revenue: 25 },
  { month: 'Jun', target: 24, revenue: 23 },
  { month: 'Jul', target: 25, revenue: 28 },
  { month: 'Aug', target: 26, revenue: 29 },
  { month: 'Sep', target: 28, revenue: 32 },
];

export default function AllIndiaSales() {
  const [search, setSearch] = useState('');
  
  // Filter States
  const [finYear, setFinYear] = useState('');
  const [period, setPeriod] = useState('');
  const [zone, setZone] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [division, setDivision] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns: Column<StateSales>[] = [
    { key: 'state', label: 'State / Region', render: (row) => <span className="font-semibold text-slate-900">{row.state}</span> },
    { key: 'revenue', label: 'Total Revenue', render: (row) => <span className="font-bold text-slate-700">{row.revenue}</span> },
    { key: 'orders', label: 'Total Orders' },
    { key: 'activeCustomers', label: 'Active Customers' },
    { key: 'outstanding', label: 'Outstanding Amount', render: (row) => <span className="text-rose-600 font-medium">{row.outstanding}</span> },
    { key: 'growth', label: 'Growth %', render: (row) => <span className={row.growth.startsWith('+') ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{row.growth}</span> },
    {
      key: 'status',
      label: 'Performance',
      render: (row) => {
        const variant = row.status === 'High' ? 'success' : row.status === 'Medium' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: () => (
        <ActionButton variant="ghost">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">View</span>
        </ActionButton>
      )
    }
  ];

  const filteredData = mockStateSales.filter((item) => {
    let match = true;
    if (search) match = match && item.state.toLowerCase().includes(search.toLowerCase());
    if (stateFilter) match = match && item.state === stateFilter;
    if (zone && zone !== '') {
      const zoneMapping: Record<string, string[]> = {
        'North': ['Delhi NCR', 'Uttar Pradesh'],
        'South': ['Karnataka', 'Tamil Nadu'],
        'East': [],
        'West': ['Maharashtra', 'Gujarat']
      };
      if (!zoneMapping[zone]?.includes(item.state)) match = false;
    }
    return match;
  });

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      finYear && `Financial Year: ${finYear}`,
      period && `Period: ${period}`,
      zone && `Zone: ${zone}`,
      stateFilter && `State: ${stateFilter}`,
      division && `Division: ${division}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['All India Sales Dashboard - State Performance Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['State / Region', 'Total Revenue', 'Total Orders', 'Active Customers', 'Outstanding Amount', 'Growth %', 'Performance'];
    const tableRows = filteredData.map(row => [
      row.state,
      row.revenue,
      row.orders.toString(),
      row.activeCustomers.toString(),
      row.outstanding,
      row.growth,
      row.status
    ]);

    return { headerRows, tableHeaders, tableRows };
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }
    
    const { headerRows, tableHeaders, tableRows } = getExportData();
    const csvContent = [
      ...headerRows.map(row => `"${row.join('","')}"`),
      `"${tableHeaders.join('","')}"`,
      ...tableRows.map(row => `"${row.join('","')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = URL.createObjectURL(blob);
    link.download = `All_India_Sales_Report_${dateStr}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }

    const { headerRows, tableHeaders, tableRows } = getExportData();
    const wsData = [
      ...headerRows,
      tableHeaders,
      ...tableRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `All_India_Sales_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  const topStates = [...mockStateSales].sort((a, b) => b.revenueVal - a.revenueVal).slice(0, 5);
  const attentionStates = mockStateSales.filter(s => s.status === 'Low' || s.growth.startsWith('-'));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="All India Sales Dashboard"
        subtitle="Executive reporting and macro-level view of nationwide sales performance."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'All India Sales' }]}
        actions={
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel (.xlsx)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Total Sales Revenue" value="₹ 158.2 Cr" subtitle="Source: Sales Invoices / Billing" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Total Orders" value="46,000" subtitle="Source: Orders Module" icon={<ShoppingCart className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Sales Growth %" value="+8.5%" subtitle="Current vs Previous Period" icon={<TrendingUp className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Active Customers" value="4,175" subtitle="Purchased in selected period" icon={<Users className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Outstanding Receivables" value="₹ 15.9 Cr" subtitle="Source: Outstanding Tracking" icon={<AlertCircle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <SummaryCard title="Top Performing State" value="Maharashtra" subtitle="Highest revenue generating state" icon={<MapPin className="w-6 h-6" />} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search state..." />
          <SelectFilter
            value={finYear} onChange={setFinYear}
            options={[
              { label: '2025-2026', value: '25-26' },
              { label: '2026-2027', value: '26-27' },
            ]}
            placeholder="Financial Year"
          />
          <SelectFilter
            value={period} onChange={setPeriod}
            options={[
              { label: 'Monthly', value: 'Monthly' },
              { label: 'Quarterly', value: 'Quarterly' },
              { label: 'Yearly', value: 'Yearly' },
            ]}
            placeholder="Period"
          />
          <SelectFilter
            value={zone} onChange={setZone}
            options={[
              { label: 'North Zone', value: 'North' },
              { label: 'South Zone', value: 'South' },
              { label: 'East Zone', value: 'East' },
              { label: 'West Zone', value: 'West' },
            ]}
            placeholder="Zone"
          />
          <SelectFilter
            value={stateFilter} onChange={setStateFilter}
            options={mockStateSales.map(s => ({ label: s.state, value: s.state }))}
            placeholder="State"
          />
          <SelectFilter
            value={division} onChange={setDivision}
            options={[
              { label: 'Pharma', value: 'Pharma' },
              { label: 'OTC', value: 'OTC' },
              { label: 'Surgical', value: 'Surgical' },
            ]}
            placeholder="Division"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="mb-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Revenue vs Target (Cr)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`₹ ${value} Cr`, '']}
              />
              <Area type="monotone" dataKey="target" name="Target" stroke="#94a3b8" fillOpacity={1} fill="url(#colorTarget)" strokeWidth={2} strokeDasharray="5 5" />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Table */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-4 px-1">State Performance</h3>
        <TableCard>
          <DataTable columns={columns} data={filteredData} />
        </TableCard>
      </div>

      {/* Bottom Grid: Top 5 & Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 States */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Top 5 States by Revenue
          </h3>
          <div className="space-y-4">
            {topStates.map((state, i) => (
              <div key={state.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{state.state}</p>
                    <p className="text-xs text-slate-500">{state.activeCustomers} Active Customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">{state.revenue}</p>
                  <p className="text-xs text-emerald-600 font-medium">{state.growth} Growth</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attention Required */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            Attention Required
          </h3>
          <div className="space-y-4">
            {attentionStates.map((state) => (
              <div key={state.id} className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center font-bold text-sm">
                    !
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{state.state}</p>
                    <p className="text-xs text-rose-600 font-medium">{state.status} Performance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">{state.revenue}</p>
                  <p className="text-xs text-rose-600 font-medium">{state.growth} Growth</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
