import { useState } from 'react';
import { Download, Filter, Activity, Users, Store, ClipboardList, Target, TrendingUp, CheckCircle2, Map, Calendar } from 'lucide-react';
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
  activityType: string;
  customerName: string;
  territory: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Missed';
}

const mockActivities: ActivityItem[] = [
  { id: '1', activityId: 'ACT-001', mrName: 'Rahul Sharma', activityType: 'Doctor Visit', customerName: 'Dr. A.K. Singh', territory: 'South Mumbai', startTime: '10:00 AM', endTime: '10:30 AM', duration: '30 mins', status: 'Completed' },
  { id: '2', activityId: 'ACT-002', mrName: 'Rahul Sharma', activityType: 'Chemist Visit', customerName: 'Apollo Pharmacy', territory: 'South Mumbai', startTime: '10:45 AM', endTime: '11:00 AM', duration: '15 mins', status: 'Completed' },
  { id: '3', activityId: 'ACT-003', mrName: 'Neha Gupta', activityType: 'Order Booking', customerName: 'Care Hospital', territory: 'Andheri West', startTime: '11:30 AM', endTime: '-', duration: '-', status: 'In Progress' },
  { id: '4', activityId: 'ACT-004', mrName: 'Amit Kumar', activityType: 'Meeting', customerName: 'Regional Office', territory: 'Thane', startTime: '02:00 PM', endTime: '03:00 PM', duration: '-', status: 'Pending' },
  { id: '5', activityId: 'ACT-005', mrName: 'Rahul Sharma', activityType: 'Product Promotion', customerName: 'Dr. Verma', territory: 'South Mumbai', startTime: '12:00 PM', endTime: '12:00 PM', duration: '-', status: 'Missed' },
];

const timelineEvents = [
  { time: '10:00 AM', title: 'Visit Start', description: 'Arrived at Dr. A.K. Singh clinic', icon: Map, color: 'text-blue-500' },
  { time: '10:30 AM', title: 'Visit End', description: 'Sample delivered, feedback collected', icon: CheckCircle2, color: 'text-emerald-500' },
  { time: '10:45 AM', title: 'Chemist Check', description: 'RCPA at Apollo Pharmacy', icon: Store, color: 'text-indigo-500' },
  { time: '11:30 AM', title: 'Order Booking', description: 'Booking 15 units of Amoxicillin', icon: ClipboardList, color: 'text-amber-500' },
  { time: '02:00 PM', title: 'Meeting Attendance', description: 'Monthly performance review', icon: Users, color: 'text-purple-500' },
  { time: '05:00 PM', title: 'Route Completion', description: 'South Mumbai daily beat ended', icon: Target, color: 'text-slate-500' },
];

export default function ActivityTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<ActivityItem>[] = [
    { key: 'activityId', label: 'Activity ID', render: (row) => <span className="font-semibold text-slate-900">{row.activityId}</span> },
    { key: 'mrName', label: 'MR Name', render: (row) => <span className="font-medium text-slate-800">{row.mrName}</span> },
    { key: 'activityType', label: 'Activity Type' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'territory', label: 'Territory' },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        switch (row.status) {
          case 'Completed':
            variant = 'success';
            break;
          case 'In Progress':
            variant = 'info';
            break;
          case 'Pending':
            variant = 'warning';
            break;
          case 'Missed':
            variant = 'danger';
            break;
        }
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockActivities.filter((item) => {
    const matchSearch = item.mrName.toLowerCase().includes(search.toLowerCase()) || 
                        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
                        item.activityType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Activity Tracking"
        subtitle="Track and monitor MR field activities, visit performance, customer interactions, route completion, and daily productivity."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Activities</ActionButton>
        }
      />

      {/* KPI Cards (5 grid layout for requested fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          title="Total Activities Today"
          value="145"
          subtitle="All reps"
          icon={<Activity className="w-5 h-5" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Doctor Visits Completed"
          value="82"
          subtitle="Target: 100"
          icon={<Users className="w-5 h-5" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Chemist Visits Completed"
          value="45"
          subtitle="RCPA tracked"
          icon={<Store className="w-5 h-5" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Orders Generated"
          value="24"
          subtitle="POB collected"
          icon={<ClipboardList className="w-5 h-5" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Target Achievement"
          value="82%"
          subtitle="Monthly average"
          icon={<Target className="w-5 h-5" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        
        {/* Main Content Area */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          
          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500 mb-2 opacity-80" />
              <h3 className="text-xs font-semibold text-slate-800 mb-1 text-center">Visit Completion Rate</h3>
              <p className="text-xl font-bold text-slate-900">85%</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <Map className="w-6 h-6 text-indigo-500 mb-2 opacity-80" />
              <h3 className="text-xs font-semibold text-slate-800 mb-1 text-center">Territory Performance</h3>
              <p className="text-xl font-bold text-slate-900">South Zone</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-500 mb-2 opacity-80" />
              <h3 className="text-xs font-semibold text-slate-800 mb-1 text-center">Monthly Trend</h3>
              <p className="text-xl font-bold text-slate-900">+12%</p>
            </div>
          </div>

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
            {/* Territory, Date Range, Activity Type filters can be added here */}
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
          
          {/* Performance Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-md font-semibold text-slate-900 mb-4">Overall Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Planned Visits</span>
                <span className="text-sm font-semibold text-slate-900">120</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Completed Visits</span>
                <span className="text-sm font-semibold text-emerald-600">102</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Missed Visits</span>
                <span className="text-sm font-semibold text-danger-600">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg Visit Duration</span>
                <span className="text-sm font-semibold text-slate-900">22 mins</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-800">Productivity Score</span>
                <span className="text-lg font-bold text-primary">8.5/10</span>
              </div>
            </div>
          </div>

          {/* Daily Activity Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
            <h3 className="text-md font-semibold text-slate-900 mb-6">Daily Activity Timeline (Demo MR)</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
