// import { useState } from 'react';
// import { Download, Filter, Calendar, CheckCircle2, Clock, CalendarDays, XCircle } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
//   SummaryCard,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface MeetingReminder {
//   id: string;
//   meetingId: string;
//   meetingTitle: string;
//   participant: string;
//   meetingType: string;
//   date: string;
//   time: string;
//   reminderStatus: 'Sent' | 'Pending' | 'Snoozed';
//   status: 'Upcoming' | 'Completed' | 'Missed';
// }

// const mockData: MeetingReminder[] = [
//   { id: '1', meetingId: 'MTG-001', meetingTitle: 'Product Launch Update', participant: 'Dr. A.K. Singh', meetingType: 'Doctor Meeting', date: '25-Oct-2024', time: '10:00 AM', reminderStatus: 'Sent', status: 'Upcoming' },
//   { id: '2', meetingId: 'MTG-002', meetingTitle: 'Q3 Sales Review', participant: 'Regional Team', meetingType: 'Sales Meeting', date: '25-Oct-2024', time: '02:00 PM', reminderStatus: 'Pending', status: 'Upcoming' },
//   { id: '3', meetingId: 'MTG-003', meetingTitle: 'Distributor Contract', participant: 'Apollo Pharmacy', meetingType: 'Distributor Meeting', date: '24-Oct-2024', time: '11:00 AM', reminderStatus: 'Sent', status: 'Completed' },
//   { id: '4', meetingId: 'MTG-004', meetingTitle: 'Weekly Check-in', participant: 'Rahul Sharma', meetingType: 'Internal', date: '23-Oct-2024', time: '04:00 PM', reminderStatus: 'Sent', status: 'Missed' },
// ];

// export default function MeetingReminders() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<MeetingReminder>[] = [
//     { key: 'meetingId', label: 'Meeting ID', render: (row) => <span className="font-semibold text-slate-900">{row.meetingId}</span> },
//     { key: 'meetingTitle', label: 'Meeting Title', render: (row) => <span className="font-medium text-slate-800">{row.meetingTitle}</span> },
//     { key: 'participant', label: 'Participant' },
//     { key: 'meetingType', label: 'Meeting Type' },
//     { key: 'date', label: 'Date', render: (row) => <span className="font-medium text-slate-700">{row.date}</span> },
//     { key: 'time', label: 'Time', render: (row) => <span className="font-mono text-slate-600">{row.time}</span> },
//     {
//       key: 'reminderStatus',
//       label: 'Reminder Status',
//       render: (row) => {
//         let variant: any = 'default';
//         if (row.reminderStatus === 'Sent') variant = 'success';
//         else if (row.reminderStatus === 'Pending') variant = 'warning';
//         else if (row.reminderStatus === 'Snoozed') variant = 'info';
//         return <Badge variant={variant}>{row.reminderStatus}</Badge>;
//       },
//     },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         let variant: any = 'default';
//         if (row.status === 'Completed') variant = 'success';
//         else if (row.status === 'Upcoming') variant = 'info';
//         else if (row.status === 'Missed') variant = 'danger';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'id',
//       label: 'Actions',
//       render: (row) => (
//         <div className="flex gap-2">
//           <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors">View</button>
//           <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">Edit</button>
//           {row.status === 'Upcoming' && (
//             <button className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition-colors">Mark Completed</button>
//           )}
//         </div>
//       )
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.meetingTitle.toLowerCase().includes(search.toLowerCase()) || 
//                         item.participant.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Meeting Reminder Center"
//         subtitle="Track, schedule, and monitor upcoming meetings and reminder notifications."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Reminders</ActionButton>
//         }
//       />

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Today's Meetings"
//           value="8"
//           subtitle="Scheduled for today"
//           icon={<Clock className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//         <SummaryCard
//           title="Upcoming Meetings"
//           value="45"
//           subtitle="Next 7 days"
//           icon={<Calendar className="w-6 h-6" />}
//           colorClass="text-indigo-600"
//           bgClass="bg-indigo-50"
//         />
//         <SummaryCard
//           title="Completed Meetings"
//           value="112"
//           subtitle="This month"
//           icon={<CheckCircle2 className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Missed Meetings"
//           value="4"
//           subtitle="Needs rescheduling"
//           icon={<XCircle className="w-6 h-6" />}
//           colorClass="text-danger-600"
//           bgClass="bg-danger-50"
//         />
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
//         {/* Main Content Area */}
//         <div className="xl:col-span-3 flex flex-col gap-4">
//           <FilterBar>
//             <SearchInput value={search} onChange={setSearch} placeholder="Search meeting title or participant..." />
//             <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//             <div className="flex items-center gap-2">
//               <Filter className="w-4 h-4 text-slate-400" />
//               <span className="text-sm font-medium text-slate-600">Filters:</span>
//             </div>
//             <SelectFilter
//               value={statusFilter}
//               onChange={setStatusFilter}
//               options={[
//                 { label: 'Upcoming', value: 'Upcoming' },
//                 { label: 'Completed', value: 'Completed' },
//                 { label: 'Missed', value: 'Missed' },
//               ]}
//               placeholder="Status"
//             />
//           </FilterBar>

