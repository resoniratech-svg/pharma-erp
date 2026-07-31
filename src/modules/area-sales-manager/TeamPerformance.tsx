import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton } from './components/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { asmService } from '../../services/asmService';

const mockTrendData = [
  { month: 'Apr', value: 75 },
  { month: 'May', value: 78 },
  { month: 'Jun', value: 85 },
  { month: 'Jul', value: 82 },
  { month: 'Aug', value: 90 },
  { month: 'Sep', value: 94 },
];

export default function TeamPerformance() {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedMr, setSelectedMr] = useState<any>(null);

  useEffect(() => {
    try {
      setPerformanceData(asmService.getTeamPerformance());
    } catch (e) {
      console.warn("Failed to load team performance", e);
    }
  }, []);

  const filteredData = performanceData.filter(row => 
    (row.mrName && row.mrName.toLowerCase().includes(search.toLowerCase())) || 
    (row.headquarters && row.headquarters.toLowerCase().includes(search.toLowerCase()))
  );

  const handleViewPerformance = (row: any) => {
    setSelectedMr(row);
    setPerformanceModalOpen(true);
  };

  const handleViewProfile = (row: any) => {
    setSelectedMr(row);
    setProfileModalOpen(true);
  };

  const columns = [
    { key: 'mrName', label: 'Medical Representative', render: (row: any) => <span className="font-bold text-slate-800">{row.mrName}</span> },
    { key: 'headquarters', label: 'Headquarters', render: (row: any) => row.headquarters || '-' },
    { key: 'allocatedTarget', label: 'Assigned Target', render: (row: any) => `₹${((row.allocatedTarget || 0) / 100000).toFixed(2)} L` },
    { key: 'achievement', label: 'Achievement', render: (row: any) => `₹${((row.achievement || 0) / 100000).toFixed(2)} L` },
    { 
      key: 'achievementPercentage', 
      label: 'Achievement %', 
      render: (row: any) => (
        <span className={(row.achievementPercentage || 0) >= 90 ? 'text-emerald-600 font-bold' : (row.achievementPercentage || 0) >= 80 ? 'text-amber-600 font-bold' : (row.achievementPercentage || 0) > 0 ? 'text-rose-600 font-bold' : 'text-slate-600 font-bold'}>
          {row.achievementPercentage || 0}%
        </span>
      )
    },
    { key: 'doctorVisits', label: 'Doctor Coverage %', render: (row: any) => <span className="font-semibold text-blue-600">0%</span> },
    { key: 'chemistVisits', label: 'Chemist Coverage %', render: (row: any) => <span className="font-semibold text-violet-600">0%</span> },
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'success'}>Active</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleViewPerformance(row)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="View Performance">
            <TrendingUp className="w-4 h-4" />
          </button>
          <button onClick={() => handleViewProfile(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Profile">
            <Users className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Team Performance" 
        subtitle="Monitor the performance of your Medical Representatives."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or HQ..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No performance data found." />
      </TableCard>

      {/* View Performance Modal */}
      <Modal
        isOpen={performanceModalOpen}
        onClose={() => setPerformanceModalOpen(false)}
        title="Performance Analytics"
        footer={<ActionButton variant="secondary" onClick={() => setPerformanceModalOpen(false)}>Close</ActionButton>}
      >
        {selectedMr && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-full text-2xl font-bold">
                {selectedMr.mrName?.charAt(0) || 'M'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedMr.mrName}</h3>
                <p className="text-sm text-slate-500">HQ: {selectedMr.headquarters || '-'}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant={(selectedMr.achievementPercentage || 0) > 0 ? "success" : "neutral"}>Achievement: {selectedMr.achievementPercentage || 0}%</Badge>
                  <Badge variant="info">Doc Coverage: 0%</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-4">Achievement Trend (Last 6 Months)</h4>
              <div className="h-64 bg-white border border-slate-100 rounded-xl p-4 shadow-sm relative">
                {/* Overlay indicating deferred analytics until MR module */}
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200">
                   <p className="text-sm font-semibold text-slate-700">Analytics Deferred</p>
                   <p className="text-xs text-slate-500 mt-1">Awaiting MR Execution Module Data</p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="value" name="Achievement %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Target</p>
                <p className="text-xl font-bold text-slate-800 mt-1">₹{((selectedMr.allocatedTarget || 0) / 100000).toFixed(2)} L</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase">Achieved Target</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">₹{((selectedMr.achievement || 0) / 100000).toFixed(2)} L</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Employee Profile"
        footer={<ActionButton variant="secondary" onClick={() => setProfileModalOpen(false)}>Close</ActionButton>}
      >
        {selectedMr && (
          <div className="space-y-6">
             <div className="flex flex-col items-center justify-center p-6 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="w-20 h-20 bg-white text-blue-700 flex items-center justify-center rounded-full text-3xl font-bold mb-4 shadow-sm">
                  {selectedMr.mrName?.charAt(0) || 'M'}
                </div>
                <h4 className="text-xl font-bold text-[#163c78]">{selectedMr.mrName}</h4>
                <p className="text-sm text-blue-600 font-medium">Medical Representative • {selectedMr.headquarters || '-'}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4 relative">
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl border border-dashed border-slate-200">
                   <p className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-full shadow-sm">Awaiting Execution Data</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl text-center">
                   <p className="text-2xl font-bold text-slate-800 mb-1">0%</p>
                   <p className="text-xs font-semibold text-slate-500 uppercase">Doctor Coverage</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl text-center">
                   <p className="text-2xl font-bold text-slate-800 mb-1">0%</p>
                   <p className="text-xs font-semibold text-slate-500 uppercase">Chemist Coverage</p>
                </div>
             </div>
             
             <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-sm text-slate-600">This profile view provides quick performance insights. For detailed hierarchy, use the Sales Organization screen.</p>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
