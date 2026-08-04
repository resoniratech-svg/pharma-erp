import React, { useState, useMemo } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, SummaryCard, ActionButton, Badge } from './components/shared';
import { MapPin, TrendingUp, Download, Eye, Target, Users, Calendar, Activity } from 'lucide-react';
import { exportToCSV } from '../../utils/exportUtils';
import { Modal } from '../../components/ui/Modal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';

// Mock Data representing aggregated executive analytics
const MOCK_STATE_DATA = [
  {
    id: 'ST001',
    state: 'Maharashtra',
    rsm: 'Arun Kumar',
    region: 'West',
    target: 150000000,
    achievement: 135000000,
    orders: 4520,
    docVisits: 12500,
    chemistVisits: 8200,
    attendancePct: 92,
    activeAsms: 8,
    activeMrs: 45,
    topProduct: 'Azithromycin 500mg',
    lowProduct: 'Vitamin D3 Drops',
    topDistrict: 'Mumbai',
    lowDistrict: 'Dhule'
  },
  {
    id: 'ST002',
    state: 'Gujarat',
    rsm: 'Rajesh Singh',
    region: 'West',
    target: 120000000,
    achievement: 95000000,
    orders: 3100,
    docVisits: 9800,
    chemistVisits: 6100,
    attendancePct: 88,
    activeAsms: 6,
    activeMrs: 35,
    topProduct: 'Paracetamol 650mg',
    lowProduct: 'Cough Syrup 100ml',
    topDistrict: 'Ahmedabad',
    lowDistrict: 'Amreli'
  },
  {
    id: 'ST003',
    state: 'Karnataka',
    rsm: 'Priya Sharma',
    region: 'South',
    target: 180000000,
    achievement: 195000000,
    orders: 5800,
    docVisits: 15200,
    chemistVisits: 9400,
    attendancePct: 95,
    activeAsms: 10,
    activeMrs: 55,
    topProduct: 'Amoxicillin 250mg',
    lowProduct: 'Antacid Gel',
    topDistrict: 'Bangalore Urban',
    lowDistrict: 'Koppal'
  },
  {
    id: 'ST004',
    state: 'Tamil Nadu',
    rsm: 'Vikram Das',
    region: 'South',
    target: 100000000,
    achievement: 45000000,
    orders: 1200,
    docVisits: 5100,
    chemistVisits: 3200,
    attendancePct: 78,
    activeAsms: 5,
    activeMrs: 25,
    topProduct: 'Cefixime 200mg',
    lowProduct: 'Pain Relief Spray',
    topDistrict: 'Chennai',
    lowDistrict: 'Ariyalur'
  }
];

const MONTHLY_TREND = [
  { month: 'Apr', sales: 42000000 },
  { month: 'May', sales: 55000000 },
  { month: 'Jun', sales: 48000000 },
  { month: 'Jul', sales: 61000000 },
  { month: 'Aug', sales: 59000000 },
  { month: 'Sep', sales: 75000000 },
];

