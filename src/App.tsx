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
  AlertCircle,
MapPin,
Stethoscope,
Pill,
Target,
Calendar,
Bell,
Search,
ShoppingBag,
Download,
Truck,

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
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { inventoryService, type InventoryItem } from './services/inventoryService';
import { financeService } from './services/financeService';
import { billingService } from './services/billingService';
import { batchService } from './services/batchService';
import { productService } from './services/productService';
import { getExpiryStatus } from './utils/expiryUtils';
import { inwardStockService } from './services/inwardStockService';
import { outwardStockService } from './services/outwardStockService';
import { warehouseTransferService } from './services/warehouseTransferService';
import { dashboardService } from './services/dashboardService';

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
    iconColor: 'text-brand-primary',
    iconBg: 'bg-brand-light',
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
    iconColor: 'text-brand-primary',
    iconBg: 'bg-brand-light',
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



const criticalAlertsData = [
  { id: 'ALT-001', type: 'Payment Overdue', reference: 'INV-2026-089', priority: 'Critical', date: 'Oct 12, 2026', status: 'Pending' },
  { id: 'ALT-002', type: 'Stock Depletion', reference: 'SKU-PARA-500', priority: 'High', date: 'Oct 12, 2026', status: 'Pending' },
  { id: 'ALT-003', type: 'License Expiry', reference: 'DL-MH-2024', priority: 'Critical', date: 'Oct 11, 2026', status: 'In Progress' },
  { id: 'ALT-004', type: 'Bank Sync Failed', reference: 'HDFC-ACC-109', priority: 'High', date: 'Oct 10, 2026', status: 'Resolved' },
];

/* ── Distributor Dashboard Data (DIST-001 Metro Pharma Distributors) ── */
const distributorOrders = [
  { id: 'ORD-2026-1001', client: 'Retail Pharmacy Hub', status: 'Submitted', amount: '₹9,100', date: '15 Oct 2026' },
  { id: 'ORD-2026-1002', client: 'City Medical Store', status: 'Draft', amount: '₹4,500', date: '16 Oct 2026' },
  { id: 'ORD-2026-1005', client: 'Sunrise Health Care', status: 'Fulfilled', amount: '₹12,350', date: '14 Oct 2026' },
  { id: 'ORD-2026-1006', client: 'Apollo Sub-Depot', status: 'Submitted', amount: '₹7,200', date: '13 Oct 2026' },
];

