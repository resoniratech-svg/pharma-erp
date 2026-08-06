import { useState, useEffect, useCallback } from 'react';
import { Download, Filter, Activity, Users, Store, ClipboardList, Target, CheckCircle2, Map, Bell } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
} from './components/shared';
import { type Column } from './components/shared';
import { doctorVisitService } from '../../services/doctorVisitService';
import { chemistVisitService } from '../../services/chemistVisitService';
import { retailerOrderService } from '../../services/retailerOrderService';
import { attendanceService } from '../../services/attendanceService';
import { dailyReportService } from '../../services/dailyReportService';
import { ExportService } from '../../services/exportService';

interface ActivityItem {
  id: string;
  activityId: string;
  mrName: string;
  activityType: 'Doctor Visit' | 'Chemist Visit' | 'Order Booking' | 'Attendance' | 'Expense Claim' | 'DCR Submission' | 'Meeting' | 'Product Promotion' | 'Follow-Up' | 'Target Achievement';
  customerName: string;
  territory: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Missed';
}

export default function ActivityTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const mrId = Number(localStorage.getItem('mrId') || '1');

  const loadAndCompile = useCallback(async () => {
    setLoading(true);
    try {
      let authUser: any = null;
      try {
        authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      } catch {
        authUser = {};
      }
      const userName = authUser.fullName || authUser.name || 'Medical Representative';

      // 1. Load Doctor Visits
      const docData = await doctorVisitService.loadDoctorVisits(mrId);
      // 2. Load Chemist Visits
      const chemData = await chemistVisitService.loadChemistVisits(mrId);
      // 3. Load Orders
      const orderData = await retailerOrderService.getRetailerOrders();
      // 4. Load Attendance History
      const attendanceData = await attendanceService.getAttendanceHistory(mrId).catch(() => []);
      // 5. Load DCRs
      const dcrData = await dailyReportService.loadDailyReports(mrId);

      const compiledActivities: ActivityItem[] = [];

      // Attendance
      attendanceData.forEach((a: any) => {
        compiledActivities.push({
          id: String(a.id),
          activityId: `ACT-ATT-${String(a.id).slice(-4)}`,
          mrName: a.mr?.name || a.repName || userName,
          activityType: 'Attendance',
          customerName: a.territory || 'HQ Location',
          territory: a.territory || 'HQ',
          date: a.date ? a.date.split('T')[0] : '',
          startTime: a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
          endTime: a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          duration: a.checkOutTime ? 'Completed Shift' : 'In Progress',
          status: a.checkOutTime ? 'Completed' : 'In Progress'
        });
      });

      // Doctor Visits
      docData.forEach((v: any) => {
        compiledActivities.push({
          id: String(v.id),
          activityId: `ACT-DOC-${String(v.id).slice(-4)}`,
          mrName: v.mrName || userName,
          activityType: 'Doctor Visit',
          customerName: `Dr. ${v.doctorName}`,
          territory: v.clinic || 'Clinic',
          date: v.visitDate || v.date || '',
          startTime: v.time || v.visitTime || '10:00 AM',
          endTime: '',
          duration: '30 mins',
          status: 'Completed'
        });
      });

      // Chemist Visits
      chemData.forEach((c: any) => {
        compiledActivities.push({
          id: String(c.id),
          activityId: `ACT-CHM-${String(c.id).slice(-4)}`,
          mrName: c.mrName || userName,
          activityType: 'Chemist Visit',
          customerName: c.shopName || c.chemistName,
          territory: c.address || 'Pharmacy',
          date: c.visitDate || c.date || '',
          startTime: c.time || c.visitTime || '11:00 AM',
          endTime: '',
          duration: '30 mins',
          status: 'Completed'
        });
      });

      // Orders
      orderData.forEach((o: any) => {
        compiledActivities.push({
          id: String(o.id),
          activityId: `ACT-ORD-${String(o.id).slice(-4)}`,
          mrName: o.mrName || userName,
          activityType: 'Order Booking',
          customerName: o.customerName || o.chemistName || 'Pharmacy Store',
          territory: o.distributor || o.area || 'Territory',
          date: o.orderDate ? o.orderDate.split('T')[0] : (o.dateFormatted || o.date || ''),
          startTime: '',
          endTime: '',
          duration: '',
          status: o.status === 'Cancelled' ? 'Missed' : 'Completed'
        });
      });

      // DCRs
      dcrData.forEach((r: any) => {
        compiledActivities.push({
          id: String(r.id),
          activityId: `ACT-DCR-${String(r.id).slice(-4)}`,
          mrName: r.repName || userName,
          activityType: 'DCR Submission',
          customerName: 'HQ Office',
          territory: r.route || r.beat || 'HQ',
          date: r.date,
          startTime: '18:00',
          endTime: '18:30',
          duration: `${r.totalCalls || 0} calls`,
          status: 'Completed'
        });
      });

      // Sort activities chronologically by date descending
      compiledActivities.sort((x, y) => (y.date || '').localeCompare(x.date || ''));

      setActivities(compiledActivities);
    } catch (e) {
      console.error("Failed to compile activity logs:", e);
    } finally {
      setLoading(false);
    }
  }, [mrId]);

  useEffect(() => {
    loadAndCompile();
  }, [loadAndCompile]);

  const exportColumns = [
    { header: 'Activity ID', dataKey: 'activityId' },
    { header: 'MR Name', dataKey: 'mrName' },
    { header: 'Type', dataKey: 'activityType' },
    { header: 'Customer', dataKey: 'customerName' },
    { header: 'Territory', dataKey: 'territory' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Start Time', dataKey: 'startTime' },
    { header: 'End Time', dataKey: 'endTime' },
    { header: 'Duration', dataKey: 'duration' },
    { header: 'Status', dataKey: 'status' }
  ];

  const handleExportPDF = () => {
    if (activities.length === 0) return alert("No activities to export.");
    ExportService.exportToPDF({
      title: 'MR Field Activity Tracking Log',
      filename: `MR_Activities_${new Date().toISOString().split('T')[0]}`,
      data: activities,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    if (activities.length === 0) return alert("No activities to export.");
    ExportService.exportToExcel({
      title: 'MR Field Activity Tracking Log',
      filename: `MR_Activities_${new Date().toISOString().split('T')[0]}`,
      data: activities,
      columns: exportColumns
    });
  };

  const handleExportCSV = () => {
    if (activities.length === 0) return alert("No activities to export.");
    ExportService.exportToCSV({
      title: 'MR Field Activity Tracking Log',
      filename: `MR_Activities_${new Date().toISOString().split('T')[0]}`,
      data: activities,
      columns: exportColumns
    });
  };

  const columns: Column<ActivityItem>[] = [
    { key: 'activityId', label: 'Activity ID', render: (row) => <span className="font-semibold text-slate-900">{row.activityId}</span> },
    { key: 'mrName', label: 'MR Name', render: (row) => <span className="font-medium text-slate-800">{row.mrName}</span> },
    { key: 'activityType', label: 'Activity Type' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'territory', label: 'Territory' },
    { key: 'date', label: 'Date', render: (row) => <span className="font-medium text-slate-700">{row.date}</span> },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'neutral';
        switch (row.status) {
          case 'Completed': variant = 'success'; break;
          case 'In Progress': variant = 'info'; break;
          case 'Pending': variant = 'warning'; break;
          case 'Missed': variant = 'danger'; break;
        }
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = activities.filter((item) => {
    const matchSearch = item.mrName.toLowerCase().includes(search.toLowerCase()) || 
                        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
                        item.activityType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalActivities = activities.length;
  const docVisits = activities.filter(a => a.activityType === 'Doctor Visit').length;
  const chemistVisits = activities.filter(a => a.activityType === 'Chemist Visit').length;
  const ordersGenerated = activities.filter(a => a.activityType === 'Order Booking').length;

  const timelineEvents = activities.slice(0, 8).map(act => {
    let icon = CheckCircle2;
    let color = 'text-slate-500';
    if (act.activityType === 'Doctor Visit') { icon = Map; color = 'text-blue-500'; }
    else if (act.activityType === 'Chemist Visit') { icon = Store; color = 'text-emerald-500'; }
    else if (act.activityType === 'Order Booking') { icon = ClipboardList; color = 'text-amber-500'; }
    else if (act.activityType === 'Meeting') { icon = Users; color = 'text-purple-500'; }
    else if (act.activityType === 'Attendance') { icon = CheckCircle2; color = 'text-[#163c78]/90'; }
    else if (act.activityType === 'Follow-Up') { icon = Bell; color = 'text-rose-500'; }
    else if (act.activityType === 'Target Achievement') { icon = Target; color = 'text-emerald-600'; }

    return {
      time: act.startTime || act.date,
      title: act.activityType,
      description: `${act.customerName} (${act.territory})`,
      icon,
      color
    };
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Activity Tracking"
        subtitle="Track and monitor MR field activities, visit performance, customer interactions, route completion, and daily productivity."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <ActionButton 
                variant="secondary" 
                onClick={() => setIsExportOpen(!isExportOpen)} 
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </ActionButton>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <button 
                    onClick={() => { handleExportExcel(); setIsExportOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    Excel (.xlsx)
                  </button>
                  <button 
                    onClick={() => { handleExportPDF(); setIsExportOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    PDF Document
                  </button>
                  <button 
                    onClick={() => { handleExportCSV(); setIsExportOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    CSV (.csv)
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          title="Total Activities Logged"
          value={totalActivities.toString()}
          subtitle="All reps"
          icon={<Activity className="w-5 h-5" />}
          colorClass="text-[#163c78]"
          bgClass="bg-[#163c78]/10"
        />
        <SummaryCard
          title="Doctor Visits Completed"
          value={docVisits.toString()}
          subtitle="Field calls"
          icon={<Users className="w-5 h-5" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Chemist Visits Completed"
          value={chemistVisits.toString()}
          subtitle="RCPA tracked"
          icon={<Store className="w-5 h-5" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Orders Generated"
          value={ordersGenerated.toString()}
          subtitle="POB collected"
          icon={<ClipboardList className="w-5 h-5" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Target Achievement"
          value={totalActivities > 0 ? "100%" : "0%"}
          subtitle="Monthly average"
          icon={<Target className="w-5 h-5" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Main Content Area */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search MR, customer, or type..." />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Completed', value: 'Completed' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Missed', value: 'Missed' },
              ]}
              placeholder="Status"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage={loading ? "Loading activity logs..." : "No activity records found."}
            />
          </TableCard>
        </div>

        {/* Right Sidebar - Timeline */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
            <h3 className="text-md font-semibold text-slate-900 mb-6">Recent Activity Timeline</h3>
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No activities logged yet.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                {timelineEvents.map((event, index) => {
                  const Icon = event.icon;
                  return (
                    <div key={index} className="relative pl-6">
                      <div className="absolute -left-[17px] top-1 bg-white p-1 rounded-full border-2 border-slate-100">
                        <Icon className={`w-4 h-4 ${event.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{event.time}</span>
                          <h4 className="text-sm font-semibold text-slate-800">{event.title}</h4>
                        </div>
                        <p className="text-sm text-slate-600">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