export default function StatePerformance() {
  const [search, setSearch] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<any>(null);

  // Filters state
  const [filters, setFilters] = useState({
    financialYear: '2026-27',
    planningPeriod: 'Annual',
    planningPeriodSubValue: 'Q1',
    region: 'All',
    state: 'All',
    rsm: 'All'
  });

  // Extract unique lists for dynamic dropdowns based on existing data
  const uniqueStates = useMemo(() => Array.from(new Set(MOCK_STATE_DATA.map(d => d.state))).sort(), []);
  const uniqueRSMs = useMemo(() => Array.from(new Set(MOCK_STATE_DATA.map(d => d.rsm))).sort(), []);
  const uniqueRegions = useMemo(() => Array.from(new Set(MOCK_STATE_DATA.map(d => d.region))).sort(), []);

  const filteredData = MOCK_STATE_DATA.filter(row => {
    const matchesSearch = row.state.toLowerCase().includes(search.toLowerCase()) || row.rsm.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = filters.region === 'All' || row.region === filters.region;
    const matchesState = filters.state === 'All' || row.state === filters.state;
    const matchesRSM = filters.rsm === 'All' || row.rsm === filters.rsm;
    return matchesSearch && matchesRegion && matchesState && matchesRSM;
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateStatus = (pct: number) => {
    if (pct >= 100) return { label: 'Excellent', color: 'success' };
    if (pct >= 80) return { label: 'Good', color: 'primary' };
    if (pct >= 60) return { label: 'Average', color: 'warning' };
    return { label: 'Needs Attention', color: 'error' };
  };

  // Summary Calculations
  const totalStates = filteredData.length;
  let highestPct = 0;
  let topState = 'N/A';
  let totalTarget = 0;
  let totalAchievement = 0;
  let totalAttendance = 0;

  filteredData.forEach(row => {
    const pct = (row.achievement / row.target) * 100;
    if (pct > highestPct) {
      highestPct = pct;
      topState = row.state;
    }
    totalTarget += row.target;
    totalAchievement += row.achievement;
    totalAttendance += row.attendancePct;
  });

  const overallAchievementPct = totalTarget > 0 ? (totalAchievement / totalTarget) * 100 : 0;
  const avgAttendance = totalStates > 0 ? totalAttendance / totalStates : 0;

  // Chart Data preparation
  const chartData = filteredData.map(d => ({
    name: d.state,
    AchievementPct: ((d.achievement / d.target) * 100).toFixed(1)
  }));

  const openViewModal = (stateData: any) => {
    setSelectedState(stateData);
    setIsViewModalOpen(true);
  };

  const columns = [
    { key: 'state', label: 'State' },
    { key: 'rsm', label: 'Assigned RSM' },
    { 
      key: 'target', 
      label: 'State Target',
      render: (row: any) => <span className="font-medium text-slate-700">{formatCurrency(row.target)}</span>
    },
    { 
      key: 'achievement', 
      label: 'Achievement',
      render: (row: any) => <span className="font-semibold text-emerald-600">{formatCurrency(row.achievement)}</span>
    },
    { 
      key: 'achievementPct', 
      label: 'Achv %',
      render: (row: any) => {
        const pct = (row.achievement / row.target) * 100;
        return <span className="font-medium text-slate-700">{pct.toFixed(1)}%</span>;
      }
    },
    { key: 'orders', label: 'Orders', render: (row: any) => row.orders.toLocaleString() },
    { key: 'docVisits', label: 'Dr. Visits', render: (row: any) => row.docVisits.toLocaleString() },
    { key: 'attendancePct', label: 'Attd %', render: (row: any) => `${row.attendancePct}%` },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: any) => {
        const pct = (row.achievement / row.target) * 100;
        const status = calculateStatus(pct);
        return <Badge variant={status.color as any}>{status.label}</Badge>;
      }
    },
    { 
      key: 'actions', 
      label: 'Action',
      render: (row: any) => (
        <button 
          onClick={() => openViewModal(row)}
          className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" 
          title="View Executive Summary"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="State Performance Analytics" 
        subtitle="Executive dashboard for state-level business intelligence."
      />

      {/* Production Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <select 
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white min-w-[120px]"
              value={filters.planningPeriod}
              onChange={(e) => setFilters({...filters, planningPeriod: e.target.value})}
            >
              <option value="Annual">Annual</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
            </select>
            
            {filters.planningPeriod === 'Quarterly' && (
              <select 
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white min-w-[100px]"
                value={filters.planningPeriodSubValue}
                onChange={(e) => setFilters({...filters, planningPeriodSubValue: e.target.value})}
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            )}

            {filters.planningPeriod === 'Monthly' && (
              <select 
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white min-w-[120px]"
                value={filters.planningPeriodSubValue}
                onChange={(e) => setFilters({...filters, planningPeriodSubValue: e.target.value})}
              >
                {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>

          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white min-w-[120px]"
            value={filters.state}
            onChange={(e) => setFilters({...filters, state: e.target.value})}
          >
            <option value="All">All States</option>
            {uniqueStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search State or RSM..." />
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => exportToCSV(filteredData, columns as any, 'State_Performance.csv')}>
            Export
          </ActionButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total States Covered"
          value={totalStates.toString()}
          icon={<MapPin className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Top Performing State"
          value={topState}
          subtitle={`${highestPct.toFixed(1)}% Achieved`}
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Overall Achievement %"
          value={`${overallAchievementPct.toFixed(1)}%`}
          subtitle={`₹${(totalAchievement/10000000).toFixed(2)}Cr / ₹${(totalTarget/10000000).toFixed(2)}Cr`}
          icon={<Target className="w-6 h-6" />}
          colorClass={overallAchievementPct >= 100 ? "text-emerald-600" : overallAchievementPct >= 80 ? "text-blue-600" : "text-amber-600"}
          bgClass={overallAchievementPct >= 100 ? "bg-emerald-50" : overallAchievementPct >= 80 ? "bg-blue-50" : "bg-amber-50"}
        />
        <SummaryCard
          title="Avg Team Attendance %"
          value={`${avgAttendance.toFixed(1)}%`}
          subtitle="All reporting employees"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      {/* Performance Table */}
      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No state data available." />
      </TableCard>

      {/* Simplified Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* 1. Achievement % by State */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#163c78]" />
            <h3 className="text-lg font-bold text-slate-800">Achievement % by State</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 'dataMax + 20']} />
                <YAxis type="category" dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(val: string) => `${val}%`} />
                <Bar dataKey="AchievementPct" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Number(entry.AchievementPct) >= 100 ? '#10b981' : Number(entry.AchievementPct) >= 80 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Monthly Sales Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Monthly Sales Trend (National)</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_TREND} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `₹${val/10000000}Cr`} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedState && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Executive Summary: ${selectedState.state}`}
          className="max-w-4xl w-full"
        >
          <div className="space-y-6">
            {/* Header Metrics */}
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div>
                <span className="block text-sm font-semibold text-slate-500 mb-1">Assigned RSM</span>
                <span className="text-xl font-bold text-slate-800">{selectedState.rsm}</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-semibold text-slate-500 mb-1">Performance Status</span>
                <Badge variant={calculateStatus((selectedState.achievement/selectedState.target)*100).color as any}>
                  {calculateStatus((selectedState.achievement/selectedState.target)*100).label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target & Achievement */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Sales Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">State Target</span>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedState.target)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Achievement</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(selectedState.achievement)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Achievement %</span>
                    <span className="text-sm font-bold text-[#163c78]">{((selectedState.achievement/selectedState.target)*100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Total Order Count</span>
                    <span className="text-sm font-bold text-slate-800">{selectedState.orders.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Operations */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Operational Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Doctor Visits</span>
                    <span className="text-sm font-bold text-slate-800">{selectedState.docVisits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Chemist Visits</span>
                    <span className="text-sm font-bold text-slate-800">{selectedState.chemistVisits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Team Attendance %</span>
                    <span className="text-sm font-bold text-purple-600">{selectedState.attendancePct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Active Field Force</span>
                    <span className="text-sm font-bold text-slate-800">{selectedState.activeAsms} ASMs | {selectedState.activeMrs} MRs</span>
                  </div>
                </div>
              </div>

              {/* Products & Geographies */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Business Highlights</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">Top Selling Product</span>
                    <span className="text-sm font-semibold text-emerald-700">{selectedState.topProduct}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">Lowest Selling Product</span>
                    <span className="text-sm font-semibold text-red-600">{selectedState.lowProduct}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">Top Performing District</span>
                    <span className="text-sm font-semibold text-slate-800">{selectedState.topDistrict}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">Underperforming District</span>
                    <span className="text-sm font-semibold text-amber-600">{selectedState.lowDistrict}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <ActionButton variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close Summary</ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
