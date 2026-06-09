import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  AlertTriangle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ROLE_SUPER_ADMIN,
  ROLE_WAREHOUSE_MANAGER,
  ROLE_ACCOUNTANT,
  ROLE_DISTRIBUTOR,
  ROLE_RETAILER,
  ROLE_MEDICAL_REPRESENTATIVE,
  ROLE_TRANSPORT_STAFF,
} from './constants/roles';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/* ── Mock Data ───────────────────────────────────────────────────── */

// Each KPI carries its glow palette: border gradient + box-shadow color
const kpiData = [
  {
    title: 'Monthly Revenue',
    value: '₹12.4M',
    trend: '+14.5%',
    isPositive: true,
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    // Mint green glow
    glowColor: 'rgba(26, 188, 156, 0.55)',
    glowColorIdle: 'rgba(26, 188, 156, 0.25)',
    borderGradient: 'linear-gradient(135deg, #1abc9c 0%, #00d9a3 50%, #a7f3d0 100%)',
  },
  {
    title: 'Total SKUs',
    value: '4,892',
    trend: '+2.1%',
    isPositive: true,
    icon: Package,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    // Indigo glow
    glowColor: 'rgba(99, 102, 241, 0.55)',
    glowColorIdle: 'rgba(99, 102, 241, 0.22)',
    borderGradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #c7d2fe 100%)',
  },
  {
    title: 'Orders Processed',
    value: '1,284',
    trend: '-4.2%',
    isPositive: false,
    icon: ShoppingCart,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50',
    // Cyan blue glow
    glowColor: 'rgba(6, 182, 212, 0.55)',
    glowColorIdle: 'rgba(6, 182, 212, 0.22)',
    borderGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #a5f3fc 100%)',
  },
  {
    title: 'Critical Alerts',
    value: '3',
    trend: 'Needs action',
    isPositive: false,
    icon: AlertTriangle,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    // Soft red glow
    glowColor: 'rgba(244, 63, 94, 0.50)',
    glowColorIdle: 'rgba(244, 63, 94, 0.20)',
    borderGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fecdd3 100%)',
  },
];

const salesData = [
  { name: 'Week 1', sales: 4000 },
  { name: 'Week 2', sales: 3000 },
  { name: 'Week 3', sales: 5000 },
  { name: 'Week 4', sales: 4500 },
  { name: 'Week 5', sales: 6000 },
  { name: 'Week 6', sales: 5500 },
];

const inventoryData = [
  { name: 'Stable', value: 75, color: '#10b981' },
  { name: 'Low', value: 15, color: '#f59e0b' },
  { name: 'Critical', value: 10, color: '#ef4444' },
];

const recentOrders = [
  { id: 'ORD-8901', client: 'Apollo Hospitals', status: 'Shipped', amount: '₹1,24,000', date: 'Oct 12, 2026' },
  { id: 'ORD-8902', client: 'Care Pharmacy', status: 'Pending', amount: '₹45,500', date: 'Oct 12, 2026' },
  { id: 'ORD-8903', client: 'MediPlus Network', status: 'Failed', amount: '₹89,200', date: 'Oct 11, 2026' },
  { id: 'ORD-8904', client: 'City Clinic', status: 'Shipped', amount: '₹12,400', date: 'Oct 10, 2026' },
];

/* ── Animation Helpers ───────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

import { GlowCard } from './components/ui/GlowCard';

/* ── Dashboard Component ─────────────────────────────────────────── */
export default function Dashboard() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;

  let displayKpis = kpiData;
  if (activeRole === ROLE_WAREHOUSE_MANAGER) {
    displayKpis = kpiData.filter(k => ['Total SKUs', 'Orders Processed', 'Critical Alerts'].includes(k.title));
  } else if (activeRole === ROLE_ACCOUNTANT) {
    displayKpis = kpiData.filter(k => ['Monthly Revenue', 'Orders Processed'].includes(k.title));
  } else if (activeRole === ROLE_DISTRIBUTOR || activeRole === ROLE_RETAILER) {
    displayKpis = kpiData.filter(k => ['Orders Processed'].includes(k.title));
  } else if (activeRole === ROLE_MEDICAL_REPRESENTATIVE) {
    displayKpis = kpiData.filter(k => ['Orders Processed'].includes(k.title));
  } else if (activeRole === ROLE_TRANSPORT_STAFF) {
    displayKpis = kpiData.filter(k => ['Orders Processed', 'Critical Alerts'].includes(k.title));
  }

  const showSalesChart = [ROLE_SUPER_ADMIN, ROLE_ACCOUNTANT].includes(activeRole);
  const showInventoryHealth = [ROLE_SUPER_ADMIN, ROLE_WAREHOUSE_MANAGER].includes(activeRole);
  const showRecentOrders = [ROLE_SUPER_ADMIN, ROLE_DISTRIBUTOR, ROLE_RETAILER, ROLE_MEDICAL_REPRESENTATIVE, ROLE_ACCOUNTANT, ROLE_WAREHOUSE_MANAGER].includes(activeRole);

  return (
    <div className="pb-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 text-base">
          Welcome back! Here is what's happening today.
        </p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayKpis.map((kpi, idx) => (
            <GlowCard
              key={idx}
              borderGradient={kpi.borderGradient}
              glowColor={kpi.glowColor}
              glowColorIdle={kpi.glowColorIdle}
              animationVariants={itemVariants}
              animationDelay={idx * 1.5} // stagger idle pulse so they don't all pulse together
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {kpi.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {kpi.trend}
                </div>
              </div>
              <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{kpi.title}</h3>
                <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
              </div>
            </GlowCard>
          ))}
        </div>

        {/* ── Charts & Stock Panel ── */}
        {(showSalesChart || showInventoryHealth) && (
          <div className={`grid grid-cols-1 ${showSalesChart && showInventoryHealth ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
            {/* Sales Performance Trend */}
            {showSalesChart && (
            <motion.div
              variants={itemVariants}
              className={`${showInventoryHealth ? 'lg:col-span-2' : ''} bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300`}
            >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Sales Performance Trend</h2>
              <button className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                View Full Report
              </button>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          )}

          {/* Inventory Health */}
          {showInventoryHealth && (
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
          >
            <h2 className="text-lg font-bold text-slate-800 mb-2">Inventory Health</h2>

            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">75%</span>
                <span className="text-xs text-slate-500 font-medium">Stable</span>
              </div>
            </div>

            <div className="mt-auto pt-4 space-y-3">
              {inventoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-600">{item.name} Stock</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
          )}
        </div>
        )}

        {/* ── Recent Orders Table ── */}
        {showRecentOrders && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
            <button className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  let StatusIcon = Clock;
                  let statusColor = 'text-amber-600';
                  let statusBg = 'bg-amber-50';

                  if (order.status === 'Shipped') {
                    StatusIcon = CheckCircle2;
                    statusColor = 'text-emerald-600';
                    statusBg = 'bg-emerald-50';
                  } else if (order.status === 'Failed') {
                    StatusIcon = XCircle;
                    statusColor = 'text-rose-600';
                    statusBg = 'bg-rose-50';
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-sm font-bold text-slate-800">{order.id}</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-600">{order.client}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBg} ${statusColor}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-700">{order.amount}</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-500">{order.date}</td>
                      <td className="py-4 px-6 text-right">
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
        )}
      </motion.div>
    </div>
  );
}
