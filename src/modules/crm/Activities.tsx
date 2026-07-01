// import { useState } from 'react';
// import { Download } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface ActivityLog {
//   id: string;
//   date: string;
//   user: string;
//   action: string;
//   entity: string;
//   type: 'Email' | 'Call' | 'Meeting' | 'Note';
// }

// const mockData: ActivityLog[] = [
//   { id: '1', date: '24-Oct-2026 10:30 AM', user: 'Rahul Verma', action: 'Sent Proposal', entity: 'Metro Distributors', type: 'Email' },
//   { id: '2', date: '24-Oct-2026 11:15 AM', user: 'Amit Singh', action: 'Logged Call', entity: 'Dr. Ramesh Sharma', type: 'Call' },
//   { id: '3', date: '23-Oct-2026 04:00 PM', user: 'Rahul Verma', action: 'Added Note', entity: 'Wellness Pharmacy', type: 'Note' },
// ];

// export default function Activities() {
//   const [search, setSearch] = useState('');
//   const [typeFilter, setTypeFilter] = useState('');

//   const columns: Column<ActivityLog>[] = [
//     { key: 'date', label: 'Date & Time', render: (row) => <span className="text-slate-600">{row.date}</span> },
//     { key: 'user', label: 'User', render: (row) => <span className="font-medium text-slate-900">{row.user}</span> },
//     { key: 'action', label: 'Action Taken' },
//     { key: 'entity', label: 'Related To' },
//     {
//       key: 'type',
//       label: 'Type',
//       render: (row) => {
//         const variant = row.type === 'Email' ? 'info' : row.type === 'Call' ? 'success' : row.type === 'Meeting' ? 'purple' : 'neutral';
//         return <Badge variant={variant}>{row.type}</Badge>;
//       },
//     },
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.entity.toLowerCase().includes(search.toLowerCase()) || item.user.toLowerCase().includes(search.toLowerCase());
//     const matchType = typeFilter ? item.type === typeFilter : true;
//     return matchSearch && matchType;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Activity Tracking"
//         subtitle="Audit log of all interactions and updates across the CRM."
//         actions={
//           <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200">
//             <Download className="w-4 h-4" /> Export Log
//           </button>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search user or entity..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={typeFilter}
//           onChange={setTypeFilter}
//           options={[
//             { label: 'Email', value: 'Email' },
//             { label: 'Call', value: 'Call' },
//             { label: 'Meeting', value: 'Meeting' },
//             { label: 'Note', value: 'Note' },
//           ]}
//           placeholder="All Types"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No activities found."
//         />
//       </TableCard>
//     </div>
//   );
// }
//////////////////////////////////////////////////////////////////j////////////////////

// import { useState, useEffect } from 'react';
// import { 
//   Activity, Calendar, MapPin, ShoppingCart, Users, 
//   CheckCircle2, Clock, Filter, Download, Banknote
// } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from '../mr/components/shared'; 
// import { type Column } from '../mr/components/shared';

// interface UnifiedActivity {
//   id: string;
//   type: 'visit' | 'order' | 'expense' | 'attendance' | 'meeting';
//   title: string;
//   subtitle: string;
//   date: string;
//   time: string;
// }

// export default function ActivityTracking() {
//   const [search, setSearch] = useState('');
//   const [activities, setActivities] = useState<UnifiedActivity[]>([]);
//   const [filterType, setFilterType] = useState('All');

//   useEffect(() => {
//     compileActivityLogs();
//   }, []);

//   const safeJsonParse = (data: string | null, fallback: any) => {
//     if (!data) return fallback;
//     try {
//       return JSON.parse(data);
//     } catch (err) {
//       console.log('safeJsonParse error:', err);
//       return fallback;
//     }
//   };

//   const compileActivityLogs = () => {
//     const compiled: UnifiedActivity[] = [];
//     const todayStr = new Date().toISOString().split('T')[0];