//           <TableCard>
//             <DataTable
//               columns={columns}
//               data={filteredData}
//               emptyMessage="No meeting reminders found."
//             />
//           </TableCard>
//         </div>

//         {/* Right Sidebar Widget */}
//         <div className="xl:col-span-1">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Timeline</h2>
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            
//             <div>
//               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
//                 <CalendarDays className="w-4 h-4 text-primary" />
//                 Today
//               </h3>
//               <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
//                 <div className="relative pl-4">
//                   <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
//                   <p className="text-sm font-semibold text-slate-800">Product Launch Update</p>
//                   <p className="text-xs text-slate-500">10:00 AM • Dr. A.K. Singh</p>
//                 </div>
//                 <div className="relative pl-4">
//                   <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
//                   <p className="text-sm font-semibold text-slate-800">Q3 Sales Review</p>
//                   <p className="text-xs text-slate-500">02:00 PM • Regional Team</p>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
//                 <CalendarDays className="w-4 h-4 text-indigo-500" />
//                 Tomorrow
//               </h3>
//               <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
//                 <div className="relative pl-4">
//                   <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
//                   <p className="text-sm font-semibold text-slate-800">Distributor Onboarding</p>
//                   <p className="text-xs text-slate-500">11:30 AM • Wellness Medicals</p>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
//                 <CalendarDays className="w-4 h-4 text-slate-400" />
//                 This Week
//               </h3>
//               <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
//                 <div className="relative pl-4">
//                   <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
//                   <p className="text-sm font-semibold text-slate-800">Strategy Planning</p>
//                   <p className="text-xs text-slate-500">Friday • Management</p>
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
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
  Drawer,
  DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// ✅ 1. Fixed Interface (Added the source field here!)
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
  updatedAt?: string; 
  source?: 'CRM' | 'MR'; 
}

