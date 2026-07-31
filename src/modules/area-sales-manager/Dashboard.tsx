import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard, TableCard, DataTable } from './components/shared';
import { Target, Activity, Users, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { asmService } from '../../services/asmService';

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);

  useEffect(() => {
    try {
      setKpis(asmService.getDashboardKPIs());
      setTeamPerformance(asmService.getTeamPerformance());
    } catch (e) {
      console.warn("Failed to load dashboard data", e);
    }
  }, []);

  const mrColumns = [
    { key: 'mrName', label: 'Medical Representative' },
    { key: 'allocatedTarget', label: 'Target', render: (row: any) => `₹${(row.allocatedTarget / 100000).toFixed(2)} L` },
    { key: 'achievement', label: 'Achieved', render: (row: any) => `₹${(row.achievement / 100000).toFixed(2)} L` },
    { 
      key: 'achievementPercentage', 
      label: 'Achievement %', 
      render: (row: any) => (
        <span className={row.achievementPercentage >= 90 ? 'text-emerald-600 font-bold' : row.achievementPercentage >= 80 ? 'text-amber-600 font-bold' : 'text-rose-600 font-bold'}>
          {row.achievementPercentage}%
        </span>
      )
    },
    { key: 'territory', label: 'Territory' },
  ];

  if (!kpis) return null;

  return (
    <div className="p-6">
      <PageHeader 
        title="Area Sales Dashboard" 
        subtitle="Executive overview of area performance and MR metrics."
      />

      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-slate-700">Data Visibility Notice</h4>
          <p className="text-sm text-slate-600 mt-1">
            Revenue and Sales analytics are temporarily hidden until downstream Medical Representative transactions (Order Bookings, DCRs) begin generating live data. Currently displaying Allocation Analytics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard 
          title="Total Assigned Target" 
          value={`₹${(kpis.assignedTarget / 100000).toFixed(2)} L`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <SummaryCard 
          title="Total Allocated Downward" 
          value={`₹${(kpis.allocatedTarget / 100000).toFixed(2)} L`} 
          icon={<Activity className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Remaining Balance" 
          value={`₹${(kpis.remainingTarget / 100000).toFixed(2)} L`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
        <SummaryCard 
          title="Active MRs" 
          value={kpis.activeMRCount} 
          icon={<Users className="w-6 h-6" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard 
          title="Pending Tour Plans" 
          value={kpis.pendingTourPlans} 
          icon={<FileText className="w-6 h-6" />} 
          colorClass="text-violet-600" 
          bgClass="bg-violet-50" 
        />
        <SummaryCard 
          title="Pending DCR Approvals" 
          value={kpis.pendingDCRs} 
          icon={<CheckCircle className="w-6 h-6" />} 
          colorClass="text-orange-600" 
          bgClass="bg-orange-50" 
        />
        <SummaryCard 
          title="Pending Attendance Exceptions" 
          value={kpis.pendingAttendanceExceptions} 
          icon={<AlertTriangle className="w-6 h-6" />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-50" 
        />
      </div>

      {/* MR Performance Table */}
      <div className="flex flex-col mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">MR Performance Summary</h3>
        <TableCard>
          <DataTable columns={mrColumns} data={teamPerformance} emptyMessage="No Medical Representatives found." />
        </TableCard>
      </div>
    </div>
  );
}