//     // 1. Fetch Doctor Visits
//     const docs = localStorage.getItem('@doctor_visits');
//     const docsList = safeJsonParse(docs, []);
//     docsList.forEach((d: any) => {
//       compiled.push({
//         id: `doc-${d.id || Date.now() + Math.random()}`,
//         type: 'visit',
//         title: `🩺 Doctor Visited: Dr. ${d.doctorName}`,
//         subtitle: `Specialty: ${d.specialty || 'General'} at ${d.hospital || 'Clinic'}. Notes: ${d.notes || 'None'}`,
//         date: d.date || todayStr,
//         time: d.time || '10:00 AM',
//       });
//     });

//     // 2. Fetch Chemist Visits
//     const chemists = localStorage.getItem('@chemist_visits');
//     const chemistsList = safeJsonParse(chemists, []);
//     chemistsList.forEach((c: any) => {
//       compiled.push({
//         id: `chem-${c.id || Date.now() + Math.random()}`,
//         type: 'visit',
//         title: `💊 Chemist Visited: ${c.shopName}`,
//         subtitle: `Order Discussed: ${c.medicine || 'None'} (Qty: ${c.quantity || '0'}). Total value: ₹${c.orderValue || '0'}`,
//         date: c.date || todayStr,
//         time: c.time || '12:00 PM',
//       });
//     });

//     // 3. Fetch Orders
//     const orders = localStorage.getItem('@orders');
//     const ordersList = safeJsonParse(orders, []);
//     ordersList.forEach((o: any) => {
//       compiled.push({
//         id: `ord-${o.id || Date.now() + Math.random()}`,
//         type: 'order',
//         title: `📦 Order Booked: ${o.orderNumber || 'N/A'}`,
//         subtitle: `Customer: ${o.customerName} (${o.customerType || 'Retail'}). Product: ${o.productName || 'Multiple'} (Qty: ${o.quantity || '1'}). Amount: ₹${o.totalAmount}`,
//         date: o.dateFormatted ? o.dateFormatted.split(' ')[0] : todayStr,
//         time: o.dateFormatted ? o.dateFormatted.split(' ')[1] : '02:00 PM',
//       });
//     });

//     // 4. Fetch Expense Claims
//     const expenses = localStorage.getItem('@expense_claims');
//     const expensesList = safeJsonParse(expenses, []);
//     expensesList.forEach((e: any) => {
//       compiled.push({
//         id: `exp-${e.id || Date.now() + Math.random()}`,
//         type: 'expense',
//         title: `💵 Expense Claimed: ${e.category}`,
//         subtitle: `Claimed Amount: ₹${e.amount}. Purpose: ${e.remarks}`,
//         date: e.date ? e.date.split(' ')[0] : todayStr,
//         time: e.date ? e.date.split(' ')[1] || '04:00 PM' : '04:00 PM',
//       });
//     });

//     // 5. Fetch Daily Attendance Status
//     const checkedInStatus = localStorage.getItem('@checked_in');
//     if (checkedInStatus === 'true') {
//       const checkInTime = localStorage.getItem('@check_in_time');
//       const checkInAddress = localStorage.getItem('@check_in_address');
//       compiled.push({
//         id: `att-${Date.now()}`,
//         type: 'attendance',
//         title: '📍 Daily Attendance: Checked-In',
//         subtitle: `Checked in successfully for duty. Location: ${checkInAddress || 'Acquired GPS location'}.`,
//         date: todayStr,
//         time: checkInTime || '09:00 AM',
//       });
//     }

//     // 6. Optional: Fetch Meetings (Since you have them in Web)
//     const meetings = localStorage.getItem('@meetings');
//     const meetingsList = safeJsonParse(meetings, []);
//     meetingsList.forEach((m: any) => {
//       compiled.push({
//         id: `meet-${m.id || Date.now() + Math.random()}`,
//         type: 'meeting',
//         title: `🤝 Meeting: ${m.title}`,
//         subtitle: `Client: ${m.client} at ${m.venue}. Agenda: ${m.agenda || 'None'}`,
//         date: m.date || todayStr,
//         time: m.time || '11:00 AM',
//       });
//     });

//     // Sort chronologically (assume newer items were added last, or sort by id if numbers, but since ids are strings here we do a rough date sort)
//     compiled.reverse();
//     setActivities(compiled);
//   };