const distributorNotifications = [
  { id: 'N1', icon: CheckCircle2, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', message: 'Your order ORD-2026-1001 has been dispatched.', time: '2 hours ago' },
  { id: 'N2', icon: IndianRupee, iconColor: 'text-brand-primary', iconBg: 'bg-brand-light', message: 'Payment of ₹9,100 received for INV-2026-089.', time: '5 hours ago' },
  { id: 'N3', icon: FileText, iconColor: 'text-blue-600', iconBg: 'bg-blue-50', message: 'Invoice INV-2026-095 has been generated for your account.', time: '1 day ago' },
  { id: 'N4', icon: Bell, iconColor: 'text-amber-600', iconBg: 'bg-amber-50', message: 'New scheme available for your account: Monsoon Offer 2026.', time: '2 days ago' },
  { id: 'N5', icon: AlertTriangle, iconColor: 'text-rose-600', iconBg: 'bg-rose-50', message: 'Low stock alert: Amoxicillin 500mg (PRD-001) is running low.', time: '3 days ago' },
];

/* ── Retailer Dashboard Data (RET-001 City Medical Store) ── */
const retailerOrders = [
  { id: 'ORD-2026-9081', status: 'Shipped', amount: '₹14,200', date: '15 Oct 2026' },
  { id: 'ORD-2026-9082', status: 'Pending', amount: '₹8,500', date: '16 Oct 2026' },
  { id: 'ORD-2026-9085', status: 'Delivered', amount: '₹22,150', date: '14 Oct 2026' },
  { id: 'ORD-2026-9086', status: 'Shipped', amount: '₹11,400', date: '13 Oct 2026' },
];

const retailerNotifications = [
  { id: 'R1', icon: Truck, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', message: 'Your order ORD-2026-9081 has been dispatched.', time: '1 hour ago' },
  { id: 'R2', icon: FileText, iconColor: 'text-blue-600', iconBg: 'bg-blue-50', message: 'Invoice INV-2026-550 has been generated.', time: '4 hours ago' },
  { id: 'R3', icon: IndianRupee, iconColor: 'text-brand-primary', iconBg: 'bg-brand-light', message: 'Payment of ₹14,200 received successfully.', time: '1 day ago' },
  { id: 'R4', icon: Bell, iconColor: 'text-amber-600', iconBg: 'bg-amber-50', message: 'New promotional scheme available: Winter Wellness.', time: '2 days ago' },
  { id: 'R5', icon: CheckCircle2, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', message: 'Order ORD-2026-9085 delivered successfully.', time: '3 days ago' },
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

function MRDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Load all data from service
    const attendance = dashboardService.getAttendanceStatus();
    const docVisits = dashboardService.getTodayDoctorVisits();
    const chemVisits = dashboardService.getTodayChemistVisits();
    const orders = dashboardService.getTodayOrders();
    const targets = dashboardService.getMonthlyTargetProgress();
    const followUps = dashboardService.getPendingFollowUps();
    const schedule = dashboardService.getTodaySchedule();
    const recentOrders = dashboardService.getRecentOrders();
    const recentVisits = dashboardService.getRecentVisits();
    const notifications = dashboardService.getTodayNotifications();
    const routeSummary = dashboardService.getTodayRouteSummary();

    setData({
      attendance,
      docVisits,
      chemVisits,
      orders,
      targets,
      followUps,
      schedule,
      recentOrders,
      recentVisits,
      notifications, 
      routeSummary 
    });
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

  const isEligibleForIncentive = data.targets.sales.percent >= 100 && 
                                 data.targets.docs.percent >= 100 && 
                                 data.targets.chemists.percent >= 100;
  const estimatedIncentive = isEligibleForIncentive ? Math.round(data.targets.sales.achieved * 0.05) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Top Row: Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Attendance */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className={`p-4 rounded-full ${data.attendance.status === 'Absent' ? 'bg-rose-50 text-rose-600' : data.attendance.status === 'Completed' ? 'bg-brand-light text-brand-primary' : 'bg-emerald-50 text-emerald-600'}`}>
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Attendance</h3>
            <p className="text-xl font-bold text-slate-900">{data.attendance.status}</p>
            <p className="text-xs text-slate-400">
              {data.attendance.status === 'Absent' 
                ? 'Not Checked In' 
                : data.attendance.status === 'Completed' 
                  ? `Out: ${data.attendance.checkOutTime}` 
                  : `In: ${data.attendance.checkInTime}`}
            </p>
          </div>
        </div>

        {/* Doctor Visits */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-full bg-brand-light text-brand-primary">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Doctor Visits</h3>
            <p className="text-xl font-bold text-slate-900">{data.docVisits.completed} / {data.docVisits.target}</p>
            <p className="text-xs text-slate-400">Today's Calls</p>
          </div>
        </div>

        {/* Chemist Visits */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-full bg-amber-50 text-amber-600">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Chemist Visits</h3>
            <p className="text-xl font-bold text-slate-900">{data.chemVisits.completed} / {data.chemVisits.target}</p>
            <p className="text-xs text-slate-400">Today's Calls</p>
          </div>
        </div>

        {/* Orders Booked */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-full bg-blue-50 text-blue-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Orders Booked</h3>
            <p className="text-xl font-bold text-slate-900">{data.orders.count} Orders</p>
            <p className="text-xs text-slate-400">₹{data.orders.amount.toLocaleString()} Today</p>
          </div>
        </div>
      </div>

      {/* Second Row: Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-primary" /> Monthly Target Progress
          </h2>
          <div className="space-y-6">
            {/* Sales Target */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Monthly Sales Target</span>
                <span className="text-sm font-bold text-blue-600">{data.targets.sales.percent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${data.targets.sales.percent}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">₹{data.targets.sales.achieved.toLocaleString()} / ₹{data.targets.sales.target.toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Doctor Target */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Doctor Target</span>
                  <span className="text-sm font-bold text-emerald-600">{data.targets.docs.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${data.targets.docs.percent}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">{data.targets.docs.achieved} / {data.targets.docs.target}</p>
              </div>

              {/* Chemist Target */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Chemist Target</span>
                  <span className="text-sm font-bold text-amber-600">{data.targets.chemists.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${data.targets.chemists.percent}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">{data.targets.chemists.achieved} / {data.targets.chemists.target}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Incentive Estimator */}
        <div className="bg-brand-light p-6 rounded-[24px] border border-brand-primary shadow-sm flex flex-col justify-center text-center">
          <h2 className="text-lg font-bold text-brand-primary mb-2">Incentive Estimator</h2>
          <div className="my-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${isEligibleForIncentive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
              Eligible: {isEligibleForIncentive ? 'Yes' : 'No'}
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-2">Estimated Incentive</p>
          <p className="text-3xl font-extrabold text-brand-primary">₹{estimatedIncentive.toLocaleString()}</p>
          {!isEligibleForIncentive && (
            <p className="text-xs text-brand-primary mt-4">Complete 100% of all active targets to unlock incentives.</p>
          )}
        </div>
      </div>

      {/* Third Row: Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-500" /> Today's Schedule
            </h2>
          </div>
          {data.schedule ? (
            <div className="space-y-4">
              {data.schedule.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="text-sm font-bold text-slate-600 w-16">{item.time}</div>
                  <div className="h-8 w-1 bg-sky-200 rounded-full"></div>
                  <div className="text-sm font-medium text-slate-800">{item.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No schedule planned today.
            </div>
          )}
        </div>

        {/* Pending Follow-Ups */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" /> Pending Follow-Ups
            </h2>
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              {data.followUps.dueTodayCount} Due Today
            </div>
          </div>
          
          {data.followUps.list.length > 0 ? (
            <div className="space-y-4">
              {data.followUps.list.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:border-rose-100 hover:bg-rose-50/30 transition-all">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${item.status === 'Due Today' ? 'text-amber-600 bg-amber-50' : item.status === 'Overdue' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-100'}`}>
                    {item.status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No pending follow-ups.
            </div>
          )}
        </div>
      </div>

      {/* Fourth Row: Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Orders</h2>
          {data.recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentOrders.map((order: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{order.chemistName}</p>
                    <p className="text-xs text-slate-500">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">₹{order.amount.toLocaleString()}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${order.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : order.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No orders placed recently.
            </div>
          )}
        </div>

        {/* Recent Visits */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Visits</h2>
          {data.recentVisits.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentVisits.map((visit: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{visit.name}</p>
                    <p className="text-xs text-slate-500">{visit.type} • {visit.time}</p>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${visit.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {visit.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No visits recorded recently.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const isSuperAdmin = [ROLE_SUPER_ADMIN, 'Super Admin', 'System Administrator'].includes(activeRole);
  const isWarehouseManager = activeRole === ROLE_WAREHOUSE_MANAGER;

  // Fetch raw data — async services loaded into state
  const allInventory = useMemo(() => inventoryService.getAll(), []);
  const allProducts = useMemo(() => productService.getProducts(), []);
  const allBatches = useMemo(() => batchService.getAll(), []);
  const [allInward, setAllInward] = useState<any[]>([]);
  const [allOutward, setAllOutward] = useState<any[]>([]);
  const [allTransfer, setAllTransfer] = useState<any[]>([]);

  useEffect(() => {
    if (!isWarehouseManager) return;
    inwardStockService.getAll().then(setAllInward).catch(() => {});
    outwardStockService.getAll().then(setAllOutward).catch(() => {});
    warehouseTransferService.getAll().then(setAllTransfer).catch(() => {});
  }, [isWarehouseManager]);

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

  // ── Global Dashboard KPIs State ──
  const [globalMetrics, setGlobalMetrics] = useState({
    totalRevenue: 0,
    outstandingReceivables: 0
  });

  useEffect(() => {
    if (![ROLE_SUPER_ADMIN, 'Super Admin', 'System Administrator', ROLE_ACCOUNTANT].includes(activeRole)) return;
    
    const fetchGlobalMetrics = async () => {
      try {
        const invoices = await billingService.loadInvoices();
        const salesTotal = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        
        // Using mock payments until payment endpoints are wired
        const allPayments = JSON.parse(localStorage.getItem('pharma_erp_payments') || '[]');
        const totalPaymentsReceived = allPayments.reduce((sum: number, pay: any) => sum + (pay.amount || 0), 0);
        
        const totalOut = Math.max(0, salesTotal - totalPaymentsReceived);
        
        setGlobalMetrics({
          totalRevenue: salesTotal ?? 0,
          outstandingReceivables: totalOut ?? 0
        });
      } catch (err) {
        console.error("Failed to fetch global metrics for dashboard", err);
      }
    };
    fetchGlobalMetrics();
  }, [activeRole]);

  let displayPrimaryKpis = primaryKpiData;
  let displaySecondaryKpis = secondaryKpiData;

  // Dynamically compute global KPIs if needed
  const globalKpis = useMemo(() => {
    if (![ROLE_SUPER_ADMIN, 'Super Admin', 'System Administrator', ROLE_ACCOUNTANT].includes(activeRole)) return primaryKpiData;
    
    return primaryKpiData.map(kpi => {
      if (kpi.title === 'Total Revenue') {
        return { ...kpi, value: `₹${(globalMetrics.totalRevenue / 1000000).toFixed(1)}M` };
      }
      if (kpi.title === 'Outstanding Receivables') {
        return { ...kpi, value: `₹${(globalMetrics.outstandingReceivables / 1000000).toFixed(1)}M` };
      }
      return kpi;
    });
  }, [activeRole, globalMetrics]);

  displayPrimaryKpis = globalKpis;

  const [distributorData, setDistributorData] = useState({
    activeOrdersCount: 0,
    pendingOrdersCount: 0,
    outstandingAmount: 0,
    pendingInvoicesCount: 0,
    recentOrders: [] as any[],
    notifications: [] as any[],
  });

  useEffect(() => {
    if (activeRole !== ROLE_DISTRIBUTOR) return;

    // Load actual ERP data from LocalStorage
    const allOrders = JSON.parse(localStorage.getItem('pharma_erp_orders') || '[]');
    const allInvoices = JSON.parse(localStorage.getItem('pharma_erp_sales_invoices') || '[]');
    const allPayments = JSON.parse(localStorage.getItem('pharma_erp_payments') || '[]');
    const allDispatches = JSON.parse(localStorage.getItem('pharma_erp_dispatches') || '[]');

    // Assuming we show all distributor data for the local instance, or filter by a specific distributor code if needed.
    // Here we'll process all of them as it represents the distributor's workspace.
    
    // 1. Orders Calculation
    const activeStatuses = ['Approved', 'Processing', 'Shipped', 'In Transit'];
    const pendingStatuses = ['Draft', 'Pending', 'Submitted', 'Awaiting Approval'];
    
    let activeOrdersCount = 0;
    let pendingOrdersCount = 0;
    
    allOrders.forEach((o: any) => {
      if (activeStatuses.includes(o.status)) activeOrdersCount++;
      if (pendingStatuses.includes(o.status)) pendingOrdersCount++;
    });

    // 2. Outstanding Amount & Invoices
    let totalInvoiceAmount = 0;
    let totalPaymentsReceived = 0;
    let pendingInvoicesCount = 0;

    allInvoices.forEach((inv: any) => {
      totalInvoiceAmount += (inv.grandTotal || 0);
      if (inv.paymentStatus !== 'Paid' && inv.status !== 'Completed') {
        pendingInvoicesCount++;
      }
    });

    allPayments.forEach((pay: any) => {
      if (pay.status === 'Completed' || pay.status === 'Approved') {
        totalPaymentsReceived += (pay.amount || 0);
      }
    });

    const outstandingAmount = Math.max(0, totalInvoiceAmount - totalPaymentsReceived);

    // 3. Recent Orders
    const sortedOrders = [...allOrders].sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.orderDate || 0).getTime();
      const dateB = new Date(b.date || b.orderDate || 0).getTime();
      return dateB - dateA;
    }).slice(0, 5).map(o => ({
      id: o.id || o.orderNumber,
      client: o.customerName || o.client || 'Unknown Retailer',
      status: o.status || 'Pending',
      amount: `₹${(o.totalAmount || o.amount || 0).toLocaleString()}`,
      date: (o.date || o.orderDate || new Date().toISOString()).split('T')[0]
    }));

    // 4. Notifications
    const events: any[] = [];
    
    allOrders.slice(-5).forEach((o: any) => {
      events.push({
        id: `ord-${o.id}`,
        timestamp: new Date(o.date || o.orderDate || Date.now()).getTime(),
        icon: o.status === 'Approved' ? CheckCircle2 : ShoppingCart,
        iconColor: o.status === 'Approved' ? 'text-emerald-600' : 'text-blue-600',
        iconBg: o.status === 'Approved' ? 'bg-emerald-50' : 'bg-blue-50',
        message: `Order ${o.id || o.orderNumber} is now ${o.status || 'Pending'}.`,
        time: (o.date || o.orderDate || new Date().toISOString()).split('T')[0]
      });
    });

    allDispatches.slice(-3).forEach((d: any) => {
      events.push({
        id: `disp-${d.id}`,
        timestamp: new Date(d.createdDate || Date.now()).getTime(),
        icon: Truck,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        message: `Dispatch ${d.dispatchNo} created for order ${d.orderId}.`,
        time: (d.createdDate || new Date().toISOString()).split('T')[0]
      });
    });

    allInvoices.slice(-3).forEach((i: any) => {
      events.push({
        id: `inv-${i.id}`,
        timestamp: new Date(i.date || Date.now()).getTime(),
        icon: FileText,
        iconColor: 'text-brand-primary',
        iconBg: 'bg-brand-light',
        message: `Invoice ${i.invoiceNo} generated for ₹${(i.grandTotal || 0).toLocaleString()}.`,
        time: (i.date || new Date().toISOString()).split('T')[0]
      });
    });

    allPayments.slice(-3).forEach((p: any) => {
      events.push({
        id: `pay-${p.id}`,
        timestamp: new Date(p.date || Date.now()).getTime(),
        icon: IndianRupee,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        message: `Payment of ₹${(p.amount || 0).toLocaleString()} received.`,
        time: (p.date || new Date().toISOString()).split('T')[0]
      });
    });

    const sortedNotifications = events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    if (sortedNotifications.length === 0) {
      sortedNotifications.push({
        id: 'empty-notif',
        timestamp: Date.now(),
        icon: Bell,
        iconColor: 'text-slate-400',
        iconBg: 'bg-slate-50',
        message: 'No recent notifications.',
        time: 'Just now'
      });
    }

    setDistributorData({
      activeOrdersCount,
      pendingOrdersCount,
      outstandingAmount,
      pendingInvoicesCount,
      recentOrders: sortedOrders,
      notifications: sortedNotifications
    });
  }, [activeRole]);

  // Distributor KPIs — scoped to logged-in distributor
  const distributorKpis = useMemo(() => {
    if (activeRole !== ROLE_DISTRIBUTOR) return [];
    
    return [
      {
        title: 'Active Orders',
        value: distributorData.activeOrdersCount.toString(),
        trend: 'In progress',
        isPositive: true,
        icon: ShoppingCart,
        iconColor: 'text-cyan-600',
        iconBg: 'bg-cyan-50',
        glowColor: 'rgba(6, 182, 212, 0.55)',
        glowColorIdle: 'rgba(6, 182, 212, 0.22)',
        borderGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #a5f3fc 100%)',
      },
      {
        title: 'Pending Orders',
        value: distributorData.pendingOrdersCount.toString(),
        trend: 'Awaiting submission',
        isPositive: distributorData.pendingOrdersCount === 0,
        icon: Clock,
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-50',
        glowColor: 'rgba(245, 158, 11, 0.55)',
        glowColorIdle: 'rgba(245, 158, 11, 0.22)',
        borderGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)',
      },
      {
        title: 'Outstanding Amount',
        value: `₹${distributorData.outstandingAmount.toLocaleString()}`,
        trend: 'Due this month',
        isPositive: false,
        icon: IndianRupee,
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50',
        glowColor: 'rgba(244, 63, 94, 0.50)',
        glowColorIdle: 'rgba(244, 63, 94, 0.20)',
        borderGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fecdd3 100%)',
      },
      {
        title: 'Pending Invoices',
        value: distributorData.pendingInvoicesCount.toString(),
        trend: 'Needs review',
        isPositive: false,
        icon: FileText,
        iconColor: 'text-brand-primary',
        iconBg: 'bg-brand-light',
        glowColor: 'rgba(99, 102, 241, 0.55)',
        glowColorIdle: 'rgba(99, 102, 241, 0.22)',
        borderGradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #c7d2fe 100%)',
      },
    ];
  }, [activeRole, distributorData]);

  const [retailerData, setRetailerData] = useState({
    activeOrdersCount: 0,
    pendingDeliveriesCount: 0,
    outstandingBalance: 0,
    pendingInvoicesCount: 0,
    recentOrders: [] as any[],
    notifications: [] as any[],
  });

  useEffect(() => {
    if (activeRole !== ROLE_RETAILER) return;

    // Load actual ERP data from LocalStorage
    const allOrders = JSON.parse(localStorage.getItem('pharma_erp_retailer_orders') || '[]');
    const allInvoices = JSON.parse(localStorage.getItem('pharma_erp_sales_invoices') || '[]');
    const allPayments = JSON.parse(localStorage.getItem('pharma_erp_payments') || '[]');
    const allDispatches = JSON.parse(localStorage.getItem('pharma_erp_dispatches') || '[]');

    // 1. Orders Calculation (Retailer placed orders)
    const activeStatuses = ['Approved', 'Processing', 'Shipped', 'In Transit', 'Delivered'];
    const pendingDeliveriesStatuses = ['Pending', 'Submitted', 'Processing', 'Approved']; 
    
    let activeOrdersCount = 0;
    let pendingDeliveriesCount = 0;
    
    allOrders.forEach((o: any) => {
      const status = o.status || 'Pending';
      if (activeStatuses.includes(status)) activeOrdersCount++;
      if (pendingDeliveriesStatuses.includes(status)) pendingDeliveriesCount++;
    });

    // 2. Outstanding Balance & Invoices
    let totalInvoiceAmount = 0;
    let totalPaymentsMade = 0;
    let pendingInvoicesCount = 0;

    allInvoices.forEach((inv: any) => {
      totalInvoiceAmount += (inv.grandTotal || 0);
      if (inv.paymentStatus !== 'Paid' && inv.status !== 'Completed') {
        pendingInvoicesCount++;
      }
    });

    allPayments.forEach((pay: any) => {
      if (pay.status === 'Completed' || pay.status === 'Approved') {
        totalPaymentsMade += (pay.amount || 0);
      }
    });

    const outstandingBalance = Math.max(0, totalInvoiceAmount - totalPaymentsMade);

    // 3. Recent Orders
    const sortedOrders = [...allOrders].sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.orderDate || 0).getTime();
      const dateB = new Date(b.date || b.orderDate || 0).getTime();
      return dateB - dateA;
    }).slice(0, 5).map(o => ({
      id: o.id || o.orderNumber,
      client: o.distributorName || o.distributor || 'Super Stockist',
      status: o.status || 'Pending',
      amount: `₹${(o.totalAmount || o.amount || 0).toLocaleString()}`,
      date: (o.date || o.orderDate || new Date().toISOString()).split('T')[0]
    }));

    // 4. Notifications
    const events: any[] = [];
    
    allOrders.slice(-5).forEach((o: any) => {
      events.push({
        id: `r-ord-${o.id}`,
        timestamp: new Date(o.date || o.orderDate || Date.now()).getTime(),
        icon: o.status === 'Approved' ? CheckCircle2 : ShoppingBag,
        iconColor: o.status === 'Approved' ? 'text-emerald-600' : 'text-blue-600',
        iconBg: o.status === 'Approved' ? 'bg-emerald-50' : 'bg-blue-50',
        message: `Your Order ${o.id || o.orderNumber} is now ${o.status || 'Pending'}.`,
        time: (o.date || o.orderDate || new Date().toISOString()).split('T')[0]
      });
    });

    allDispatches.slice(-3).forEach((d: any) => {
      events.push({
        id: `r-disp-${d.id}`,
        timestamp: new Date(d.createdDate || Date.now()).getTime(),
        icon: Truck,
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-50',
        message: `Your order ${d.orderId} has been dispatched.`,
        time: (d.createdDate || new Date().toISOString()).split('T')[0]
      });
    });

    allInvoices.slice(-3).forEach((i: any) => {
      events.push({
        id: `r-inv-${i.id}`,
        timestamp: new Date(i.date || Date.now()).getTime(),
        icon: FileText,
        iconColor: 'text-brand-primary',
        iconBg: 'bg-brand-light',
        message: `New Invoice ${i.invoiceNo} generated for ₹${(i.grandTotal || 0).toLocaleString()}.`,
        time: (i.date || new Date().toISOString()).split('T')[0]
      });
    });

    allPayments.slice(-3).forEach((p: any) => {
      events.push({
        id: `r-pay-${p.id}`,
        timestamp: new Date(p.date || Date.now()).getTime(),
        icon: IndianRupee,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        message: `Your payment of ₹${(p.amount || 0).toLocaleString()} was received.`,
        time: (p.date || new Date().toISOString()).split('T')[0]
      });
    });

    const sortedNotifications = events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    if (sortedNotifications.length === 0) {
      sortedNotifications.push({
        id: 'r-empty-notif',
        timestamp: Date.now(),
        icon: Bell,
        iconColor: 'text-slate-400',
        iconBg: 'bg-slate-50',
        message: 'No recent notifications.',
        time: 'Just now'
      });
    }

    setRetailerData({
      activeOrdersCount,
      pendingDeliveriesCount,
      outstandingBalance,
      pendingInvoicesCount,
      recentOrders: sortedOrders,
      notifications: sortedNotifications
    });
  }, [activeRole]);

  // Retailer KPIs — scoped to logged-in retailer
  const retailerKpis = useMemo(() => {
    if (activeRole !== ROLE_RETAILER) return [];
    
    return [
      {
        title: 'Active Orders',
        value: retailerData.activeOrdersCount.toString(),
        trend: 'In transit',
        isPositive: true,
        icon: ShoppingBag,
        iconColor: 'text-cyan-600',
        iconBg: 'bg-cyan-50',
        glowColor: 'rgba(6, 182, 212, 0.55)',
        glowColorIdle: 'rgba(6, 182, 212, 0.22)',
        borderGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #a5f3fc 100%)',
      },
      {
        title: 'Pending Deliveries',
        value: retailerData.pendingDeliveriesCount.toString(),
        trend: 'Awaiting dispatch',
        isPositive: retailerData.pendingDeliveriesCount === 0,
        icon: Truck,
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-50',
        glowColor: 'rgba(245, 158, 11, 0.55)',
        glowColorIdle: 'rgba(245, 158, 11, 0.22)',
        borderGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)',
      },
      {
        title: 'Outstanding Balance',
        value: `₹${retailerData.outstandingBalance.toLocaleString()}`,
        trend: 'Due this month',
        isPositive: false,
        icon: IndianRupee,
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50',
        glowColor: 'rgba(244, 63, 94, 0.50)',
        glowColorIdle: 'rgba(244, 63, 94, 0.20)',
        borderGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fecdd3 100%)',
      },
      {
        title: 'Pending Invoices',
        value: retailerData.pendingInvoicesCount.toString(),
        trend: 'Needs review',
        isPositive: false,
        icon: FileText,
        iconColor: 'text-brand-primary',
        iconBg: 'bg-brand-light',
        glowColor: 'rgba(99, 102, 241, 0.55)',
        glowColorIdle: 'rgba(99, 102, 241, 0.22)',
        borderGradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #c7d2fe 100%)',
      },
    ];
  }, [activeRole, retailerData]);

  if (activeRole === ROLE_WAREHOUSE_MANAGER) {
    displayPrimaryKpis = wmKpis;
  } else if (activeRole === ROLE_ACCOUNTANT) {
    displayPrimaryKpis = primaryKpiData.filter(k => ['Total Revenue', 'Outstanding Receivables'].includes(k.title));
  } else if (activeRole === ROLE_DISTRIBUTOR) {
    displayPrimaryKpis = distributorKpis;
  } else if (activeRole === ROLE_RETAILER) {
    displayPrimaryKpis = retailerKpis;
  } else if (activeRole === ROLE_MEDICAL_REPRESENTATIVE) {
    displayPrimaryKpis = primaryKpiData.filter(k => ['Active Orders'].includes(k.title));
  } else if (activeRole === ROLE_TRANSPORT_STAFF) {
    displayPrimaryKpis = primaryKpiData.filter(k => ['Active Orders', 'Critical Alerts'].includes(k.title));
  }

  const showSalesChart = [ROLE_SUPER_ADMIN, ROLE_ACCOUNTANT].includes(activeRole);
  const showInventoryHealth = [ROLE_SUPER_ADMIN, ROLE_WAREHOUSE_MANAGER].includes(activeRole);
  const showRecentOrders = [ROLE_SUPER_ADMIN, ROLE_DISTRIBUTOR, ROLE_RETAILER, ROLE_MEDICAL_REPRESENTATIVE, ROLE_ACCOUNTANT, ROLE_WAREHOUSE_MANAGER].includes(activeRole);

  if (activeRole === ROLE_MEDICAL_REPRESENTATIVE) {
    return <MRDashboard />;
  }

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
                  <button className="text-sm font-medium text-brand-primary hover:text-brand-primary transition-colors">
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
                {/* ── Action Center for Warehouse Manager ── */}
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
       {/* {isSuperAdmin && (
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
        )} */}

        {/* ── Recent Orders Table ── */}
        {showRecentOrders && (
          <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
<h2 className="text-lg font-bold text-slate-800">
  {isWarehouseManager ? 'Recent Inventory Activities' : 'Recent Orders'}
</h2>

<button
  onClick={() => {
    if (isWarehouseManager) {
      navigate('/workspace/inventory/multi-location');
    } else if (activeRole === ROLE_DISTRIBUTOR) {
      navigate('/workspace/distributors/orders');
    } else if (activeRole === ROLE_RETAILER) {
      navigate('/workspace/retailers/orders');
    } else {
      navigate('/workspace/distributors/orders');
    }
  }}
  className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-primary transition-colors"
>
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
</tr>
) : activeRole === ROLE_DISTRIBUTOR ? (
  <tr className="bg-slate-50/50">
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Order ID
    </th>
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Customer / Retailer
    </th>
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Status
    </th>
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Amount
    </th>
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Order Date
    </th>
  </tr>
) : activeRole === ROLE_RETAILER ? (
  <tr className="bg-slate-50/50">
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Order ID
    </th>
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Order Date
    </th>
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Status
    </th>
    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Amount
    </th>
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
                      let statusColor = act.activity === 'Inward Stock' ? 'text-emerald-600' : (act.activity === 'Outward Stock' ? 'text-brand-primary' : 'text-blue-600');
                      let statusBg = act.activity === 'Inward Stock' ? 'bg-emerald-50' : (act.activity === 'Outward Stock' ? 'bg-brand-light' : 'bg-blue-50');
                      return (
                        <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 text-sm font-medium text-slate-500">{new Date(act.date).toLocaleDateString()}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBg} ${statusColor}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {act.activity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">
                                {allProducts.find(p => p.code === act.product || p.name === act.product)?.name || act.product}
                              </span>
                              {allProducts.find(p => p.code === act.product || p.name === act.product)?.code && (
                                <span className="text-xs font-medium text-slate-500 mt-0.5">
                                  {allProducts.find(p => p.code === act.product || p.name === act.product)?.code}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-slate-600">{act.batch}</td>
                          <td className="py-4 px-6 text-sm font-medium text-slate-600">{act.warehouse}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">No recent activities found</td>
                      </tr>
                    )
                  ) : activeRole === ROLE_DISTRIBUTOR ? (
                    /* ── Distributor read-only order rows (no Actions column) ── */
                    distributorData.recentOrders.length > 0 ? distributorData.recentOrders.map((order) => {
                      let StatusIcon = Clock;
                      let statusColor = 'text-amber-600';
                      let statusBg = 'bg-amber-50';
                      if (order.status === 'Approved' || order.status === 'Processing' || order.status === 'Shipped') {
                        StatusIcon = CheckCircle2;
                        statusColor = 'text-emerald-600';
                        statusBg = 'bg-emerald-50';
                      } else if (order.status === 'Cancelled' || order.status === 'Rejected') {
                        StatusIcon = XCircle;
                        statusColor = 'text-rose-600';
                        statusBg = 'bg-rose-50';
                      }
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors cursor-default">
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
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-sm bg-slate-50/50">
                          No recent orders found.
                        </td>
                      </tr>
                    )
                  ) : activeRole === ROLE_RETAILER ? (
                    /* ── Retailer read-only order rows (no Actions column) ── */
                    retailerData.recentOrders.length > 0 ? retailerData.recentOrders.map((order) => {
                      let StatusIcon = Clock;
                      let statusColor = 'text-amber-600';
                      let statusBg = 'bg-amber-50';
                      if (order.status === 'Approved' || order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') {
                        StatusIcon = CheckCircle2;
                        statusColor = 'text-emerald-600';
                        statusBg = 'bg-emerald-50';
                      } else if (order.status === 'Cancelled' || order.status === 'Rejected') {
                        StatusIcon = XCircle;
                        statusColor = 'text-rose-600';
                        statusBg = 'bg-rose-50';
                      }
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors cursor-default">
                          <td className="py-4 px-6 text-sm font-bold text-slate-800">{order.id}</td>
                          <td className="py-4 px-6 text-sm font-medium text-slate-500">{order.date}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBg} ${statusColor}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-slate-700">{order.amount}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 text-sm bg-slate-50/50">
                          No recent orders found.
                        </td>
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

        {/* ── Distributor & Retailer: Recent Notifications ── */}
        {(activeRole === ROLE_DISTRIBUTOR || activeRole === ROLE_RETAILER) && (
          <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-primary" />
                Recent Notifications
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {(activeRole === ROLE_DISTRIBUTOR ? distributorData.notifications : activeRole === ROLE_RETAILER ? retailerData.notifications : retailerNotifications).map((n) => (
                <li key={n.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.iconBg}`}>
                    <n.icon className={`w-4 h-4 ${n.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ── Critical Alerts Table (Super Admin Only) ── */}
        {isSuperAdmin && (
          <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Critical Alerts
              </h2>
              <button className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-primary transition-colors">
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
                          <button className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-light rounded-full transition-colors outline-none">
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

