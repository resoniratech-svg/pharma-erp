import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard } from './components/shared';
import { Target, TrendingUp, AlertCircle, Users, CheckCircle, MapPin, CheckSquare, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { nsmService } from '../../services/nsmService';

const monthlyData = [
  { name: 'Jan', sales: 0, target: 15000000 },
  { name: 'Feb', sales: 0, target: 15000000 },
  { name: 'Mar', sales: 0, target: 15000000 },
  { name: 'Apr', sales: 0, target: 18000000 },
  { name: 'May', sales: 0, target: 18000000 },
  { name: 'Jun', sales: 0, target: 20000000 },
];

const productData = [
  { name: 'Aspirin 500mg', revenue: 0 },
  { name: 'Amoxicillin 250mg', revenue: 0 },
  { name: 'Ibuprofen 400mg', revenue: 0 },
  { name: 'Paracetamol 500mg', revenue: 0 },
  { name: 'Cetirizine 10mg', revenue: 0 },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    nationalTarget: 0,
    allocatedTarget: 0,
    remainingTarget: 0,
    targetAchievement: 0,
    activeZSMCount: 0,
    allocationStatus: 'Pending Allocation'
  });

  useEffect(() => {
    try {
      const liveKpis = nsmService.getDashboardKPIs();
      setKpis(liveKpis);
    } catch (e) {
      console.warn("Failed to load NSM KPIs:", e);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="National Sales Dashboard" 
        subtitle="Executive overview of national sales performance and targets."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="National Sales Target"
          value={formatCurrency(kpis.nationalTarget)}
          subtitle="Total Assigned Target"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Allocated to ZSMs"
          value={formatCurrency(kpis.allocatedTarget)}
          subtitle="Distributed Target"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Remaining Target"
          value={formatCurrency(kpis.remainingTarget)}
          subtitle={kpis.allocationStatus}
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass={kpis.remainingTarget > 0 ? "text-amber-600" : "text-emerald-600"}
          bgClass={kpis.remainingTarget > 0 ? "bg-amber-50" : "bg-emerald-50"}
        />
        <SummaryCard
          title="Target Achievement"
          value="0%"
          subtitle="Awaiting transactions"
          icon={<CheckSquare className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Active ZSMs"
          value={kpis.activeZSMCount.toString()}
          subtitle="Reporting directly to you"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Monthly Sales Trend</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#163c78" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#163c78" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${(value / 10000000).toFixed(2)} Cr`, 'Sales']}
                />
                <Legend />
                <Area type="monotone" name="Actual Sales" dataKey="sales" stroke="#163c78" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" name="Target" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Performance Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Top Products</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                <Tooltip
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${(value / 100000).toFixed(2)} L`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#163c78" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-[#163c78] hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#163c78]/10 flex items-center justify-center mb-3 group-hover:bg-[#163c78] transition-colors">
              <Target className="w-5 h-5 text-[#163c78] group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Allocate Targets</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-[#163c78] hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#163c78]/10 flex items-center justify-center mb-3 group-hover:bg-[#163c78] transition-colors">
              <Users className="w-5 h-5 text-[#163c78] group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Review ZSMs</span>
          </button>

          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-[#163c78] hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#163c78]/10 flex items-center justify-center mb-3 group-hover:bg-[#163c78] transition-colors">
              <BarChart2 className="w-5 h-5 text-[#163c78] group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-semibold text-slate-700">View Analytics</span>
          </button>

          <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3 group-hover:bg-emerald-600 transition-colors">
              <CheckCircle className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Pending Approvals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
