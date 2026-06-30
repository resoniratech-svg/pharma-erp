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
  Eye,
  PlusCircle,
  FileText,
  IndianRupee,
  Building,
  FileClock,
  AlertCircle
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
import { GlowCard } from './components/ui/GlowCard';
import { useMemo } from 'react';
import { inventoryService } from './services/inventoryService';
import { batchService } from './services/batchService';
import { productService } from './services/productService';
import { getExpiryStatus } from './utils/expiryUtils';
import { inwardStockService } from './services/inwardStockService';
import { outwardStockService } from './services/outwardStockService';
import { warehouseTransferService } from './services/warehouseTransferService';

/* ── Mock Data ───────────────────────────────────────────────────── */

const primaryKpiData = [
  {
    title: 'Total Revenue',
    value: '₹12.4M',
    trend: '+14.5%',
    isPositive: true,
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    glowColor: 'rgba(26, 188, 156, 0.55)',
    glowColorIdle: 'rgba(26, 188, 156, 0.25)',
    borderGradient: 'linear-gradient(135deg, #1abc9c 0%, #00d9a3 50%, #a7f3d0 100%)',
  },
  {
    title: 'Outstanding Receivables',
    value: '₹3.2M',
    trend: '-2.4%',
    isPositive: false,
    icon: TrendingDown,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    glowColor: 'rgba(99, 102, 241, 0.55)',
    glowColorIdle: 'rgba(99, 102, 241, 0.22)',
    borderGradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #c7d2fe 100%)',
  },
  {
    title: 'Active Orders',
    value: '1,284',
    trend: '+5.2%',
    isPositive: true,
    icon: ShoppingCart,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    glowColorIdle: 'rgba(6, 182, 212, 0.22)',
    borderGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #a5f3fc 100%)',
  },
  {
    title: 'Critical Alerts',
    value: '12',
    trend: 'Needs action',
    isPositive: false,
    icon: AlertTriangle,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    glowColor: 'rgba(244, 63, 94, 0.50)',
    glowColorIdle: 'rgba(244, 63, 94, 0.20)',
    borderGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fecdd3 100%)',
  },
];