//   const getIconForType = (type: string) => {
//     switch (type) {
//       case 'visit': return <MapPin className="w-4 h-4 text-cyan-600" />;
//       case 'order': return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
//       case 'expense': return <Banknote className="w-4 h-4 text-amber-600" />;
//       case 'attendance': return <CheckCircle2 className="w-4 h-4 text-violet-600" />;
//       case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
//       default: return <Activity className="w-4 h-4 text-slate-600" />;
//     }
//   };

//   const getBadgeVariant = (type: string) => {
//     switch (type) {
//       case 'visit': return 'info'; // Blue
//       case 'order': return 'success'; // Green
//       case 'expense': return 'warning'; // Yellow
//       case 'attendance': return 'purple'; // Purple
//       case 'meeting': return 'neutral'; // Gray/Indigo
//       default: return 'neutral';
//     }
//   };

//   const columns: Column<UnifiedActivity>[] = [
//     { 
//       key: 'type', 
//       label: 'Log Type', 
//       render: (row) => (
//         <div className="flex items-center gap-2">
//           <div className="p-1.5 rounded-md bg-slate-50 border border-slate-100">
//             {getIconForType(row.type)}
//           </div>
//           <Badge variant={getBadgeVariant(row.type)}>{row.type.toUpperCase()}</Badge>
//         </div>
//       ) 
//     },
//     { 
//       key: 'title', 
//       label: 'Activity Details', 
//       render: (row) => (
//         <div className="max-w-md">
//           <p className="font-bold text-slate-900 text-sm">{row.title}</p>
//           <p className="text-xs text-slate-600 mt-1 leading-relaxed">{row.subtitle}</p>
//         </div>
//       ) 
//     },
//     { 
//       key: 'datetime', 
//       label: 'Timestamp', 
//       render: (row) => (
//         <div>
//           <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
//             <Calendar className="w-3.5 h-3.5 text-slate-400"/> {row.date}
//           </p>
//           <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
//             <Clock className="w-3.5 h-3.5 text-slate-400"/> {row.time}
//           </p>
//         </div>
//       ) 
//     }
//   ];

//   const filteredData = activities.filter((item) => {
//     const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
//                           item.subtitle.toLowerCase().includes(search.toLowerCase());
//     const matchesType = filterType === 'All' || item.type === filterType;
//     return matchesSearch && matchesType;
//   });

//   const todayStr = new Date().toISOString().split('T')[0];
//   const todayActivities = activities.filter(a => a.date === todayStr);

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Activity Logs"
//         subtitle="Real-time consolidated field action trail matching your mobile app data."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>
//             Export Log
//           </ActionButton>
//         }
//       />

//       {/* KPI SUMMARY CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Activity className="w-5 h-5"/></div>
//             <p className="text-sm font-semibold text-slate-600">Total Activities</p>
//           </div>
//           <p className="text-2xl font-bold text-slate-900">{activities.length}</p>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><MapPin className="w-5 h-5"/></div>
//             <p className="text-sm font-semibold text-slate-600">Field Visits</p>
//           </div>
//           <p className="text-2xl font-bold text-slate-900">{activities.filter(a => a.type === 'visit').length}</p>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ShoppingCart className="w-5 h-5"/></div>
//             <p className="text-sm font-semibold text-slate-600">Orders Booked</p>
//           </div>
//           <p className="text-2xl font-bold text-slate-900">{activities.filter(a => a.type === 'order').length}</p>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Banknote className="w-5 h-5"/></div>
//             <p className="text-sm font-semibold text-slate-600">Expenses Logged</p>
//           </div>
//           <p className="text-2xl font-bold text-slate-900">{activities.filter(a => a.type === 'expense').length}</p>
//         </div>
//       </div>

//       <FilterBar>
//         <div className="flex gap-4 w-full">
//           <SearchInput value={search} onChange={setSearch} placeholder="Search logs, details, or entities..." />
//           <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//           <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 hidden sm:flex">
//             <Filter className="w-4 h-4 text-slate-400" />
//             <select 
//               className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer py-2"
//               value={filterType}
//               onChange={(e) => setFilterType(e.target.value)}
//             >
//               <option value="All">All Types</option>
//               <option value="visit">Visits</option>
//               <option value="order">Orders</option>
//               <option value="expense">Expenses</option>
//               <option value="attendance">Attendance</option>
//               <option value="meeting">Meetings</option>
//             </select>
//           </div>
//         </div>
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No matching activity logs found."
//         />
//       </TableCard>
//     </div>
//   );
// }



