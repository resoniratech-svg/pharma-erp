import React, { useState } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, SummaryCard, ActionButton, Badge } from './components/shared';
import { Users, TrendingUp, Download, Eye, Target, ShieldCheck } from 'lucide-react';
import { exportToCSV } from '../../utils/exportUtils';
import { Modal } from '../../components/ui/Modal';

// Mock Data representing aggregated team performance analytics
const MOCK_TEAM_DATA = [
  {
    empCode: 'RSM001',
    name: 'Arun Kumar',
    region: 'West',
    state: 'Maharashtra',
    target: 150000000,
    achievement: 135000000,
    orders: 4520,
    docVisits: 12500,
    chemistVisits: 8200,
    attendancePct: 92,
    activeAsms: 8,
    activeMrs: 45,
    topProduct: 'Azithromycin 500mg',
    lowProduct: 'Vitamin D3 Drops'
  },
  {
    empCode: 'RSM002',
    name: 'Rajesh Singh',
    region: 'West',
    state: 'Gujarat',
    target: 120000000,
    achievement: 95000000,
    orders: 3100,
    docVisits: 9800,
    chemistVisits: 6100,
    attendancePct: 88,
    activeAsms: 6,
    activeMrs: 35,
    topProduct: 'Paracetamol 650mg',
    lowProduct: 'Cough Syrup 100ml'
  },
  {
    empCode: 'RSM003',
    name: 'Priya Sharma',
    region: 'South',
    state: 'Karnataka',
    target: 180000000,
    achievement: 195000000,
    orders: 5800,
    docVisits: 15200,
    chemistVisits: 9400,
    attendancePct: 95,
    activeAsms: 10,
    activeMrs: 55,
    topProduct: 'Amoxicillin 250mg',
    lowProduct: 'Antacid Gel'
  },
  {
    empCode: 'RSM004',
    name: 'Vikram Das',
    region: 'South',
    state: 'Tamil Nadu',
    target: 100000000,
    achievement: 45000000,
    orders: 1200,
    docVisits: 5100,
    chemistVisits: 3200,
    attendancePct: 78,
    activeAsms: 5,
    activeMrs: 25,
    topProduct: 'Cefixime 200mg',
    lowProduct: 'Pain Relief Spray'
  }
];

const MONTHLY_TREND = [
  { month: 'Apr', achievement: 35000000 },
  { month: 'May', achievement: 42000000 },
  { month: 'Jun', achievement: 40000000 },
  { month: 'Jul', achievement: 51000000 },
  { month: 'Aug', achievement: 48000000 },
  { month: 'Sep', achievement: 60000000 },
];

