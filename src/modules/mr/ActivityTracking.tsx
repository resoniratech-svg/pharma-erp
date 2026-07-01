import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const stored = localStorage.getItem('@web_activities');
    if (stored) {
      setActivities(JSON.parse(stored));
    } else {
      setActivities([]);
    }
  }, []);

  const handleExport = () => {
    const headers = ['Activity ID', 'MR Name', 'Activity Type', 'Customer', 'Territory', 'Date', 'Start Time', 'End Time', 'Duration', 'Status'];
    const csvContent = [
      headers.join(','),
      ...activities.map(a => [
        a.activityId, `"${a.mrName}"`, a.activityType, `"${a.customerName}"`, `"${a.territory}"`, a.date, a.startTime, a.endTime, a.duration, a.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Activity_Tracking_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
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
        let variant: any = 'default';
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

  // Generate timeline dynamically from stored activities
  const timelineEvents = activities.map(act => {
    let icon = CheckCircle2;
    let color = 'text-slate-500';
    if (act.activityType === 'Doctor Visit') { icon = Map; color = 'text-blue-500'; }
    else if (act.activityType === 'Chemist Visit') { icon = Store; color = 'text-emerald-500'; }
    else if (act.activityType === 'Order Booking') { icon = ClipboardList; color = 'text-amber-500'; }
    else if (act.activityType === 'Meeting') { icon = Users; color = 'text-purple-500'; }
    else if (act.activityType === 'Attendance') { icon = CheckCircle2; color = 'text-violet-500'; }
    else if (act.activityType === 'Follow-Up') { icon = Bell; color = 'text-rose-500'; }
    else if (act.activityType === 'Target Achievement') { icon = Target; color = 'text-emerald-600'; }

    return {
      time: act.startTime,
      title: act.activityType,
      description: `Customer: ${act.customerName} - ${act.territory}`,
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
          <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Activities</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          title="Total Activities Logged"
          value={totalActivities.toString()}
          subtitle="All reps"
          icon={<Activity className="w-5 h-5" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Doctor Visits Completed"
          value={docVisits.toString()}
          subtitle="Target tracked"
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
              emptyMessage="No activity records found."
            />
          </TableCard>
          
        </div>

        {/* Right Sidebar - Timeline & Performance */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Daily Activity Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
            <h3 className="text-md font-semibold text-slate-900 mb-6">Daily Activity Timeline</h3>
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
