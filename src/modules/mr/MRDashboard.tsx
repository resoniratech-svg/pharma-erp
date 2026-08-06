import { useEffect, useState } from 'react';
import { 
  MapPin, 
  Stethoscope, 
  Pill, 
  ShoppingCart, 
  Target, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Bell, 
  Map,
  ArrowRight,
  TrendingUp,
  Award,
  FileText,
  UserCheck
} from 'lucide-react';
import { mrService, type MRDashboardKPIs } from '../../services/mrService';
import { doctorVisitService } from '../../services/doctorVisitService';
import { chemistVisitService } from '../../services/chemistVisitService';
import { tourPlanService } from '../../services/tourPlanService';
import { attendanceService } from '../../services/attendanceService';
import { retailerOrderService } from '../../services/retailerOrderService';
import { dashboardService } from '../../services/dashboardService';

export default function MRDashboard() {
  const [kpis, setKpis] = useState<MRDashboardKPIs | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const mrId = Number(localStorage.getItem('mrId') || '1');
        
        const [mrKpis, _docVisits, _chemVisits, _tourPlans, _attendance, _orders] = await Promise.all([
          mrService.getDashboardKPIs('2026-27'),
          doctorVisitService.loadDoctorVisits(mrId).catch(() => []),
          chemistVisitService.loadChemistVisits(mrId).catch(() => []),
          tourPlanService.loadTourPlans(mrId).catch(() => []),
          attendanceService.getAttendanceHistory(mrId).catch(() => []),
          retailerOrderService.getRetailerOrders().catch(() => []),
        ]);

        setKpis(mrKpis);

        const attendance = dashboardService.getAttendanceStatus(_attendance);
        const docVisits = dashboardService.getTodayDoctorVisits(_docVisits);
        const chemVisits = dashboardService.getTodayChemistVisits(_chemVisits);
        const orders = dashboardService.getTodayOrders(_orders);
        const targets = dashboardService.getMonthlyTargetProgress(_docVisits, _chemVisits, _orders);
        const followUps = dashboardService.getPendingFollowUps(_docVisits);
        const schedule = dashboardService.getTodaySchedule(_docVisits);
        const recentOrders = dashboardService.getRecentOrders(_orders);
        const recentVisits = dashboardService.getRecentVisits(_docVisits, _chemVisits);
        const notifications = dashboardService.getTodayNotifications(_docVisits);
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
      } catch (error) {
        console.error("Failed to load MR dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  if (loading && !data) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

  const assignedTarget = kpis?.assignedTarget || (data?.targets?.sales?.target || 0);
  const salesAchieved = kpis?.targetAchievement || (data?.targets?.sales?.achieved || 0);
  const remainingTarget = kpis?.remainingTarget ?? Math.max(0, assignedTarget - salesAchieved);
  const salesPercent = kpis ? kpis.achievementPercentage : (data?.targets?.sales?.percent || 0);

  const docCount = kpis?.doctorVisitCount ?? (data?.docVisits?.completed || 0);
  const chemCount = kpis?.chemistVisitCount ?? (data?.chemVisits?.completed || 0);
  const ordersCount = kpis?.totalOrdersBooked ?? (data?.orders?.count || 0);
  const ordersAmount = kpis?.totalOrderValue ?? (data?.orders?.amount || 0);

  const isEligibleForIncentive = salesPercent >= 100;
  const estimatedIncentive = isEligibleForIncentive ? Math.round(salesAchieved * 0.05) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* MR Profile & FY Banner */}
      <div className="bg-gradient-to-r from-[#163c78] to-[#255ab5] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Target className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Welcome back, {kpis?.mrName || 'Medical Representative'}</h2>
              <p className="text-blue-100 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> {kpis?.hqArea || 'Headquarters'} | FY {kpis?.financialYear || '2026-27'}
              </p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-right">
              <div className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-0.5">YTD Sales</div>
              <div className="text-xl font-bold">₹{(kpis?.targetAchievement || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doctors KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{data?.docVisits?.completed || docCount} <span className="text-sm font-medium text-slate-400">/ {data?.docVisits?.target || 15}</span></h3>
          <p className="text-sm text-slate-500 font-medium">Doctor Visits</p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(((data?.docVisits?.completed || 0) / (data?.docVisits?.target || 15)) * 100, 100)}%` }}></div>
          </div>
        </div>

        {/* Chemists KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Pill className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{data?.chemVisits?.completed || chemCount} <span className="text-sm font-medium text-slate-400">/ {data?.chemVisits?.target || 10}</span></h3>
          <p className="text-sm text-slate-500 font-medium">Chemist Visits</p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(((data?.chemVisits?.completed || 0) / (data?.chemVisits?.target || 10)) * 100, 100)}%` }}></div>
          </div>
        </div>

        {/* Orders KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{data?.orders?.count || ordersCount}</h3>
          <p className="text-sm text-slate-500 font-medium">Orders Booked (POB)</p>
          <p className="text-xs font-bold text-purple-600 mt-2 bg-purple-50 inline-block px-2 py-1 rounded">₹{(data?.orders?.amount || ordersAmount).toLocaleString()}</p>
        </div>

        {/* Target KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Month</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{salesPercent}%</h3>
          <p className="text-sm text-slate-500 font-medium">Sales Target Met</p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(salesPercent, 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Target Progress & Incentive Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Monthly Target Tracker
              </h3>
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                {new Date().toLocaleString('default', { month: 'long' })}
              </span>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Sales Achieved</p>
                  <p className="text-2xl font-bold text-slate-900">₹{salesAchieved.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500 mb-1">Assigned Target</p>
                  <p className="text-lg font-bold text-slate-400">₹{assignedTarget.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${salesPercent >= 100 ? 'bg-emerald-500' : 'bg-[#163c78]'}`} 
                  style={{ width: `${Math.min(salesPercent, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-6">
                <span>{salesPercent}% Completed</span>
                <span>₹{remainingTarget.toLocaleString()} Remaining</span>
              </div>

              {/* Incentive Eligibility Block */}
              <div className={`p-4 rounded-xl border ${isEligibleForIncentive ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full shrink-0 ${isEligibleForIncentive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-1 ${isEligibleForIncentive ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {isEligibleForIncentive ? 'Incentive Unlocked!' : 'Incentive Eligibility'}
                    </h4>
                    <p className={`text-xs ${isEligibleForIncentive ? 'text-emerald-600' : 'text-amber-700'}`}>
                      {isEligibleForIncentive 
                        ? `Congratulations! You have met your monthly target. Estimated incentive earned: ₹${estimatedIncentive.toLocaleString()}` 
                        : `Reach 100% of your sales target to unlock monthly incentives. You are ${100 - salesPercent}% away.`}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions / Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a href="/workspace/mr/doctor-visits" className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer block">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Log Doc Visit</span>
            </a>
            
            <a href="/workspace/mr/chemist-visits" className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer block">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Log Chemist</span>
            </a>

            <a href="/workspace/mr/order-booking" className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer block">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Book Order</span>
            </a>

            <a href="/workspace/mr/daily-reports" className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer block">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Submit DCR</span>
            </a>
          </div>

          {/* Recent Orders List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Recent Orders (POB)</h3>
              <a href="/workspace/mr/order-booking" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="divide-y divide-slate-100">
              {data?.recentOrders?.length > 0 ? (
                data.recentOrders.map((order: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{order.client || order.chemistName}</p>
                        <p className="text-xs text-slate-500">{order.orderNumber} • {order.productName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{order.amount.toLocaleString()}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-slate-500">No recent orders found.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-6">
          
          {/* Attendance Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#163c78]" />
                Today's Attendance
              </h3>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  data?.attendance?.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 
                  data?.attendance?.status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{data?.attendance?.status || 'Absent'}</h4>
                  {data?.attendance?.checkInTime && (
                    <p className="text-xs text-slate-500 font-medium">In: {data.attendance.checkInTime} {data.attendance.checkOutTime ? `| Out: ${data.attendance.checkOutTime}` : ''}</p>
                  )}
                </div>
              </div>
              {data?.attendance?.status === 'Present' && (
                <div className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Checked in. Location tracking active. Distance: {data?.routeSummary?.totalDistance || '0 KM'}</span>
                </div>
              )}
              {data?.attendance?.status === 'Absent' && (
                <div className="text-xs font-medium text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>You have not marked attendance yet. Log your first visit to check in.</span>
                </div>
              )}
            </div>
          </div>

          {/* Pending Follow-ups */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                Action Required
              </h3>
              {(data?.followUps?.dueTodayCount > 0 || data?.followUps?.overdueCount > 0) && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {(data.followUps.dueTodayCount || 0) + (data.followUps.overdueCount || 0)}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {data?.followUps?.list?.length > 0 ? (
                data.followUps.list.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-800 truncate pr-2">{item.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        item.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Follow-up: {item.date}</p>
                  </div>
                ))
              ) : (
                <div className="p-5 text-center text-sm text-slate-500">No pending follow-ups.</div>
              )}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Today's Schedule
              </h3>
            </div>
            <div className="p-2">
              {data?.schedule?.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-4 py-2 space-y-4">
                  {data.schedule.map((item: any, idx: number) => (
                    <div key={idx} className="relative pl-4">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-blue-500 rounded-full ring-4 ring-white"></div>
                      <p className="text-xs font-bold text-slate-500 mb-0.5">{item.time}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">No scheduled visits for today.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
