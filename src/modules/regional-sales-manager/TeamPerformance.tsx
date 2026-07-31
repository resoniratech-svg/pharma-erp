import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton } from './components/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Info } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { rsmService } from '../../services/rsmService';
import { employeeService } from '../../services/employeeService';

export default function TeamPerformance() {
  const [search, setSearch] = useState('');
  const [teamData, setTeamData] = useState<any[]>([]);
  
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedAsm, setSelectedAsm] = useState<any>(null);
  
  const [teamCounts, setTeamCounts] = useState({ mrs: 0 });

  useEffect(() => {
    try {
      setTeamData(rsmService.getTeamPerformance());
    } catch (e) {
      console.warn('Failed to load team performance:', e);
    }
  }, []);

  const filteredData = teamData.filter(row => 
    row.asmName.toLowerCase().includes(search.toLowerCase())
  );

  const calculateTeamCounts = (asmId: string, asmName: string) => {
    const allEmps = employeeService.getEmployees();
    // MRs reporting to this ASM
    const mrs = allEmps.filter(e => e.designation === 'Medical Representative' && e.status === 'Active' && (e.reportsToId === asmId || e.reportsTo === asmName));
    
    setTeamCounts({ mrs: mrs.length });
  };

  const handleViewPerformance = (row: any) => {
    setSelectedAsm(row);
    setPerformanceModalOpen(true);
  };

  const handleViewTeam = (row: any) => {
    setSelectedAsm(row);
    calculateTeamCounts(row.asmId, row.asmName);
    setTeamModalOpen(true);
  };

  const columns = [
    { key: 'asmName', label: 'ASM Name', render: (row: any) => <span className="font-bold text-slate-800">{row.asmName}</span> },
    { key: 'target', label: 'Allocated Target', render: (row: any) => `₹${(row.allocatedTarget / 100000).toFixed(2)} L` },
    { key: 'achieved', label: 'Achievement', render: (row: any) => `₹${(row.achievement / 100000).toFixed(2)} L` },
    { 
      key: 'achievement', 
      label: 'Achievement %', 
      render: (row: any) => (
        <span className={row.achievementPercentage >= 90 ? 'text-emerald-600 font-bold' : row.achievementPercentage >= 80 ? 'text-amber-600 font-bold' : row.achievementPercentage === 0 ? 'text-slate-400 font-bold' : 'text-rose-600 font-bold'}>
          {row.achievementPercentage.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleViewPerformance(row)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="View Performance">
            <TrendingUp className="w-4 h-4" />
          </button>
          <button onClick={() => handleViewTeam(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Team">
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
        subtitle="Monitor the performance of your Area Sales Managers."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No target allocations found for your team." />
      </TableCard>

      {/* View Performance Modal */}
      <Modal
        isOpen={performanceModalOpen}
        onClose={() => setPerformanceModalOpen(false)}
        title="Performance Analytics"
        footer={<ActionButton variant="secondary" onClick={() => setPerformanceModalOpen(false)}>Close</ActionButton>}
      >
        {selectedAsm && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-full text-2xl font-bold">
                {selectedAsm.asmName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedAsm.asmName}</h3>
                <div className="mt-2"><Badge variant={selectedAsm.achievementPercentage > 0 ? "success" : "neutral"}>YTD Achievement: {selectedAsm.achievementPercentage.toFixed(1)}%</Badge></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase">Allocated Target</p>
                <p className="text-xl font-bold text-slate-800 mt-1">₹{(selectedAsm.allocatedTarget / 100000).toFixed(2)} L</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase">Achieved Target</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">₹{(selectedAsm.achievement / 100000).toFixed(2)} L</p>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Detailed achievement charts are pending integration with the MR transaction module. Currently displaying baseline target allocations.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* View Team Modal */}
      <Modal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title="Team Overview"
        footer={<ActionButton variant="secondary" onClick={() => setTeamModalOpen(false)}>Close</ActionButton>}
      >
        {selectedAsm && (
          <div className="space-y-6">
             <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div>
                   <h4 className="font-bold text-[#163c78]">{selectedAsm.asmName}'s Downward Team</h4>
                </div>
                <Users className="w-8 h-8 text-blue-300" />
             </div>
             
             <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
                <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-xl text-center">
                   <p className="text-4xl font-bold text-slate-800 mb-2">{teamCounts.mrs}</p>
                   <p className="text-sm font-semibold text-slate-500 uppercase">Active MRs</p>
                </div>
             </div>
             
             <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center flex gap-2 items-center justify-center">
                <Info className="w-4 h-4 text-slate-500" />
                <p className="text-sm text-slate-600">These counts are calculated dynamically from the Employee Master hierarchy.</p>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
