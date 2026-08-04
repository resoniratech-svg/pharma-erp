import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard } from './components/shared';
import { Target, TrendingUp, AlertCircle, Users, CheckSquare, MapPin, Clock, Bell } from 'lucide-react';
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
    nationalTarget: 150000000,
    achievedTarget: 0,
    remainingTarget: 150000000,
    activeRSMCount: 5,
    stateCoverage: 85,
    pendingApprovals: 12
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const achievementPct = kpis.nationalTarget > 0 ? ((kpis.achievedTarget / kpis.nationalTarget) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6">
      <PageHeader 
        title="National Sales Dashboard" 
        subtitle="Executive overview of national sales performance and targets."
      />

      {/* KPI Cards (2 Rows of 3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Assigned National Target"
          value={formatCurrency(kpis.nationalTarget)}
          subtitle="FY 2026-27"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Achieved Target"
          value={formatCurrency(kpis.achievedTarget)}
          subtitle={`${achievementPct}% Achievement`}
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Remaining Target"
          value={formatCurrency(kpis.remainingTarget)}
          subtitle="Pending realization"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass={kpis.remainingTarget > 0 ? "text-amber-600" : "text-emerald-600"}
          bgClass={kpis.remainingTarget > 0 ? "bg-amber-50" : "bg-emerald-50"}
        />
        <SummaryCard
          title="Active RSMs"
          value={kpis.activeRSMCount.toString()}
          subtitle="Direct reports"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="State Coverage"
          value={`${kpis.stateCoverage}%`}
          subtitle="Of planned territories"
          icon={<MapPin className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <SummaryCard
          title="Pending Approvals"
          value={kpis.pendingApprovals.toString()}
          subtitle="Awaiting your review"
          icon={<CheckSquare className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
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
    </div>
  );
}