export default function TeamPerformance() {
  const [search, setSearch] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRsm, setSelectedRsm] = useState<any>(null);

  // Filters state
  const [filters, setFilters] = useState({
    financialYear: '2026-27',
    planningPeriod: 'Annual',
    region: 'All',
    state: 'All',
    rsm: 'All',
    status: 'All'
  });

  const filteredData = MOCK_TEAM_DATA.filter(row => 
    row.name.toLowerCase().includes(search.toLowerCase()) || 
    row.empCode.toLowerCase().includes(search.toLowerCase())
  );

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
  const activeRsms = filteredData.length;
  let totalAsms = 0;
  let totalMrs = 0;
  let highestPct = 0;
  let topRsmName = 'N/A';
  let totalTarget = 0;
  let totalAchievement = 0;

  filteredData.forEach(row => {
    totalAsms += row.activeAsms;
    totalMrs += row.activeMrs;
    const pct = (row.achievement / row.target) * 100;
    if (pct > highestPct) {
      highestPct = pct;
      topRsmName = row.name;
    }
    totalTarget += row.target;
    totalAchievement += row.achievement;
  });

  const overallAchievementPct = totalTarget > 0 ? (totalAchievement / totalTarget) * 100 : 0;
  const totalFieldForce = totalAsms + totalMrs;

  const openViewModal = (rsmData: any) => {
    setSelectedRsm(rsmData);
    setIsViewModalOpen(true);
  };

  const columns = [
    { key: 'empCode', label: 'Employee Code' },
    { key: 'name', label: 'RSM Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { key: 'state', label: 'State' },
    { 
      key: 'target', 
      label: 'Assigned Target',
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
    { key: 'teamStrength', label: 'Team Strength', render: (row: any) => `${row.activeAsms + row.activeMrs} Members` },
    { key: 'attendancePct', label: 'Attd %', render: (row: any) => `${row.attendancePct}%` },
    { key: 'orders', label: 'Orders', render: (row: any) => row.orders.toLocaleString() },
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
        title="Team Performance Analytics" 
        subtitle="Executive dashboard for monitoring RSM and team performance."
      />

      {/* Production Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white min-w-[140px]"
            value={filters.planningPeriod}
            onChange={(e) => setFilters({...filters, planningPeriod: e.target.value})}
          >
            <option value="Annual">Annual Target</option>
            <option value="Quarterly">Q1 Target</option>
            <option value="Monthly">Current Month</option>
          </select>
          
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white min-w-[120px]"
            value={filters.region}
            onChange={(e) => setFilters({...filters, region: e.target.value})}
          >
            <option value="All">All Regions</option>
            <option value="North">North India</option>
            <option value="South">South India</option>
            <option value="West">West India</option>
            <option value="East">East India</option>
          </select>
          
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white min-w-[120px]"
            value={filters.state}
            onChange={(e) => setFilters({...filters, state: e.target.value})}
          >
            <option value="All">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
          </select>

          <div className="flex-1 min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search RSM Name or Code..." />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => exportToCSV(filteredData, columns as any, 'Team_Performance.csv')}>
            Export
          </ActionButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Active RSMs"
          value={activeRsms.toString()}
          icon={<ShieldCheck className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <SummaryCard
          title="Total Field Force"
          value={totalFieldForce.toString()}
          subtitle={`${totalAsms} ASM | ${totalMrs} MR`}
          icon={<Users className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Top Performing RSM"
          value={topRsmName}
          subtitle={`${highestPct.toFixed(1)}% Achieved`}
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Overall Team Achievement"
          value={`${overallAchievementPct.toFixed(1)}%`}
          subtitle={`₹${(totalAchievement/10000000).toFixed(2)}Cr / ₹${(totalTarget/10000000).toFixed(2)}Cr`}
          icon={<Target className="w-6 h-6" />}
          colorClass={overallAchievementPct >= 100 ? "text-emerald-600" : overallAchievementPct >= 80 ? "text-blue-600" : "text-amber-600"}
          bgClass={overallAchievementPct >= 100 ? "bg-emerald-50" : overallAchievementPct >= 80 ? "bg-blue-50" : "bg-amber-50"}
        />
      </div>

      {/* Performance Table */}
      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No team data available." />
      </TableCard>

      {/* View Details Modal */}
      {selectedRsm && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`RSM Analytics: ${selectedRsm.name}`}
          className="max-w-4xl w-full"
        >
          <div className="space-y-6">
            {/* Header Metrics */}
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div>
                <span className="block text-sm font-semibold text-slate-500 mb-1">Employee Code: {selectedRsm.empCode}</span>
                <span className="text-xl font-bold text-slate-800">{selectedRsm.name}</span>
                <span className="block text-sm font-medium text-slate-500 mt-1">{selectedRsm.state} • {selectedRsm.region} Region</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-semibold text-slate-500 mb-1">Performance Status</span>
                <Badge variant={calculateStatus((selectedRsm.achievement/selectedRsm.target)*100).color as any}>
                  {calculateStatus((selectedRsm.achievement/selectedRsm.target)*100).label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target & Achievement */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Sales Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Assigned Target</span>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedRsm.target)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Achievement</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(selectedRsm.achievement)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Achievement %</span>
                    <span className="text-sm font-bold text-[#163c78]">{((selectedRsm.achievement/selectedRsm.target)*100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Orders Booked</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRsm.orders.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Operations */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Operational Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Doctor Visits</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRsm.docVisits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Chemist Visits</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRsm.chemistVisits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Team Attendance %</span>
                    <span className="text-sm font-bold text-purple-600">{selectedRsm.attendancePct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Active Field Force</span>
                    <span className="text-sm font-bold text-slate-800">{selectedRsm.activeAsms} ASMs | {selectedRsm.activeMrs} MRs</span>
                  </div>
                </div>
              </div>

              {/* Product Highlights */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Business Highlights</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">Top Selling Product</span>
                    <span className="text-sm font-semibold text-emerald-700">{selectedRsm.topProduct}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">Lowest Selling Product</span>
                    <span className="text-sm font-semibold text-red-600">{selectedRsm.lowProduct}</span>
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
