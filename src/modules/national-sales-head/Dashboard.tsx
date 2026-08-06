import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard } from './components/shared';
import { Target, TrendingUp, AlertCircle, Users, CheckSquare, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { nsmService } from '../../services/nsmService';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    nationalTarget: 0,
    achievedTarget: 0,
    remainingTarget: 0,
    activeRSMCount: 0,
    stateCoverage: 0,
    pendingApprovals: 0
  });

  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [productTrend, setProductTrend] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await nsmService.getDashboardKPIs('2026-27');
      setKpis({
        nationalTarget: data.nationalTarget || 0,
        achievedTarget: data.achievedTarget || 0,
        remainingTarget: data.remainingTarget ?? data.nationalTarget,
        activeRSMCount: data.activeRSMCount || 0,
        stateCoverage: data.stateCoverage || 0,
        pendingApprovals: data.pendingApprovals || 0,
      });
      if (data.monthlyData && data.monthlyData.length > 0) {
        setMonthlyTrend(data.monthlyData);
      } else {
        setMonthlyTrend([
          { name: 'Apr', sales: 0, target: data.nationalTarget / 12 || 12500000 },
          { name: 'May', sales: 0, target: data.nationalTarget / 12 || 12500000 },
          { name: 'Jun', sales: 0, target: data.nationalTarget / 12 || 12500000 },
          { name: 'Jul', sales: 0, target: data.nationalTarget / 12 || 12500000 },
          { name: 'Aug', sales: 0, target: data.nationalTarget / 12 || 12500000 },
          { name: 'Sep', sales: 0, target: data.nationalTarget / 12 || 12500000 },
        ]);
      }
      if (data.productData && data.productData.length > 0) {
        setProductTrend(data.productData);
      } else {
        setProductTrend([
          { name: 'Aspirin 500mg', revenue: 0 },
          { name: 'Amoxicillin 250mg', revenue: 0 },
          { name: 'Ibuprofen 400mg', revenue: 0 },
          { name: 'Paracetamol 500mg', revenue: 0 },
          { name: 'Cetirizine 10mg', revenue: 0 },
        ]);
      }
    } catch (e) {
      console.warn("Failed to load NSM dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
      return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else if (amount >= 1000) {
      return '₹' + (amount / 1000).toFixed(2) + ' K';
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    }
  };

  const achievementPct = kpis.nationalTarget > 0 ? ((kpis.achievedTarget / kpis.nationalTarget) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6">
      <PageHeader 
        title="National Sales Dashboard" 
        subtitle="Executive overview of national sales performance and targets from database."
      />

      {/* KPI Cards (2 Rows of 3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Assigned National Target"
          value={loading ? "Loading..." : formatCurrency(kpis.nationalTarget)}
          subtitle="FY 2026-27 (PostgreSQL)"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Achieved Target"
          value={loading ? "Loading..." : formatCurrency(kpis.achievedTarget)}
          subtitle={`${achievementPct}% Achievement`}
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Remaining Target"
          value={loading ? "Loading..." : formatCurrency(kpis.remainingTarget)}
          subtitle="Pending realization"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass={kpis.remainingTarget > 0 ? "text-amber-600" : "text-emerald-600"}
          bgClass={kpis.remainingTarget > 0 ? "bg-amber-50" : "bg-emerald-50"}
        />
        <SummaryCard
          title="Active RSMs"
          value={loading ? "..." : kpis.activeRSMCount.toString()}
          subtitle="Direct reports in DB"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="State Coverage"
          value={loading ? "..." : `${kpis.stateCoverage}%`}
          subtitle="Of planned territories"
          icon={<MapPin className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <SummaryCard
          title="Pending Approvals"
          value={loading ? "..." : kpis.pendingApprovals.toString()}
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
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <BarChart data={productTrend} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
