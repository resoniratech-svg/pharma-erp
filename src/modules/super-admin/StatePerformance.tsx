import { useState, useRef, useEffect, useMemo } from 'react';
import { IndianRupee, MapPin, Users, ShoppingCart, Target, AlertCircle, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';
import { INDIAN_STATE_OPTIONS } from '../../constants/indianStates';
import { distributorMasterService, DistributorMasterRecord } from '../../services/distributorMasterService';
import { billingService, GSTInvoice } from '../../services/billingService';

interface StatePerformanceData {
  id: string;
  distributorName: string;
  state: string;
  revenue: number;
  orders: number;
  activeCustomers: number;
  outstanding: number;
  targetAchieved: number;
  status: 'On Track' | 'At Risk' | 'Behind';
}

export default function StatePerformance() {
  const [search, setSearch] = useState('');
  
  // Filter States
  const [finYear, setFinYear] = useState('');
  const [period, setPeriod] = useState('');
  const [zone, setZone] = useState('');
  const [stateFilter, setStateFilter] = useState(''); // Default to empty to show all or specific
  const [division, setDivision] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [distributors, setDistributors] = useState<DistributorMasterRecord[]>([]);
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const dists = await distributorMasterService.fetchFromApi();
      const invs = await billingService.loadInvoices();
      setDistributors(dists);
      setInvoices(invs);
    };
    loadData();
  }, []);

  // Compute actual data
  const performanceData = useMemo(() => {
    const dataMap = new Map<string, StatePerformanceData>();

    // Initialize with distributors
    distributors.forEach(d => {
      if (d.status === 'Active') {
        dataMap.set(d.name, {
          id: d.id,
          distributorName: d.name,
          state: d.state || 'Unknown',
          revenue: 0,
          orders: 0,
          activeCustomers: 1, // Distributor itself is a customer
          outstanding: 0,
          targetAchieved: Math.floor(Math.random() * 40) + 70, // Mocked target achievement for demo
          status: 'On Track'
        });
      }
    });

    // Aggregate invoices
    invoices.forEach(inv => {
      if (inv.status !== 'Cancelled') {
        const d = dataMap.get(inv.customerName);
        if (d) {
          d.revenue += inv.grandTotal;
          d.orders += 1;
          if (inv.status === 'Pending') {
            d.outstanding += inv.grandTotal;
          }
        }
      }
    });

    return Array.from(dataMap.values()).map(d => {
      d.status = d.targetAchieved >= 90 ? 'On Track' : d.targetAchieved >= 75 ? 'At Risk' : 'Behind';
      return d;
    });
  }, [distributors, invoices]);

  // Dynamically generate state options based on available data
  const dynamicStateOptions = useMemo(() => {
    const states = new Set(distributors.map(d => d.state).filter(Boolean));
    const options = Array.from(states).map(s => ({ label: s as string, value: s as string }));
    return options.length > 0 ? options : INDIAN_STATE_OPTIONS;
  }, [distributors]);

  const columns: Column<StatePerformanceData>[] = [
    { key: 'distributorName', label: 'Distributor Name', render: (row) => <span className="font-semibold text-slate-900">{row.distributorName}</span> },
    { key: 'state', label: 'State', render: (row) => <span className="text-slate-700">{row.state}</span> },
    { key: 'revenue', label: 'Revenue Generated', render: (row) => <span className="font-bold text-slate-700">₹ {row.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span> },
    { key: 'orders', label: 'Total Orders' },
    { key: 'outstanding', label: 'Outstanding Amount', render: (row) => <span className="text-rose-600 font-medium">₹ {row.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span> },
    { key: 'targetAchieved', label: 'Target Achievement %', render: (row) => <span className="font-medium text-slate-600">{row.targetAchieved}%</span> },
    {
      key: 'status',
      label: 'Performance Status',
      render: (row) => {
        const variant = row.status === 'On Track' ? 'success' : row.status === 'At Risk' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = performanceData.filter((item) => {
    let match = true;
    if (search) match = match && item.distributorName.toLowerCase().includes(search.toLowerCase());
    if (stateFilter) match = match && item.state === stateFilter;
    return match;
  });

  // Calculate totals for KPI cards
  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = filteredData.reduce((sum, item) => sum + item.orders, 0);
  const totalActiveDistributors = filteredData.length;
  const totalOutstanding = filteredData.reduce((sum, item) => sum + item.outstanding, 0);
  
  // Format currency helpers
  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      stateFilter && `State: ${stateFilter}`
    ].filter(Boolean).join(' | ');

    return [
      ['State Performance Report'],
      ['Generated On:', timestamp],
      ['Filters Applied:', activeFilters || 'None'],
      [''],
      ['Distributor Name', 'State', 'Revenue Generated', 'Total Orders', 'Outstanding Amount', 'Target Achievement %', 'Status'],
      ...filteredData.map(item => [
        item.distributorName,
        item.state,
        item.revenue,
        item.orders,
        item.outstanding,
        item.targetAchieved,
        item.status
      ])
    ];
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `State_Performance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'State Performance');
    XLSX.writeFile(wb, `State_Performance_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="State Performance Reports" 
        subtitle="Monitor revenue and sales performance across different regions"
        action={
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 bg-[#163c78] text-white px-4 py-2 rounded-xl hover:bg-[#0c1f3d] transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left mt-1"
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search distributor..." />
          <SelectFilter
            value={stateFilter} onChange={setStateFilter}
            options={dynamicStateOptions}
            placeholder="All States"
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="State Revenue" value={formatCurrency(totalRevenue)} icon={<IndianRupee className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Total Orders" value={totalOrders.toString()} icon={<ShoppingCart className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Active Distributors" value={totalActiveDistributors.toString()} icon={<MapPin className="w-6 h-6" />} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
        <SummaryCard title="Outstanding Receivables" value={formatCurrency(totalOutstanding)} icon={<AlertCircle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      {/* Main Table with hidden scrollbar */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-4 px-1">Performance Details</h3>
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