export default function MeetingReminders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // ✅ 2. Moved sourceFilter inside the component
  const [sourceFilter, setSourceFilter] = useState('All'); 
  
  const [meetings, setMeetings] = useState<MeetingReminder[]>([]);
  const [viewMeeting, setViewMeeting] = useState<MeetingReminder | null>(null);
  const [editMeeting, setEditMeeting] = useState<MeetingReminder | null>(null);

  // ✅ 3. Clean, combined useEffect
  useEffect(() => {
    loadMeetings();
    const interval = setInterval(loadMeetings, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ 4. Unified loading function that fetches both!
  const loadMeetings = () => {
    let allMeetings: MeetingReminder[] = [];

    try {
      // Fetch CRM Meetings & tag them
      const storedCRM = JSON.parse(localStorage.getItem('crm_meetings') || '[]');
      const crmWithSource = storedCRM.map((m: any) => ({ ...m, source: 'CRM' }));

      // Fetch MR Meetings & tag them
      const storedMR = JSON.parse(localStorage.getItem('@mr_meetings') || '[]');
      const mrWithSource = storedMR.map((m: any) => ({ ...m, source: 'MR' }));

      allMeetings = [...crmWithSource, ...mrWithSource];
    } catch (e) {
      console.error("Error reading meetings", e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process Status (Missed vs Upcoming)
    const processedData = allMeetings.map(item => {
      if (item.status === 'Completed') return item;

      if (item.date) {
        const meetingDate = new Date(item.date);
        
        if (!isNaN(meetingDate.getTime())) {
          meetingDate.setHours(0, 0, 0, 0);
          
          if (meetingDate < today && item.status !== 'Missed') {
            return { ...item, status: 'Missed' as const };
          } else if (meetingDate >= today && item.status !== 'Upcoming') {
            return { ...item, status: 'Upcoming' as const };
          }
        }
      }
      return item;
    });

    // Clean up data shapes from different modules
    const mappedData = processedData.map((item: any) => ({
      ...item,
      meetingId: item.meetingId || item.id,
      meetingTitle: item.meetingTitle || item.title,
      participant: item.participant || item.participants || item.client || item.organizer || '-',
      meetingType: item.meetingType || item.type,
      status: item.status,
      source: item.source
    }));

    setMeetings(mappedData);
  };

  const handleComplete = (identifier: string) => {
    const updated = meetings.map(item => {
      if (item.id === identifier || item.meetingId === identifier) {
        return { 
          ...item, 
          status: 'Completed' as const,
          reminderStatus: 'Sent' as const, 
          updatedAt: new Date().toISOString() 
        };
      }
      return item;
    });
    setMeetings(updated);
    
    // NOTE: Because this screen now reads from multiple places, 
    // a real backend API would handle the database update here. 
    // For local storage demo, we won't overwrite the global storage.
  };

  const handleExport = () => {
    const headers = ['Meeting ID', 'Meeting Title', 'Participant', 'Meeting Type', 'Date', 'Time', 'Reminder Status', 'Status', 'Source'];
    
    const csvRows = filteredData.map(item => [
      item.meetingId || '',
      item.meetingTitle || '',
      item.participant || '',
      item.meetingType || '',
      item.date || '',
      item.time || '',
      item.reminderStatus || '',
      item.status || '',
      item.source || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Meeting_Reminders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<MeetingReminder>[] = [
    { key: 'meetingId', label: 'Meeting ID', render: (row) => <span className="font-semibold text-slate-900">{row.meetingId || '-'}</span> },
    { key: 'meetingTitle', label: 'Meeting Title', render: (row) => <span className="font-medium text-slate-800">{row.meetingTitle || 'Unknown'}</span> },
    { key: 'participant', label: 'Participant', render: (row) => <span>{row.participant || '-'}</span> },
    { key: 'meetingType', label: 'Meeting Type', render: (row) => <span>{row.meetingType || '-'}</span> },
    { key: 'date', label: 'Date', render: (row) => <span className="font-medium text-slate-700">{row.date || '-'}</span> },
    { key: 'time', label: 'Time', render: (row) => <span className="font-mono text-slate-600">{row.time || '-'}</span> },
    {
      key: 'source',
      label: 'Department',
      render: (row) => (
        <Badge variant={row.source === 'CRM' ? 'info' : 'warning'}>
          {row.source || 'General'}
        </Badge>
      )
    },
    {
      key: 'reminderStatus',
      label: 'Reminder',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.reminderStatus === 'Sent') variant = 'success';
        else if (row.reminderStatus === 'Pending') variant = 'warning';
        else if (row.reminderStatus === 'Snoozed') variant = 'info';
        return <Badge variant={variant}>{row.reminderStatus || 'Pending'}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Completed') variant = 'success';
        else if (row.status === 'Upcoming') variant = 'info';
        else if (row.status === 'Missed') variant = 'danger';
        return <Badge variant={variant}>{row.status || 'Upcoming'}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => {
        const uniqueId = row.id || row.meetingId || '';

        return (
          <div className="flex gap-2">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setViewMeeting(row);
              }}
              className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors"
            >
              View
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setEditMeeting(row);
              }}
              className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors"
            >
              Edit
            </button>
            {row.status === 'Upcoming' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  handleComplete(uniqueId);
                }}
                className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const filteredData = meetings.filter((item) => {
    const title = item.meetingTitle || '';
    const participant = item.participant || '';

    const matchSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                        participant.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchSource = sourceFilter === 'All' ? true : item.source === sourceFilter;
    
    return matchSearch && matchStatus && matchSource;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // const todayCount = meetings.filter(m => {if (!m.date) return false;
  //     const d = new Date(m.date); d.setHours(0, 0, 0, 0); return d.getTime() === today.getTime() && m.status !== 'Missed';  }).length;

  // const upcomingCount = meetings.filter(m => m.status === 'Upcoming').length;
  // const completedCount = meetings.filter(m => m.status === 'Completed').length;
  // const missedCount = meetings.filter(m => m.status === 'Missed').length;
    const todayCount = filteredData.filter(m => {
      if (!m.date) return false;
      const d = new Date(m.date); 
      d.setHours(0, 0, 0, 0); 
      return d.getTime() === today.getTime() && m.status !== 'Missed';  
  }).length;
  const upcomingCount = filteredData.filter(m => m.status === 'Upcoming').length;
  const completedCount = filteredData.filter(m => m.status === 'Completed').length;
  const missedCount = filteredData.filter(m => m.status === 'Missed').length;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const todayMeetings = meetings.filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && m.status === 'Upcoming';
  });

  const tomorrowMeetings = meetings.filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === tomorrow.getTime() && m.status === 'Upcoming';
  });

  const laterThisWeekMeetings = meetings.filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > tomorrow.getTime() && d.getTime() <= endOfWeek.getTime() && m.status === 'Upcoming';
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Meeting Reminder Center"
        subtitle="Track, schedule, and monitor upcoming meetings and reminder notifications."
        actions={
          <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Reminders
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Today's Meetings"
          value={todayCount.toString()}
          subtitle="Scheduled for today"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Upcoming Meetings"
          value={upcomingCount.toString()}
          subtitle="Total Upcoming"
          icon={<Calendar className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Completed Meetings"
          value={completedCount.toString()}
          subtitle="This month"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Missed Meetings"
          value={missedCount.toString()}
          subtitle="Needs rescheduling"
          icon={<XCircle className="w-6 h-6" />}
          colorClass="text-rose-600" 
          bgClass="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
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
            
            {/* ✅ 5. The New Source Dropdown! */}
            <SelectFilter
              value={sourceFilter}
              onChange={setSourceFilter}
              options={[
                { label: 'All Departments', value: 'All' },
                { label: 'CRM / Sales', value: 'CRM' },
                { label: 'MR / Field', value: 'MR' },
              ]}
              placeholder="Filter by Source"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No meeting reminders found. Schedule meetings in the CRM or MR module first!"
            />
          </TableCard>
        </div>

        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Timeline</h2>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Today
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                {todayMeetings.length > 0 ? todayMeetings.map(m => (
                  <div key={m.id} className="relative pl-4">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-semibold text-slate-800">{m.meetingTitle}</p>
                    <p className="text-xs text-slate-500">{m.time} • {m.participant}</p>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 italic">No meetings scheduled for today.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-500" />
                Tomorrow
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                {tomorrowMeetings.length > 0 ? tomorrowMeetings.map(m => (
                  <div key={m.id} className="relative pl-4">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                    <p className="text-sm font-semibold text-slate-800">{m.meetingTitle}</p>
                    <p className="text-xs text-slate-500">{m.time} • {m.participant}</p>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 italic">No meetings scheduled for tomorrow.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                This Week
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                {laterThisWeekMeetings.length > 0 ? laterThisWeekMeetings.map(m => (
                  <div key={m.id} className="relative pl-4">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-400"></div>
                    <p className="text-sm font-semibold text-slate-800">{m.meetingTitle}</p>
                    <p className="text-xs text-slate-500">{m.date} • {m.participant}</p>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 italic">No other meetings scheduled this week.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <Drawer 
        open={!!viewMeeting} 
        onClose={() => setViewMeeting(null)} 
        title="Meeting Details"
      >
        {viewMeeting && (
          <div className="space-y-1">
            <DrawerField label="Meeting ID" value={viewMeeting.meetingId} />
            <DrawerField label="Title" value={viewMeeting.meetingTitle} />
            <DrawerField label="Department" value={viewMeeting.source === 'CRM' ? 'CRM / Sales' : 'MR / Field'} />
            <DrawerField label="Participant" value={viewMeeting.participant} />
            <DrawerField label="Meeting Type" value={viewMeeting.meetingType} />
            <DrawerField label="Date" value={viewMeeting.date} />
            <DrawerField label="Time" value={viewMeeting.time} />
            <DrawerField label="Reminder Status" value={
              <Badge variant={viewMeeting.reminderStatus === 'Sent' ? 'success' : viewMeeting.reminderStatus === 'Pending' ? 'warning' : 'info'}>
                {viewMeeting.reminderStatus}
              </Badge>
            } />
            <DrawerField label="Status" value={
              <Badge variant={viewMeeting.status === 'Completed' ? 'success' : viewMeeting.status === 'Upcoming' ? 'info' : 'danger'}>
                {viewMeeting.status}
              </Badge>
            } />
            <DrawerField 
              label="Last Updated" 
              value={viewMeeting.updatedAt ? new Date(viewMeeting.updatedAt).toLocaleString() : '-'} 
            />
          </div>
        )}
      </Drawer>

      <Drawer 
        open={!!editMeeting} 
        onClose={() => setEditMeeting(null)} 
        title="Edit Meeting Reminder"
      >
        {editMeeting && (
          <div className="flex flex-col gap-4 text-sm text-slate-600">
            <p>Edit functionality is connected to the primary scheduling module.</p>
            <div className="p-4 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <strong>Notice:</strong> To maintain data consistency, meeting details and times should be edited within the <b>{editMeeting.source === 'CRM' ? 'CRM Module' : 'MR Module'}</b> where this schedule originated. Changes there will sync here automatically.
            </div>
            <div className="mt-4 flex justify-end">
              <ActionButton onClick={() => setEditMeeting(null)} variant="secondary">
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}