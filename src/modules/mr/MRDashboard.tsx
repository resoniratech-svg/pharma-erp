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
  ArrowRight
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

export default function MRDashboard() {
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
          <div className={`p-4 rounded-full ${data.attendance.status === 'Absent' ? 'bg-rose-50 text-rose-600' : data.attendance.status === 'Completed' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
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
          <div className="p-4 rounded-full bg-violet-50 text-violet-600">
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
            <Target className="w-5 h-5 text-indigo-600" /> Monthly Target Progress
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
        <div className="bg-indigo-50 p-6 rounded-[24px] border border-indigo-100 shadow-sm flex flex-col justify-center text-center">
          <h2 className="text-lg font-bold text-indigo-900 mb-2">Incentive Estimator</h2>
          <div className="my-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${isEligibleForIncentive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
              Eligible: {isEligibleForIncentive ? 'Yes' : 'No'}
            </span>
          </div>
          <p className="text-slate-600 text-sm mb-2">Estimated Incentive</p>
          <p className="text-3xl font-extrabold text-indigo-700">₹{estimatedIncentive.toLocaleString()}</p>
          {!isEligibleForIncentive && (
            <p className="text-xs text-indigo-400 mt-4">Complete 100% of all active targets to unlock incentives.</p>
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
                <div key={idx} className="flex justify-between items-center py-3">
                  <span className="text-sm font-medium text-slate-700">{order.client}</span>
                  <span className="text-sm font-bold text-slate-900">{order.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent orders.</p>
          )}
        </div>

        {/* Recent Visits */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Visits</h2>
          {data.recentVisits.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentVisits.map((visit: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <span className="text-sm font-medium text-slate-700">{visit.name}</span>
                  <span className="text-sm text-slate-500">{visit.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent visits.</p>
          )}
        </div>
      </div>

      {/* Fifth Row: Display Only Alerts & GPS
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-80">
        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 border-dashed relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Coming Soon</div>
          <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Today's Notifications
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li>Follow-up due for Dr. Sharma</li>
            <li>Sales target reached 80%</li>
            <li>Team meeting at 4:00 PM</li>
          </ul>
        </div>

        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 border-dashed relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-2 right-2 bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Coming Soon</div>
          <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Map className="w-4 h-4" /> Today's Route Summary
          </h2>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-slate-500">Total Distance</p>
              <p className="text-xl font-bold text-slate-700">38 KM</p>
            </div>
            <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors" disabled>
              View Route <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div> */}
            {/* Fifth Row: Alerts & GPS (Now Dynamic!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
          <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Today's Notifications
          </h2>
          {data.notifications && data.notifications.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
              {data.notifications.map((notif: any, idx: number) => (
                <li key={idx}>{notif.message}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No notifications for today.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Map className="w-4 h-4 text-emerald-500" /> Today's Route Summary
          </h2>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-slate-500">Total Distance</p>
              <p className="text-xl font-bold text-slate-700">{data.routeSummary?.totalDistance || '0 KM'}</p>
            </div>
            <button 
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${data.routeSummary?.routeActive ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-400 cursor-not-allowed'}`}
              disabled={!data.routeSummary?.routeActive}
            >
              View Route <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

