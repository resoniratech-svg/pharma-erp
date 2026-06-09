import { useState } from 'react';
import { Download, Filter, Calendar, CheckCircle2, Clock, CalendarDays, XCircle } from 'lucide-react';
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

interface MeetingReminder {
  id: string;
  meetingId: string;
  meetingTitle: string;
  participant: string;
  meetingType: string;
  date: string;
  time: string;
  reminderStatus: 'Sent' | 'Pending' | 'Snoozed';
  status: 'Upcoming' | 'Completed' | 'Missed';
}

const mockData: MeetingReminder[] = [
  { id: '1', meetingId: 'MTG-001', meetingTitle: 'Product Launch Update', participant: 'Dr. A.K. Singh', meetingType: 'Doctor Meeting', date: '25-Oct-2024', time: '10:00 AM', reminderStatus: 'Sent', status: 'Upcoming' },
  { id: '2', meetingId: 'MTG-002', meetingTitle: 'Q3 Sales Review', participant: 'Regional Team', meetingType: 'Sales Meeting', date: '25-Oct-2024', time: '02:00 PM', reminderStatus: 'Pending', status: 'Upcoming' },
  { id: '3', meetingId: 'MTG-003', meetingTitle: 'Distributor Contract', participant: 'Apollo Pharmacy', meetingType: 'Distributor Meeting', date: '24-Oct-2024', time: '11:00 AM', reminderStatus: 'Sent', status: 'Completed' },
  { id: '4', meetingId: 'MTG-004', meetingTitle: 'Weekly Check-in', participant: 'Rahul Sharma', meetingType: 'Internal', date: '23-Oct-2024', time: '04:00 PM', reminderStatus: 'Sent', status: 'Missed' },
];

export default function MeetingReminders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<MeetingReminder>[] = [
    { key: 'meetingId', label: 'Meeting ID', render: (row) => <span className="font-semibold text-slate-900">{row.meetingId}</span> },
    { key: 'meetingTitle', label: 'Meeting Title', render: (row) => <span className="font-medium text-slate-800">{row.meetingTitle}</span> },
    { key: 'participant', label: 'Participant' },
    { key: 'meetingType', label: 'Meeting Type' },
    { key: 'date', label: 'Date', render: (row) => <span className="font-medium text-slate-700">{row.date}</span> },
    { key: 'time', label: 'Time', render: (row) => <span className="font-mono text-slate-600">{row.time}</span> },
    {
      key: 'reminderStatus',
      label: 'Reminder Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.reminderStatus === 'Sent') variant = 'success';
        else if (row.reminderStatus === 'Pending') variant = 'warning';
        else if (row.reminderStatus === 'Snoozed') variant = 'info';
        return <Badge variant={variant}>{row.reminderStatus}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.status === 'Completed') variant = 'success';
        else if (row.status === 'Upcoming') variant = 'info';
        else if (row.status === 'Missed') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors">View</button>
          <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">Edit</button>
          {row.status === 'Upcoming' && (
            <button className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition-colors">Mark Completed</button>
          )}
        </div>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.meetingTitle.toLowerCase().includes(search.toLowerCase()) || 
                        item.participant.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Meeting Reminder Center"
        subtitle="Track, schedule, and monitor upcoming meetings and reminder notifications."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Reminders</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Today's Meetings"
          value="8"
          subtitle="Scheduled for today"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Upcoming Meetings"
          value="45"
          subtitle="Next 7 days"
          icon={<Calendar className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Completed Meetings"
          value="112"
          subtitle="This month"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Missed Meetings"
          value="4"
          subtitle="Needs rescheduling"
          icon={<XCircle className="w-6 h-6" />}
          colorClass="text-danger-600"
          bgClass="bg-danger-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Main Content Area */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search meeting title or participant..." />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Upcoming', value: 'Upcoming' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Missed', value: 'Missed' },
              ]}
              placeholder="Status"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No meeting reminders found."
            />
          </TableCard>
        </div>

        {/* Right Sidebar Widget */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Timeline</h2>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Today
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                  <p className="text-sm font-semibold text-slate-800">Product Launch Update</p>
                  <p className="text-xs text-slate-500">10:00 AM • Dr. A.K. Singh</p>
                </div>
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                  <p className="text-sm font-semibold text-slate-800">Q3 Sales Review</p>
                  <p className="text-xs text-slate-500">02:00 PM • Regional Team</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-500" />
                Tomorrow
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                  <p className="text-sm font-semibold text-slate-800">Distributor Onboarding</p>
                  <p className="text-xs text-slate-500">11:30 AM • Wellness Medicals</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                This Week
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                  <p className="text-sm font-semibold text-slate-800">Strategy Planning</p>
                  <p className="text-xs text-slate-500">Friday • Management</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
