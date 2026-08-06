import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader, SummaryCard, TableCard, DataTable, Badge } from './components/shared';
import { IndianRupee, Target, Activity, Users, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { rsmService } from '../../services/rsmService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    assignedTarget: 0,
    allocatedTarget: 0,
    remainingTarget: 0,
    targetAchievement: 0,
    achievementPercentage: 0,
    activeAsmCount: 0,
    allocationStatus: 'Loading...'
  });

  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    try {
      setLoading(true);
      const liveKpis = await rsmService.getDashboardKPIs();
      setKpis({
        ...liveKpis,
        pendingActivities: 5
      } as any);
    } catch (e) {
      console.warn("Error fetching dashboard KPIs:", e);
    } finally {
      setLoading(false);
    }
  };

  const pendingActivities = [
    { id: 1, source: 'Attendance', employee: 'Rahul Verma', activity: 'Late Check-in', date: 'Today', status: 'Pending Review', path: '/workspace/regional-sales-manager/attendance' },
    { id: 2, source: 'Team Visit', employee: 'Vikash Sharma', activity: 'Visit Pending Approval', date: 'Today', status: 'Pending', path: '/workspace/regional-sales-manager/team-visits' },
    { id: 3, source: 'Attendance', employee: 'Amit Desai', activity: 'Attendance Pending Review', date: 'Today', status: 'Pending', path: '/workspace/regional-sales-manager/attendance' },
    { id: 4, source: 'Distributor', employee: 'Surat Pharma', activity: 'Outstanding Payment Follow-up', date: 'Today', status: 'Pending', path: '/workspace/regional-sales-manager/distributor-management' },
    { id: 5, source: 'Distributor', employee: 'Apollo Pharma', activity: 'Outstanding Payment Follow-up', date: 'Yesterday', status: 'Pending', path: '/workspace/regional-sales-manager/distributor-management' },
  ];

  const columns = [
    { key: 'source', label: 'Source', render: (row: any) => <span className="font-medium text-slate-700">{row.source}</span> },
    { key: 'employee', label: 'Employee / Distributor', render: (row: any) => <span className="font-semibold text-slate-800">{row.employee}</span> },
    { key: 'activity', label: 'Activity' },
    { key: 'date', label: 'Date', render: (row: any) => <span className="text-slate-500 text-sm">{row.date}</span> },
    { key: 'status', label: 'Status', render: (row: any) => (
      <Badge variant={row.status.includes('Review') ? 'warning' : 'neutral'}>{row.status}</Badge>
    ) },
    { key: 'action', label: 'Action', render: (row: any) => (
      <button 
        onClick={() => navigate(row.path)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#163c78] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <Eye className="w-4 h-4" /> View
      </button>
    ) }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Regional Sales Dashboard" 
        subtitle="Executive overview of regional performance and area metrics (Live Database Data)."
      />

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#163c78] mb-2" />
          <p className="text-sm">Loading regional performance metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard 
            title="Assigned Target" 
            value={`₹${(kpis.assignedTarget / 100000).toFixed(2)} L`} 
            subtitle="FY 2026-27"
            icon={<Target className="w-6 h-6" />} 
            colorClass="text-blue-600" 
            bgClass="bg-blue-50" 
          />
          <SummaryCard 
            title="Achieved Target" 
            value={`₹${(kpis.targetAchievement / 100000).toFixed(2)} L`} 
            subtitle={`${kpis.achievementPercentage.toFixed(1)}% Achievement`}
            icon={<Activity className="w-6 h-6" />} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
          />
          <SummaryCard 
            title="Remaining Target" 
            value={`₹${(kpis.remainingTarget / 100000).toFixed(2)} L`} 
            subtitle="Pending realization"
            icon={<AlertCircle className="w-6 h-6" />} 
            colorClass={kpis.remainingTarget > 0 ? "text-amber-600" : "text-emerald-600"} 
            bgClass={kpis.remainingTarget > 0 ? "bg-amber-50" : "bg-emerald-50"} 
          />
          <SummaryCard 
            title="Active ASMs" 
            value={kpis.activeAsmCount.toString()} 
            subtitle="Direct reports in territory"
            icon={<Users className="w-6 h-6" />} 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50" 
          />
          <SummaryCard 
            title="Achievement %" 
            value={`${kpis.achievementPercentage.toFixed(1)}%`} 
            subtitle="Overall performance"
            icon={<Target className="w-6 h-6" />} 
            colorClass={kpis.achievementPercentage >= 90 ? "text-emerald-600" : "text-rose-600"} 
            bgClass={kpis.achievementPercentage >= 90 ? "bg-emerald-50" : "bg-rose-50"} 
          />
          <SummaryCard 
            title="Pending Activities" 
            value={(kpis as any).pendingActivities?.toString() || "0"} 
            subtitle="Awaiting your review"
            icon={<AlertCircle className="w-6 h-6" />} 
            colorClass="text-rose-600" 
            bgClass="bg-rose-50" 
          />
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Pending Approvals & Activities</h2>
        <TableCard>
          <DataTable columns={columns} data={pendingActivities} />
        </TableCard>
      </div>
    </div>
  );
}
