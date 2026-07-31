import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SelectFilter, SummaryCard } from './components/shared';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IndianRupee, Target, Package, Activity, Award, AlertTriangle, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { asmService } from '../../services/asmService';

const COLORS = ['#163c78', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function AreaAnalytics() {
  const [fy, setFy] = useState('2026-2027');
  const [quarter, setQuarter] = useState('Q2');
  const [month, setMonth] = useState('All');
  const [product, setProduct] = useState('All');

  const [kpis, setKpis] = useState({
    totalSales: 0,
    targetAchievement: 0,
    pendingTarget: 0,
    totalOrders: 0
  });
  
  const [mrPerformance, setMrPerformance] = useState<any[]>([]);

  useEffect(() => {
    try {
      setKpis(asmService.getDashboardKPIs());
      
      const teamPerf = asmService.getTeamPerformance();
      setMrPerformance(teamPerf.map(mr => ({
        name: mr.name,
        sales: mr.achieved / 100000 // Convert to Lakhs
      })));
    } catch (e) {
      console.warn("Failed to load analytics", e);
    }
  }, []);

  return (
    <div className="p-6">
      <PageHeader 
        title="Area Analytics" 
        subtitle="Executive analytics dashboard for your assigned area."
      />

      {/* Deep Filters */}
      <FilterBar>
        <SelectFilter 
          value={fy} 
          onChange={setFy} 
          options={[{ label: 'FY 2026-2027', value: '2026-2027' }]} 
        />
        <SelectFilter 
          value={quarter} 
          onChange={setQuarter} 
          options={[{ label: 'Q1', value: 'Q1' }, { label: 'Q2', value: 'Q2' }, { label: 'Q3', value: 'Q3' }, { label: 'Q4', value: 'Q4' }]} 
        />
        <SelectFilter 
          value={month} 
          onChange={setMonth} 
          options={[{ label: 'July', value: 'Jul' }, { label: 'August', value: 'Aug' }, { label: 'September', value: 'Sep' }]} 
          placeholder="All Months"
        />
        <SelectFilter 
          value={product} 
          onChange={setProduct} 
          options={[
            { label: 'Amoxicillin 500mg', value: 'P1' },
            { label: 'Paracetamol 650mg', value: 'P2' }
          ]} 
          placeholder="All Products"
        />
      </FilterBar>

      <div className="mb-6 bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Activity className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Awaiting MR Execution Data</h4>
          <p className="text-sm text-blue-600 mt-1">
            Achievement values and charts will display zero until Medical Representatives log sales and execution data.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Area Sales" value={`₹${((kpis.targetAchievement || 0) / 100000).toFixed(2)} L`} icon={<IndianRupee className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <SummaryCard title="Target Achievement %" value={`${(kpis.achievementPercentage || 0).toFixed(1)}%`} icon={<Target className="w-6 h-6" />} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <SummaryCard title="Remaining Target" value={`₹${((kpis.remainingTarget || 0) / 100000).toFixed(2)} L`} icon={<Activity className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
        <SummaryCard title="Assigned Target" value={`₹${((kpis.assignedTarget || 0) / 100000).toFixed(2)} L`} icon={<Package className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend vs Target */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200">
             <p className="text-sm font-semibold text-slate-700">Analytics Deferred</p>
             <p className="text-xs text-slate-500 mt-1">Awaiting MR Execution Module Data</p>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <h3 className="text-lg font-bold text-slate-800">Monthly Trend (Target vs Sales)</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MR Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200">
             <p className="text-sm font-semibold text-slate-700">Analytics Deferred</p>
             <p className="text-xs text-slate-500 mt-1">Awaiting MR Execution Module Data</p>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg"><Activity className="w-5 h-5 text-emerald-600" /></div>
            <h3 className="text-lg font-bold text-slate-800">MR Performance</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="sales" name="Sales (Lakhs)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Contribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200">
             <p className="text-sm font-semibold text-slate-700">Analytics Deferred</p>
             <p className="text-xs text-slate-500 mt-1">Awaiting MR Execution Module Data</p>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-violet-50 rounded-lg"><PieIcon className="w-5 h-5 text-violet-600" /></div>
            <h3 className="text-lg font-bold text-slate-800">Revenue Contribution by MR</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[]} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200">
             <p className="text-sm font-semibold text-slate-700">Analytics Deferred</p>
             <p className="text-xs text-slate-500 mt-1">Awaiting MR Execution Module Data</p>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg"><Package className="w-5 h-5 text-amber-600" /></div>
            <h3 className="text-lg font-bold text-slate-800">Top Products Performance</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="sales" name="Sales (Lakhs)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