const secondaryKpiData = [
  {
    title: 'Inventory Value',
    value: '₹45.6M',
    trend: '+1.2%',
    isPositive: true,
    icon: Package,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    glowColor: 'rgba(59, 130, 246, 0.55)',
    glowColorIdle: 'rgba(59, 130, 246, 0.22)',
    borderGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #bfdbfe 100%)',
  },
  {
    title: 'Expiring Products',
    value: '84',
    trend: '-12%',
    isPositive: true,
    icon: Clock,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    glowColorIdle: 'rgba(245, 158, 11, 0.22)',
    borderGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)',
  },
  {
    title: 'Pending Dispatches',
    value: '156',
    trend: '+8%',
    isPositive: false,
    icon: ArrowRight,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    glowColor: 'rgba(79, 70, 229, 0.55)',
    glowColorIdle: 'rgba(79, 70, 229, 0.22)',
    borderGradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 50%, #c7d2fe 100%)',
  },
  {
    title: 'GST Payable',
    value: '₹1.8M',
    trend: 'Due in 5 days',
    isPositive: false,
    icon: FileText,
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-50',
    glowColor: 'rgba(236, 72, 153, 0.55)',
    glowColorIdle: 'rgba(236, 72, 153, 0.22)',
    borderGradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #fbcfe8 100%)',
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

const quickActions = [
  { label: 'Create Sales Order', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Create Purchase Order', icon: Package, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Add Product', icon: PlusCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Create Invoice', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Record Payment', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Bank Reconciliation', icon: Building, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'View Outstanding', icon: FileClock, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'View Critical Alerts', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
];

const criticalAlertsData = [
  { id: 'ALT-001', type: 'Payment Overdue', reference: 'INV-2026-089', priority: 'Critical', date: 'Oct 12, 2026', status: 'Pending' },
  { id: 'ALT-002', type: 'Stock Depletion', reference: 'SKU-PARA-500', priority: 'High', date: 'Oct 12, 2026', status: 'Pending' },
  { id: 'ALT-003', type: 'License Expiry', reference: 'DL-MH-2024', priority: 'Critical', date: 'Oct 11, 2026', status: 'In Progress' },
  { id: 'ALT-004', type: 'Bank Sync Failed', reference: 'HDFC-ACC-109', priority: 'High', date: 'Oct 10, 2026', status: 'Resolved' },
];

/* ── Animation Helpers ───────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const isSuperAdmin = [ROLE_SUPER_ADMIN, 'Super Admin', 'System Administrator'].includes(activeRole);
  const isWarehouseManager = activeRole === ROLE_WAREHOUSE_MANAGER;

  // Fetch raw data
  const allInventory = useMemo(() => inventoryService.getAll(), []);
  const allProducts = useMemo(() => productService.getProducts(), []);
  const allBatches = useMemo(() => batchService.getAll(), []);
  const allInward = useMemo(() => inwardStockService.getAll(), []);
  const allOutward = useMemo(() => outwardStockService.getAll(), []);
  const allTransfer = useMemo(() => warehouseTransferService.getAll(), []);

  // Calculate KPIs
  const wmKpis = useMemo(() => {
    if (!isWarehouseManager) return [];
    let totalInventory = 0;
    let lowStockAlerts = 0;
    let nearExpiryBatches = new Set();
    let expiredBatches = new Set();
    
    allInventory.forEach(inv => {
      totalInventory += inv.availableQty;
      const prod = allProducts.find(p => p.code === inv.productCode);
      if (prod && prod.minimumStock) {
         if (inv.availableQty < parseInt(prod.minimumStock)) {
             lowStockAlerts++;
         }
      }
      const batch = allBatches.find(b => b.batchNo === inv.batchNo);
      if (batch) {
        const status = getExpiryStatus(batch.expDate);
        if (status === "Near Expiry") nearExpiryBatches.add(batch.batchNo);
        if (status === "Expired") expiredBatches.add(batch.batchNo);
      }
    });

    return [
      {
        title: 'Total Inventory',
        value: totalInventory.toLocaleString(),
        trend: 'Current Stock',
        isPositive: true,
        icon: Package,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        glowColor: 'rgba(59, 130, 246, 0.55)',
        glowColorIdle: 'rgba(59, 130, 246, 0.22)',
        borderGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #bfdbfe 100%)',
      },
      {
        title: 'Low Stock Alerts',
        value: lowStockAlerts.toString(),
        trend: 'Needs action',
        isPositive: lowStockAlerts === 0,
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-50',
        glowColor: 'rgba(245, 158, 11, 0.55)',
        glowColorIdle: 'rgba(245, 158, 11, 0.22)',
        borderGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)',
      },
      {
        title: 'Near Expiry Batches',
        value: nearExpiryBatches.size.toString(),
        trend: 'Review soon',
        isPositive: nearExpiryBatches.size === 0,
        icon: Clock,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-50',
        glowColor: 'rgba(249, 115, 22, 0.55)',
        glowColorIdle: 'rgba(249, 115, 22, 0.22)',
        borderGradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fed7aa 100%)',
      },
      {
        title: 'Expired Batches',
        value: expiredBatches.size.toString(),
        trend: 'Remove immediately',
        isPositive: expiredBatches.size === 0,
        icon: XCircle,
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50',
        glowColor: 'rgba(244, 63, 94, 0.50)',
        glowColorIdle: 'rgba(244, 63, 94, 0.20)',
        borderGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fecdd3 100%)',
      }
    ];
  }, [isWarehouseManager, allInventory, allProducts, allBatches]);

  // Calculate Chart data
  const wmChartData = useMemo(() => {
    if (!isWarehouseManager) return [];
    let healthy = 0;
    let low = 0;
    let nearExpiry = 0;
    let expired = 0;

    allInventory.forEach(inv => {
      let qty = inv.availableQty;
      const prod = allProducts.find(p => p.code === inv.productCode);
      const batch = allBatches.find(b => b.batchNo === inv.batchNo);
      
      let isLow = false;
      if (prod && prod.minimumStock && inv.availableQty < parseInt(prod.minimumStock)) {
          isLow = true;
      }

      let expiryStat = "Healthy";
      if (batch) {
         expiryStat = getExpiryStatus(batch.expDate);
      }

      if (expiryStat === "Expired") {
          expired += qty;
      } else if (expiryStat === "Near Expiry") {
          nearExpiry += qty;
      } else if (isLow) {
          low += qty;
      } else {
          healthy += qty;
      }
    });

    return [
      { name: 'Healthy', value: healthy, color: '#10b981' },
      { name: 'Low Stock', value: low, color: '#f59e0b' },
      { name: 'Near Expiry', value: nearExpiry, color: '#f97316' },
      { name: 'Expired', value: expired, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [isWarehouseManager, allInventory, allProducts, allBatches]);

  // Activities
  const wmActivities = useMemo(() => {
    if (!isWarehouseManager) return [];
    const list: any[] = [];
    allInward.forEach(i => list.push({ date: i.date, id: i.id, activity: 'Inward Stock', product: i.products?.[0]?.product || 'Multiple', batch: i.products?.[0]?.batchNo || '-', warehouse: i.warehouseName }));
    allOutward.forEach(o => list.push({ date: o.date, id: o.id, activity: 'Outward Stock', product: o.products?.[0]?.product || 'Multiple', batch: o.products?.[0]?.batchNo || '-', warehouse: o.warehouseName }));
    allTransfer.forEach(t => list.push({ date: t.date, id: t.id, activity: 'Warehouse Transfer', product: t.products?.[0]?.product || 'Multiple', batch: t.products?.[0]?.batchNo || '-', warehouse: t.fromWarehouseName + ' -> ' + t.toWarehouseName }));
    
    return list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [isWarehouseManager, allInward, allOutward, allTransfer]);

  // Critical alerts count
  const wmAlertCounts = useMemo(() => {
    if (!isWarehouseManager || wmKpis.length === 0) return null;
    const lowCount = wmKpis[1].value;
    const nearCount = wmKpis[2].value;
    const expCount = wmKpis[3].value;
    return { lowCount, nearCount, expCount };
  }, [isWarehouseManager, wmKpis]);

  let displayPrimaryKpis = primaryKpiData;
  let displaySecondaryKpis = secondaryKpiData;

  if (activeRole === ROLE_WAREHOUSE_MANAGER) {
    displayPrimaryKpis = wmKpis;
  } else if (activeRole === ROLE_ACCOUNTANT) {
    displayPrimaryKpis = primaryKpiData.filter(k => ['Total Revenue', 'Outstanding Receivables'].includes(k.title));
  } else if (activeRole === ROLE_DISTRIBUTOR || activeRole === ROLE_RETAILER || activeRole === ROLE_MEDICAL_REPRESENTATIVE) {
    displayPrimaryKpis = primaryKpiData.filter(k => ['Active Orders'].includes(k.title));
  } else if (activeRole === ROLE_TRANSPORT_STAFF) {
    displayPrimaryKpis = primaryKpiData.filter(k => ['Active Orders', 'Critical Alerts'].includes(k.title));
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
        {/* ── Primary KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayPrimaryKpis.map((kpi, idx) => (
            <GlowCard
              key={idx}
              borderGradient={kpi.borderGradient}
              glowColor={kpi.glowColor}
              glowColorIdle={kpi.glowColorIdle}
              animationVariants={itemVariants}
              animationDelay={idx * 1.5}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
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

        {/* ── Secondary KPI Cards (Super Admin Only) ── */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displaySecondaryKpis.map((kpi, idx) => (
              <GlowCard
                key={`sec-${idx}`}
                borderGradient={kpi.borderGradient}
                glowColor={kpi.glowColor}
                glowColorIdle={kpi.glowColorIdle}
                animationVariants={itemVariants}
                animationDelay={idx * 1.5}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpi.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {kpi.trend}
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-1">{kpi.title}</h3>
                  <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        )}

        {/* ── Charts & Stock Panel ── */}
        {(showSalesChart || showInventoryHealth) && (
          <div className={`grid grid-cols-1 ${showSalesChart && showInventoryHealth ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
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
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="sales" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {showInventoryHealth && (
              <motion.div
                variants={itemVariants}
                className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                <h2 className="text-lg font-bold text-slate-800 mb-2">Inventory Health</h2>
                <div className="h-[180px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={isWarehouseManager ? wmChartData : inventoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                        {(isWarehouseManager ? wmChartData : inventoryData).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-800">
                      {isWarehouseManager ? (wmChartData.find(d => d.name === 'Healthy')?.value || 0).toLocaleString() : '75%'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Healthy</span>
                  </div>
                </div>
                <div className="mt-auto pt-4 space-y-3">
                  {(isWarehouseManager ? wmChartData : inventoryData).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-slate-600">{item.name} Stock</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {isWarehouseManager ? item.value.toLocaleString() : `${item.value}%`}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* ── Critical Alerts for Warehouse Manager ── */}
                {isWarehouseManager && wmAlertCounts && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500" /> Critical Alerts
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-amber-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-amber-700">{wmAlertCounts.lowCount}</div>
                        <div className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">Low Stock</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-orange-700">{wmAlertCounts.nearCount}</div>
                        <div className="text-[10px] font-medium text-orange-600 uppercase tracking-wider">Near Expiry</div>
                      </div>
                      <div className="bg-rose-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-rose-700">{wmAlertCounts.expCount}</div>
                        <div className="text-[10px] font-medium text-rose-600 uppercase tracking-wider">Expired</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* ── Quick Actions (Super Admin Only - Fully Hidden from Distributors) ── */}
        {isSuperAdmin && (
          <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-violet-200 hover:shadow-sm transition-all group bg-slate-50/50 hover:bg-white"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.bg} group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recent Orders Table ── */}
        {showRecentOrders && (
          <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{isWarehouseManager ? 'Recent Inventory Activities' : 'Recent Orders'}</h2>
              <button className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {isWarehouseManager ? (
                    <tr className="bg-slate-50/50">
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  ) : (
                    <tr className="bg-slate-50/50">
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isWarehouseManager ? (
                    wmActivities.length > 0 ? wmActivities.map((act) => {
                      let StatusIcon = act.activity === 'Inward Stock' ? ArrowRight : (act.activity === 'Outward Stock' ? TrendingUp : Package);
                      let statusColor = act.activity === 'Inward Stock' ? 'text-emerald-600' : (act.activity === 'Outward Stock' ? 'text-violet-600' : 'text-blue-600');
                      let statusBg = act.activity === 'Inward Stock' ? 'bg-emerald-50' : (act.activity === 'Outward Stock' ? 'bg-violet-50' : 'bg-blue-50');

                      return (
                        <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 text-sm font-medium text-slate-500">{new Date(act.date).toLocaleDateString()}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBg} ${statusColor}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {act.activity}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-slate-800">{act.product}</td>
                          <td className="py-4 px-6 text-sm font-medium text-slate-600">{act.batch}</td>
                          <td className="py-4 px-6 text-sm font-medium text-slate-600">{act.warehouse}</td>
                          <td className="py-4 px-6 text-right">
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors outline-none">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">No recent activities found</td>
                      </tr>
                    )
                  ) : (
                    recentOrders.map((order) => {
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
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors outline-none">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Critical Alerts Table (Super Admin Only) ── */}
        {isSuperAdmin && (
          <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Critical Alerts
              </h2>
              <button className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                View Action Center <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Alert Type</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criticalAlertsData.map((alert) => {
                    let priorityColor = 'bg-amber-100 text-amber-700';
                    if (alert.priority === 'Critical') priorityColor = 'bg-rose-100 text-rose-700';
                    if (alert.priority === 'High') priorityColor = 'bg-orange-100 text-orange-700';

                    return (
                      <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 text-sm font-bold text-slate-800">{alert.type}</td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-600">{alert.reference}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${priorityColor}`}>
                            {alert.priority}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-500">{alert.date}</td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-600">{alert.status}</td>
                        <td className="py-4 px-6 text-right">
                          <button className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors outline-none">
                            <Eye className="w-5 h-5" />
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