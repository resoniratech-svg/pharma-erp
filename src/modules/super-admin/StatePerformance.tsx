import { useState, useRef, useEffect } from 'react';
import { IndianRupee, MapPin, Users, ShoppingCart, Target, AlertCircle, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
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

interface Territory {
  id: string;
  district: string;
  salesRep: string;
  revenue: string;
  orders: number;
  activeCustomers: number;
  outstanding: string;
  targetAchieved: number;
  status: 'On Track' | 'At Risk' | 'Behind';
}

const mockTerritories: Territory[] = [
  { id: '1', district: 'Mumbai Metro', salesRep: 'Rajesh K.', revenue: '₹ 15.2 Cr', orders: 4200, activeCustomers: 410, outstanding: '₹ 1.2 Cr', targetAchieved: 110, status: 'On Track' },
  { id: '2', district: 'Pune District', salesRep: 'Amit S.', revenue: '₹ 8.1 Cr', orders: 2500, activeCustomers: 280, outstanding: '₹ 85 L', targetAchieved: 95, status: 'On Track' },
  { id: '3', district: 'Nagpur', salesRep: 'Vikram P.', revenue: '₹ 4.4 Cr', orders: 1200, activeCustomers: 150, outstanding: '₹ 45 L', targetAchieved: 75, status: 'At Risk' },
  { id: '4', district: 'Nashik', salesRep: 'Sanjay M.', revenue: '₹ 2.2 Cr', orders: 850, activeCustomers: 90, outstanding: '₹ 32 L', targetAchieved: 45, status: 'Behind' },
  { id: '5', district: 'Aurangabad', salesRep: 'Pooja R.', revenue: '₹ 1.8 Cr', orders: 620, activeCustomers: 75, outstanding: '₹ 28 L', targetAchieved: 82, status: 'At Risk' },
];

export default function StatePerformance() {
  const [search, setSearch] = useState('');
  
  // Filter States
  const [finYear, setFinYear] = useState('');
  const [period, setPeriod] = useState('');
  const [zone, setZone] = useState('');
  const [stateFilter, setStateFilter] = useState('Maharashtra');
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

  const columns: Column<Territory>[] = [
    { key: 'district', label: 'Territory / District', render: (row) => <span className="font-semibold text-slate-900">{row.district}</span> },
    { key: 'salesRep', label: 'Territory Manager / Lead MR', render: (row) => <span className="text-slate-700">{row.salesRep}</span> },
    { key: 'revenue', label: 'Revenue Generated', render: (row) => <span className="font-bold text-slate-700">{row.revenue}</span> },
    { key: 'orders', label: 'Total Orders' },
    { key: 'activeCustomers', label: 'Active Customers' },
    { key: 'outstanding', label: 'Outstanding Amount', render: (row) => <span className="text-rose-600 font-medium">{row.outstanding}</span> },
    { key: 'targetAchieved', label: 'Target Achievement %', render: (row) => <span className="font-medium text-slate-600">{row.targetAchieved}%</span> },
    {
      key: 'status',
      label: 'Performance Status',
      render: (row) => {
        const variant = row.status === 'On Track' ? 'success' : row.status === 'At Risk' ? 'warning' : 'danger';
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

  const filteredData = mockTerritories.filter((item) => {
    let match = true;
    if (search) match = match && item.district.toLowerCase().includes(search.toLowerCase());
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
      ['State Performance Report - Territory Performance'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Territory / District', 'Territory Manager / Lead MR', 'Revenue Generated', 'Total Orders', 'Active Customers', 'Outstanding Amount', 'Target Achievement %', 'Performance Status'];
    const tableRows = filteredData.map(row => [
      row.district,
      row.salesRep,
      row.revenue,
      row.orders.toString(),
      row.activeCustomers.toString(),
      row.outstanding,
      `${row.targetAchieved}%`,
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
    link.download = `State_Performance_Report_${dateStr}.csv`;
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
    XLSX.utils.book_append_sheet(wb, ws, "Performance Report");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `State_Performance_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="State Performance Reports"
        subtitle="Deep dive into territory-wise metrics and MR targets for a selected state."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'State Performance' }]}
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
        <SummaryCard title="State Revenue" value="₹ 31.7 Cr" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Total Orders" value="9,370" icon={<ShoppingCart className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Active Customers" value="1,005" icon={<Users className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Active Territories" value="36" icon={<MapPin className="w-6 h-6" />} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
        <SummaryCard title="Target Achievement %" value="92%" icon={<Target className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Outstanding Receivables" value="₹ 3.1 Cr" icon={<AlertCircle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search district..." />
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
            options={[
              { label: 'Maharashtra', value: 'Maharashtra' },
              { label: 'Gujarat', value: 'Gujarat' },
              { label: 'Karnataka', value: 'Karnataka' },
            ]}
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

      {/* Main Table with hidden scrollbar */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-4 px-1">Territory Performance</h3>
        <TableCard>
          <div className="state-performance-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .state-performance-table-container .overflow-x-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .state-performance-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}
