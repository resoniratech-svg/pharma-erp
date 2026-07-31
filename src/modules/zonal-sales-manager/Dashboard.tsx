import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard } from './components/shared';
import { IndianRupee, Target, Activity, Users, AlertCircle } from 'lucide-react';
import { zsmService } from '../../services/zsmService';

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    assignedTarget: 0,
    allocatedTarget: 0,
    remainingTarget: 0,
    targetAchievement: 0,
    achievementPercentage: 0,
    activeRSMCount: 0,
    allocationStatus: 'Loading...'
  });

  useEffect(() => {
    try {
      const liveKpis = zsmService.getDashboardKPIs();
      setKpis(liveKpis);
    } catch (e) {
      console.warn("Error fetching dashboard KPIs:", e);
    }
  }, []);

  return (
    <div className="p-6">
      <PageHeader 
        title="Zonal Sales Dashboard" 
        subtitle="Executive overview of zone performance and regional metrics."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard 
          title="Assigned Target" 
          value={`₹${(kpis.assignedTarget / 100000).toFixed(2)} L`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-[#163c78]" 
          bgClass="bg-blue-50" 
        />
        <SummaryCard 
          title="Allocated to RSMs" 
          value={`₹${(kpis.allocatedTarget / 100000).toFixed(2)} L`} 
          icon={<IndianRupee className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Remaining Balance" 
          value={`₹${(kpis.remainingTarget / 100000).toFixed(2)} L`} 
          icon={<Activity className="w-6 h-6" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
        <SummaryCard 
          title="Active RSMs" 
          value={kpis.activeRSMCount.toString()} 
          icon={<Users className="w-6 h-6" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <SummaryCard 
          title="Achievement" 
          value={`₹${(kpis.targetAchievement / 100000).toFixed(2)} L`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="text-violet-600" 
          bgClass="bg-violet-50" 
        />
        <SummaryCard 
          title="Achievement %" 
          value={`${kpis.achievementPercentage.toFixed(1)}%`} 
          icon={<Activity className="w-6 h-6" />} 
          colorClass={kpis.achievementPercentage >= 90 ? "text-emerald-600" : "text-rose-600"} 
          bgClass={kpis.achievementPercentage >= 90 ? "bg-emerald-50" : "bg-rose-50"} 
        />
        <SummaryCard 
          title="Allocation Status" 
          value={kpis.allocationStatus} 
          icon={<AlertCircle className="w-6 h-6" />} 
          colorClass={kpis.allocationStatus === 'Fully Allocated' ? 'text-emerald-600' : 'text-amber-600'} 
          bgClass={kpis.allocationStatus === 'Fully Allocated' ? 'bg-emerald-50' : 'bg-amber-50'} 
        />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 mb-8 flex flex-col items-center">
        <Activity className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Detailed Analytics Pending</h3>
        <p className="max-w-md mt-2">
          Charts and downstream transaction data (orders, doctor visits, daily call reports) will populate here once the Medical Representative (MR) module begins processing live transactions. 
          Currently returning baseline service-layer values as requested.
        </p>
      </div>
    </div>
  );
}