//////////////////////////////////////////lll



import { useState, useEffect } from 'react';
import { 
  Activity, Calendar, MapPin, ShoppingCart, Users, 
  CheckCircle2, Clock, Filter, Download, Banknote, Bell, Target, FileText
} from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared'; 
import { type Column } from './components/shared';

interface UnifiedActivity {
  id: string;
  type: 'visit' | 'order' | 'expense' | 'attendance' | 'meeting' | 'followup' | 'report' | 'target' | 'crm';
  title: string;
  subtitle: string;
  date: string;
  time: string;
  timestamp: number;
}

export default function ActivityTracking() {
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    compileActivityLogs();
  }, []);

  const safeJsonParse = (data: string | null, fallback: any) => {
    if (!data) return fallback;
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error('safeJsonParse error:', err);
      return fallback;
    }
  };

  const createTimestamp = (dateStr: string, timeStr: string) => {
    try {
      let formattedDate = dateStr;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      const parsed = new Date(`${formattedDate} ${timeStr}`).getTime();
      return isNaN(parsed) ? Date.now() : parsed;
    } catch {
      return Date.now();
    }
  };

  const compileActivityLogs = () => {
    const compiled: UnifiedActivity[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch Doctor Visits
    const docsList = safeJsonParse(localStorage.getItem('mr_doctor_visits'), []);
    docsList.forEach((d: any) => {
      compiled.push({
        id: `doc-${d.id || Date.now() + Math.random()}`,
        type: 'visit',
        title: `Doctor Visited: Dr. ${d.doctorName}`,
        subtitle: `Specialty: ${d.specialty || 'General'} at ${d.hospital || 'Clinic'}. Notes: ${d.notes || 'None'}`,
        date: d.date || todayStr,
        time: d.time || '10:00 AM',
        timestamp: createTimestamp(d.date || todayStr, d.time || '10:00 AM')
      });

      if (d.followUpDate) {
        compiled.push({
          id: `fup-${d.id || Date.now() + Math.random()}`,
          type: 'followup',
          title: `Follow-Up Scheduled: Dr. ${d.doctorName}`,
          subtitle: `Scheduled for: ${d.followUpDate}. Reason: ${d.notes || 'General Check-in'}`,
          date: d.date || todayStr, 
          time: d.time || '10:05 AM',
          timestamp: createTimestamp(d.date || todayStr, d.time || '10:05 AM') + 1000
        });
      }
    });

    // 2. Fetch Chemist Visits
    const chemistsList = safeJsonParse(localStorage.getItem('mr_chemist_visits'), []);
    chemistsList.forEach((c: any) => {
      compiled.push({
        id: `chem-${c.id || Date.now() + Math.random()}`,
        type: 'visit',
        title: `Chemist Visited: ${c.shopName}`,
        subtitle: `Order Discussed: ${c.medicine || 'None'} (Qty: ${c.quantity || '0'}). Total value: ₹${c.orderValue || '0'}`,
        date: c.date || todayStr,
        time: c.time || '12:00 PM',
        timestamp: createTimestamp(c.date || todayStr, c.time || '12:00 PM')
      });
    });

    // 3. Fetch Orders
    const ordersList = safeJsonParse(localStorage.getItem('mr_orders'), []);
    ordersList.forEach((o: any) => {
      compiled.push({
        id: `ord-${o.id || Date.now() + Math.random()}`,
        type: 'order',
        title: `Order Booked: ${o.orderNumber || 'N/A'}`,
        subtitle: `Customer: ${o.customerName}. Product: ${o.productName} (Qty: ${o.quantity}). Amount: ₹${o.totalAmount}`,
        date: o.dateFormatted ? o.dateFormatted.split(' ')[0] : todayStr,
        time: o.dateFormatted ? o.dateFormatted.split(' ')[1] : '02:00 PM',
        timestamp: createTimestamp(o.dateFormatted?.split(' ')[0] || todayStr, o.dateFormatted?.split(' ')[1] || '02:00 PM')
      });
    });

    // 4. Fetch Expenses
    const expensesList = safeJsonParse(localStorage.getItem('mr_expenses'), []);
    expensesList.forEach((e: any) => {
      compiled.push({
        id: `exp-${e.id || Date.now() + Math.random()}`,
        type: 'expense',
        title: `Expense Claimed: ${e.category}`,
        subtitle: `Claimed Amount: ₹${e.amount}. Purpose: ${e.remarks}`,
        date: e.date ? e.date.split(' ')[0] : todayStr,
        time: e.date ? e.date.split(' ')[1] || '04:00 PM' : '04:00 PM',
        timestamp: createTimestamp(e.date?.split(' ')[0] || todayStr, e.date?.split(' ')[1] || '04:00 PM')
      });
    });

    // 5. Attendance
    if (localStorage.getItem('mr_checked_in') === 'true') {
      compiled.push({
        id: `att-in-${Date.now()}`,
        type: 'attendance',
        title: 'Daily Attendance: Checked In',
        subtitle: `Checked in successfully for duty. Location: ${localStorage.getItem('mr_check_in_address') || 'GPS location'}.`,
        date: todayStr,
        time: localStorage.getItem('mr_check_in_time') || '09:00 AM',
        timestamp: createTimestamp(todayStr, localStorage.getItem('mr_check_in_time') || '09:00 AM')
      });
    }

    if (localStorage.getItem('mr_checked_out') === 'true') {
      compiled.push({
        id: `att-out-${Date.now()}`,
        type: 'attendance',
        title: 'Daily Attendance: Checked Out',
        subtitle: `Day ended successfully. Duration and final location logged.`,
        date: todayStr,
        time: localStorage.getItem('mr_check_out_time') || '06:00 PM',
        timestamp: createTimestamp(todayStr, localStorage.getItem('mr_check_out_time') || '06:00 PM')
      });
    }

    // 6. Meetings
    const webMeetingsList = safeJsonParse(localStorage.getItem('crm_meetings'), []);
    webMeetingsList.forEach((m: any) => {
      compiled.push({
        id: `meet-web-${m.id || Date.now() + Math.random()}`,
        type: 'meeting',
        title: `Meeting Scheduled: ${m.title}`,
        subtitle: `Client: ${m.client} at ${m.venue}. Status: ${m.status}`,
        date: m.date || todayStr,
        time: m.time || m.rawTime || '11:00 AM',
        timestamp: createTimestamp(m.date || todayStr, m.time || m.rawTime || '11:00 AM')
      });
    });

    // 7. DCR Reports
    const dcrList = safeJsonParse(localStorage.getItem('mr_daily_reports'), []);
    dcrList.forEach((d: any) => {
      compiled.push({
        id: `dcr-${d.id || Date.now()}`,
        type: 'report',
        title: `DCR Submitted`,
        subtitle: `Status: Submitted for ${d.date || todayStr}. Territory: ${d.territory || 'Assigned'}`,
        date: d.date || todayStr,
        time: '07:00 PM',
        timestamp: createTimestamp(d.date || todayStr, '07:00 PM')
      });
    });

    // 8. Target Achievements
    const targetsList = safeJsonParse(localStorage.getItem('mr_targets'), []);
    targetsList.forEach((t: any) => {
      if (t.achieved >= t.goal) {
        compiled.push({
          id: `tgt-${t.id || Date.now()}`,
          type: 'target',
          title: `Target Achieved: ${t.title || 'Monthly Sales'}`,
          subtitle: `Congratulations! Goal of ${t.goal} has been reached.`,
          date: todayStr,
          time: '08:00 PM',
          timestamp: createTimestamp(todayStr, '08:00 PM')
        });
      }
    });

    // 9. Master Web CRM Activity Audit Log
    const crmLogs = safeJsonParse(localStorage.getItem('crm_activities'), []);
    crmLogs.forEach((log: any) => {
      let datePart = todayStr;
      let timePart = '12:00 PM';
      if (log.date) {
        const parts = log.date.split(', ');
        if (parts.length === 2) {
           datePart = parts[0];
           timePart = parts[1];
        } else {
           datePart = log.date.split(' ')[0] || todayStr;
           timePart = log.date.split(' ')[1] || '12:00 PM';
        }
      }

      compiled.push({
        id: `crm-audit-${log.id || Date.now() + Math.random()}`,
        type: 'crm',
        title: `CRM Activity: ${log.type}`,
        subtitle: `${log.description} (Action By: ${log.user})`,
        date: datePart,
        time: timePart,
        timestamp: createTimestamp(datePart, timePart)
      });
    });

    // Sort globally by timestamp (Newest first)
    compiled.sort((a, b) => b.timestamp - a.timestamp);
    setActivities(compiled);
  };

  const handleExport = () => {
    if (activities.length === 0) return alert("No data to export!");
    const headers = ['Log Type', 'Title', 'Details', 'Date', 'Time'];
    const rows = activities.map(a => [
      a.type.toUpperCase(), `"${a.title}"`, `"${a.subtitle}"`, a.date, a.time
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'visit': return <MapPin className="w-4 h-4 text-cyan-600" />;
      case 'order': return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'expense': return <Banknote className="w-4 h-4 text-amber-600" />;
      case 'attendance': return <CheckCircle2 className="w-4 h-4 text-violet-600" />;
      case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
      case 'followup': return <Bell className="w-4 h-4 text-rose-600" />;
      case 'report': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'target': return <Target className="w-4 h-4 text-green-600" />;
      case 'crm': return <Activity className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'visit': return 'info'; 
      case 'order': return 'success'; 
      case 'expense': return 'warning'; 
      case 'attendance': return 'purple'; 
      case 'meeting': return 'neutral'; 
      case 'followup': return 'warning'; 
      case 'report': return 'info';
      case 'target': return 'success';
      case 'crm': return 'purple';
      default: return 'neutral';
    }
  };

  const columns: Column<UnifiedActivity>[] = [
    { 
      key: 'type', 
      label: 'Log Type', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-50 border border-slate-100">
            {getIconForType(row.type)}
          </div>
          <Badge variant={getBadgeVariant(row.type)}>{row.type.toUpperCase()}</Badge>
        </div>
      ) 
    },
    { 
      key: 'title', 
      label: 'Activity Details', 
      render: (row) => (
        <div className="max-w-md">
          <p className="font-bold text-slate-900 text-sm">{row.title}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{row.subtitle}</p>
        </div>
      ) 
    },
    { 
      key: 'datetime', 
      label: 'Timestamp', 
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400"/> {row.date}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <Clock className="w-3.5 h-3.5 text-slate-400"/> {row.time}
          </p>
        </div>
      ) 
    }
  ];

  const filteredData = activities.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.subtitle.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Activity Tracking & Audit Log"
        subtitle="Unified audit trail of MR field activities and Web CRM updates."
        actions={<ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Log</ActionButton>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Activity className="w-5 h-5"/></div>
            <p className="text-sm font-semibold text-slate-600">Total Activities</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activities.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><MapPin className="w-5 h-5"/></div>
            <p className="text-sm font-semibold text-slate-600">Field Visits</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activities.filter(a => a.type === 'visit').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ShoppingCart className="w-5 h-5"/></div>
            <p className="text-sm font-semibold text-slate-600">Orders</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activities.filter(a => a.type === 'order').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-5 h-5"/></div>
            <p className="text-sm font-semibold text-slate-600">Meetings</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activities.filter(a => a.type === 'meeting').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Activity className="w-5 h-5"/></div>
            <p className="text-sm font-semibold text-slate-600">CRM Audits</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activities.filter(a => a.type === 'crm').length}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <FilterBar>
          <div className="flex gap-4 w-full">
            <SearchInput value={search} onChange={setSearch} placeholder="Search logs, details, or entities..." />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 hidden sm:flex">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer py-2"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="visit">Visits</option>
                <option value="order">Orders</option>
                <option value="expense">Expenses</option>
                <option value="attendance">Attendance</option>
                <option value="meeting">Meetings</option>
                <option value="followup">Follow-Ups</option>
                <option value="report">DCR Reports</option>
                <option value="target">Targets</option>
                <option value="crm">CRM Events</option>
              </select>
            </div>
          </div>
        </FilterBar>

        <TableCard>
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No matching activity logs found."
          />
        </TableCard>
      </div>
    </div>
  );
}