import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard, TableCard, DataTable } from './components/shared';
import { Target, Activity, Users, AlertTriangle, Play } from 'lucide-react';
import { asmService } from '../../services/asmService';

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    try {
      setKpis(asmService.getDashboardKPIs());
    } catch (e) {
      console.warn("Failed to load dashboard data", e);
    }
  }, []);

  const pendingActivitiesColumns = [
    { key: 'source', label: 'Source' },
    { key: 'employee', label: 'Employee / Distributor' },
    { key: 'activity', label: 'Activity' },
    { key: 'date', label: 'Date' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          {row.status}
        </span>
      )
    },
    { 
      key: 'action', 
      label: 'Action',
      render: () => (
        <button className="text-primary hover:text-primary-600 font-medium text-sm flex items-center gap-1">
          Review <Play className="w-3 h-3" />
        </button>
      )
    }
  ];

  const pendingActivitiesData = [
    { id: '1', source: 'Attendance', employee: 'Rahul Verma', activity: 'Late Check-in', date: 'Today', status: 'Pending' },
    { id: '2', source: 'Tour Planning', employee: 'Sneha Patel', activity: 'MTP Approval for May', date: 'Today', status: 'Pending Review' },
    { id: '3', source: 'Attendance', employee: 'Amit Kumar', activity: 'Leave Request (Sick)', date: 'Yesterday', status: 'Pending Approval' },
    { id: '4', source: 'Target Allocation', employee: 'Vikas Singh', activity: 'Target Acknowledgment', date: '2 Days Ago', status: 'Pending' },
  ];

  if (!kpis) return null;

  return (
    <div className="p-6">
      <PageHeader 
        title="Area Sales Dashboard" 
        subtitle="Executive overview of area performance, targets, and pending operations."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <SummaryCard 
          title="Active MRs" 
          value={kpis.activeMRCount || '12'} 
          icon={<Users className="w-6 h-6" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <SummaryCard 
          title="Assigned Target" 
          value={`₹${(kpis.assignedTarget / 100000).toFixed(2)} L`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <SummaryCard 
          title="Achieved Target" 
          value={`₹${(kpis.allocatedTarget / 100000).toFixed(2)} L`} 
          icon={<Activity className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Remaining Target" 
          value={`₹${(kpis.remainingTarget / 100000).toFixed(2)} L`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
        <SummaryCard 
          title="Achievement %" 
          value={`${((kpis.allocatedTarget / kpis.assignedTarget) * 100).toFixed(1)}%`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Pending Approvals" 
          value={(kpis.pendingTourPlans || 0) + (kpis.pendingAttendanceExceptions || 0)} 
          icon={<AlertTriangle className="w-6 h-6" />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-50" 
        />
      </div>

      <div className="flex flex-col mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Pending Approvals & Activities</h3>
        <TableCard>
          <DataTable columns={pendingActivitiesColumns} data={pendingActivitiesData} emptyMessage="No pending activities found." />
        </TableCard>
      </div>
    </div>
  );
}
