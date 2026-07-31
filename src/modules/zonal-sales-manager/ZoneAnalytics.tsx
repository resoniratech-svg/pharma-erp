import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SelectFilter, SummaryCard } from './components/shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, Users, AlertCircle } from 'lucide-react';
import { zsmService } from '../../services/zsmService';

export default function ZoneAnalytics() {
  const [fy, setFy] = useState('FY 26-27');
  const [kpis, setKpis] = useState<any>(null);
  const [rsmPerformance, setRsmPerformance] = useState<any[]>([]);

  useEffect(() => {
    try {
      setKpis(zsmService.getDashboardKPIs());
      setRsmPerformance(zsmService.getTeamPerformance());
    } catch (e) {
      console.warn("Failed to load analytics:", e);
    }
  }, []);

  if (!kpis) return null;

  return (
    <div className="p-6">
      <PageHeader 
        title="Zone Analytics" 
        subtitle="Executive read-only analytics dashboard for your assigned zone."
      />

      <FilterBar>
        <SelectFilter 
          value={fy} 
          onChange={setFy} 
          options={[{ label: 'FY 26-27', value: 'FY 26-27' }]} 
        />
      </FilterBar>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          title="Pending Allocation" 
          value={`₹${(kpis.remainingTarget / 100000).toFixed(2)} L`} 
          icon={<AlertCircle className="w-6 h-6" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 mb-8 flex flex-col items-center">
        <Activity className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Detailed Achievement Analytics Pending</h3>
        <p className="max-w-md mt-2">
          Trend charts and revenue breakdowns rely on real-time transaction data. These will automatically populate once the Medical Representative (MR) module starts feeding live daily call reports and order values into the system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* RSM Allocation Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg"><Users className="w-5 h-5 text-indigo-600" /></div>
            <h3 className="text-lg font-bold text-slate-800">Target Allocation by Regional Sales Manager</h3>
          </div>
          <div className="h-[300px]">
            {rsmPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rsmPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="rsmName" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="totalAllocated" name="Allocated Amount (₹)" fill="#163c78" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No allocations have been made yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
