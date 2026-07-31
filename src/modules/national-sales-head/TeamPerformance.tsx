import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton, SummaryCard } from './components/shared';
import { Users, TrendingUp, Download } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { nsmService } from '../../services/nsmService';
import { exportToCSV } from '../../utils/exportUtils';

export default function TeamPerformance() {
  const [search, setSearch] = useState('');
  const [teamData, setTeamData] = useState<any[]>([]);
  
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedZsm, setSelectedZsm] = useState<any>(null);

  useEffect(() => {
    try {
      setTeamData(nsmService.getTeamPerformance());
    } catch (e) {
      console.warn('Failed to load team performance:', e);
    }
  }, []);

  const filteredData = teamData.filter(row => 
    row.zsmName.toLowerCase().includes(search.toLowerCase()) || 
    (row.zsmId || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleViewPerformance = (row: any) => {
    setSelectedZsm(row);
    setPerformanceModalOpen(true);
  };

  const handleViewTeam = (row: any) => {
    setSelectedZsm(row);
    setTeamModalOpen(true);
  };

  const columns = [
    { key: 'zsmId', label: 'Employee Code' },
    { key: 'zsmName', label: 'ZSM Name' },
    { 
      key: 'totalAllocated', 
      label: 'Assigned Target',
      render: (row: any) => `₹${(row.totalAllocated / 100000).toFixed(2)} L`
    },
    { 
      key: 'totalAchievement', 
      label: 'Achievement',
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">₹{(row.totalAchievement / 100000).toFixed(2)} L</span>
          <span className="text-xs text-slate-500">{row.achievementPercentage.toFixed(1)}%</span>
        </div>
      )
    },
    { 
      key: 'growth', 
      label: 'YOY Growth',
      render: () => <span className="text-emerald-600 font-semibold">+0%</span> // Placeholder until MR transactions
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="success">Active</Badge>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleViewPerformance(row)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="View Performance">
            <TrendingUp className="w-4 h-4" />
          </button>
          <button onClick={() => handleViewTeam(row)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View Team">
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
        subtitle="Monitor Zonal Sales Managers' performance and team hierarchy."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => exportToCSV(filteredData, columns as any, 'NSM_Team_Performance_2026-07-30.csv')}>
            Export Summary
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Total Active ZSMs"
          value={teamData.length.toString()}
          icon={<Users className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Total Field Force"
          value="0"
          subtitle="Awaiting Downstream Sync"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Top Performing Zone"
          value="N/A"
          subtitle="0% Achievement"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search ZSM..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No active targets allocated to ZSMs." />
      </TableCard>

      <Modal
        isOpen={performanceModalOpen}
        onClose={() => setPerformanceModalOpen(false)}
        title="ZSM Performance Overview"
        footer={<ActionButton variant="secondary" onClick={() => setPerformanceModalOpen(false)}>Close</ActionButton>}
      >
        {selectedZsm && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Target Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Assigned Target</p><p className="text-sm font-medium">₹{(selectedZsm.totalAllocated/100000).toFixed(2)} L</p></div>
                <div><p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Achieved Target</p><p className="text-sm font-medium">₹{(selectedZsm.totalAchievement/100000).toFixed(2)} L</p></div>
                <div><p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Remaining Target</p><p className="text-sm font-medium">₹{((selectedZsm.totalAllocated - selectedZsm.totalAchievement)/100000).toFixed(2)} L</p></div>
                <div><p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Achievement %</p><p className="text-sm font-medium text-emerald-600">{selectedZsm.achievementPercentage.toFixed(1)}%</p></div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Info</h3>
              <p className="text-sm text-slate-500">Detailed MR transactions are pending integration. All achievement values reflect a static 0.</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title="Reporting Hierarchy"
        footer={<ActionButton variant="secondary" onClick={() => setTeamModalOpen(false)}>Close</ActionButton>}
      >
        {selectedZsm && (
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
               <h4 className="font-bold text-blue-900 text-lg mb-1">{selectedZsm.zsmName}</h4>
               <Badge variant="info">Zonal Sales Manager</Badge>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-500 text-center">
               This hierarchy view is strictly read-only. Detailed tree expansion will be available in future releases.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
