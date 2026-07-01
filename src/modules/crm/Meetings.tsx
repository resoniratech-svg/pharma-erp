// // import { useState } from 'react';
// // import { Plus, Video, Users } from 'lucide-react';
// // import {
// //   PageHeader,
// //   FilterBar,
// //   SearchInput,
// //   ActionButton,
// //   TableCard,
// //   DataTable,
// //   Badge,
// // } from './components/shared';
// // import { type Column } from './components/shared';

// // interface CRMMeeting {
// //   id: string;
// //   title: string;
// //   client: string;
// //   date: string;
// //   time: string;
// //   status: 'Scheduled' | 'Completed' | 'Cancelled';
// // }

// // const mockData: CRMMeeting[] = [
// //   { id: '1', title: 'Product Demo', client: 'Apollo Hospitals', date: '25-Oct-2026', time: '10:00 AM', status: 'Scheduled' },
// //   { id: '2', title: 'Quarterly Review', client: 'Metro Distributors', date: '26-Oct-2026', time: '02:30 PM', status: 'Scheduled' },
// //   { id: '3', title: 'Initial Consultation', client: 'Dr. Ramesh Sharma', date: '20-Oct-2026', time: '11:00 AM', status: 'Completed' },
// // ];

// // export default function Meetings() {
// //   const [search, setSearch] = useState('');

// //   const columns: Column<CRMMeeting>[] = [
// //     { key: 'title', label: 'Meeting Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
// //     { key: 'client', label: 'Client / Lead' },
// //     { key: 'date', label: 'Date' },
// //     { key: 'time', label: 'Time' },
// //     {
// //       key: 'status',
// //       label: 'Status',
// //       render: (row) => {
// //         const variant = row.status === 'Completed' ? 'success' : row.status === 'Scheduled' ? 'info' : 'neutral';
// //         return <Badge variant={variant}>{row.status}</Badge>;
// //       },
// //     },
// //     {
// //       key: 'action',
// //       label: '',
// //       render: (row) => row.status === 'Scheduled' ? <ActionButton variant="secondary" className="text-xs px-2 py-1 border-violet-200 text-violet-700"><Video className="w-4 h-4 mr-1" /> Join</ActionButton> : <span className="text-slate-300">-</span>
// //     }
// //   ];

// //   const filteredData = mockData.filter((item) => {
// //     return item.title.toLowerCase().includes(search.toLowerCase()) || item.client.toLowerCase().includes(search.toLowerCase());
// //   });

// //   return (
// //     <div className="animate-in fade-in duration-500">
// //       <PageHeader
// //         title="Meeting Scheduling"
// //         subtitle="Schedule and manage virtual or in-person meetings with clients."
// //         actions={
// //           <ActionButton icon={<Plus className="w-4 h-4" />}>Schedule Meeting</ActionButton>
// //         }
// //       />

// //       <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
// //         <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
// //         <div>
// //           <h3 className="text-sm font-semibold text-indigo-800">Upcoming Sync</h3>
// //           <p className="text-sm text-indigo-700 mt-1">You have a product demo with Apollo Hospitals in 30 minutes.</p>
// //         </div>
// //       </div>

// //       <FilterBar>
// //         <SearchInput value={search} onChange={setSearch} placeholder="Search meetings or clients..." />
// //       </FilterBar>

// //       <TableCard>
// //         <DataTable
// //           columns={columns}
// //           data={filteredData}
// //           emptyMessage="No meetings found."
// //         />
// //       </TableCard>
// //     </div>
// //   );
// // }
// ///////////////////////////////////////////////////////////////////////k
// import { useState, useEffect } from 'react';
// import { Plus, Users, X, Check, XCircle } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface CRMMeeting {
//   id: string;
//   title: string;
//   meetingType: string;
//   client: string;
//   participants: string;
//   venue: string;
//   date: string;
//   time: string;
//   rawTime: string; // Used for conflict checking
//   status: 'Scheduled' | 'Completed' | 'Cancelled';
//   agenda: string;
// }

// export default function Meetings() {
//   const [search, setSearch] = useState('');
//   const [meetings, setMeetings] = useState<CRMMeeting[]>([]);
//   const [isFormOpen, setIsFormOpen] = useState(false);

//   // Form States
//   const [title, setTitle] = useState('');
//   const [meetingType, setMeetingType] = useState('Doctor Group Meet');
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [time, setTime] = useState('11:00');
//   const [venue, setVenue] = useState('');
//   const [participants, setParticipants] = useState('');
//   const [agenda, setAgenda] = useState('');

//   // Load from LocalStorage on mount
//   useEffect(() => {
//     const stored = localStorage.getItem('@meetings');
//     if (stored) {
//       try {
//         setMeetings(JSON.parse(stored));
//       } catch (e) {
//         console.error('Failed to parse meetings', e);
//       }
//     } else {
//       // Default fallback mock data if empty
//       setMeetings([
//         { id: '1', title: 'Product Demo', meetingType: 'Clinical Presentation', client: 'Apollo Hospitals', participants: 'Dr. Ramesh, Chemist Sunil', venue: 'Apollo Hall', date: '2026-10-25', time: '10:00 AM', rawTime: '10:00', status: 'Scheduled', agenda: 'New Product' },
//       ]);
//     }
//   }, []);

//   const handleUpdateStatus = (id: string, newStatus: 'Completed' | 'Cancelled') => {
//     const updated = meetings.map(m => m.id === id ? { ...m, status: newStatus } : m);
//     setMeetings(updated);
//     localStorage.setItem('@meetings', JSON.stringify(updated));
//   };

//   const handleSchedule = () => {
//     if (!title.trim() || !venue.trim() || !participants.trim()) {
//       alert('Please fill in all required fields (Title, Venue, Participants).');
//       return;
//     }

//     // 1. Prevent Past-Date Meetings
//     const todayStr = new Date().toISOString().split('T')[0];
//     if (date < todayStr) {
//       alert('Cannot schedule a meeting on a past date.');
//       return;
//     }

//     // 2. Prevent Past-Time on Current Day
//     if (date === todayStr) {
//       const now = new Date();
//       const currentHours = now.getHours();
//       const currentMinutes = now.getMinutes();
//       const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      
//       if (time < currentTimeStr) {
//         alert('Cannot schedule a meeting at a past time today.');
//         return;
//       }
//     }

//     // 3. Date + Time Conflict Validation
//     const isConflict = meetings.some(
//       (m) => m.date === date && m.rawTime === time && m.status === 'Scheduled'
//     );
//     if (isConflict) {
//       alert('Scheduling Conflict: You already have an active meeting scheduled at this exact time and date.');
//       return;
//     }

//     // Format time for display (12-hour format)
//     let [h, m] = time.split(':');
//     let hours = parseInt(h);
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     hours = hours % 12;
//     hours = hours ? hours : 12;
//     const displayTime = `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;

//     const newMeeting: CRMMeeting = {
//       id: Date.now().toString(),
//       title,
//       meetingType,
//       client: participants.split(',')[0].trim() || 'Multiple',
//       participants,
//       venue,
//       date,
//       time: displayTime,
//       rawTime: time,
//       status: 'Scheduled',
//       agenda
//     };

//     const updatedMeetings = [newMeeting, ...meetings];
//     setMeetings(updatedMeetings);
//     localStorage.setItem('@meetings', JSON.stringify(updatedMeetings));

//     // 4. Notification Integration
//     try {
//       const storedNotifs = localStorage.getItem('@notifications');
//       const currentNotifications = storedNotifs ? JSON.parse(storedNotifs) : [];
//       const newNotification = {
//         id: Date.now() + 1,
//         type: 'meeting',
//         title: `📅 Meeting Scheduled: ${title}`,
//         message: `Scheduled at ${venue} on ${date} at ${displayTime}.`,
//         time: 'Just Now',
//         unread: true,
//       };
//       localStorage.setItem('@notifications', JSON.stringify([newNotification, ...currentNotifications]));
//     } catch (e) {
//       console.error('Failed to save automatic meeting notification reminder:', e);
//     }

//     // Close and reset
//     setIsFormOpen(false);
//     setTitle('');
//     setVenue('');
//     setParticipants('');
//     setAgenda('');
//   };

//   const columns: Column<CRMMeeting>[] = [
//     { key: 'title', label: 'Meeting Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
//     { key: 'client', label: 'Client / Lead' },
//     { key: 'date', label: 'Date' },
//     { key: 'time', label: 'Time' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Completed' ? 'success' : row.status === 'Scheduled' ? 'info' : 'neutral';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: 'Actions',
//       render: (row) => row.status === 'Scheduled' ? (
//         <div className="flex gap-2">
//           <button 
//             onClick={() => handleUpdateStatus(row.id, 'Completed')} 
//             className="flex items-center text-xs px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold hover:bg-emerald-100 transition-colors"
//           >
//             <Check className="w-3 h-3 mr-1" /> Complete
//           </button>
//           <button 
//             onClick={() => handleUpdateStatus(row.id, 'Cancelled')} 
//             className="flex items-center text-xs px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold hover:bg-rose-100 transition-colors"
//           >
//             <XCircle className="w-3 h-3 mr-1" /> Cancel
//           </button>
//         </div>
//       ) : <span className="text-slate-300">-</span>
//     }
//   ];

//   const filteredData = meetings.filter((item) => {
//     return item.title.toLowerCase().includes(search.toLowerCase()) || 
//            item.client.toLowerCase().includes(search.toLowerCase());
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Meeting Scheduling"
//         subtitle="Schedule and manage virtual or in-person meetings with clients."
//         actions={
//           <ActionButton onClick={() => setIsFormOpen(true)} icon={<Plus className="w-4 h-4" />}>
//             Schedule Meeting
//           </ActionButton>
//         }
//       />

//       <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
//         <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-semibold text-indigo-800">MR Meeting Dashboard</h3>
//           <p className="text-sm text-indigo-700 mt-1">
//             You have {meetings.filter(m => m.status === 'Scheduled').length} upcoming meetings scheduled.
//           </p>
//         </div>
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search meetings or clients..." />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No meetings found."
//         />
//       </TableCard>

//       {/* SCHEDULING MODAL */}
//       {isFormOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            
//             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
//               <h2 className="text-lg font-bold text-slate-800">Schedule New Meeting</h2>
//               <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
            
//             <div className="p-6 space-y-5">
//               <div className="grid grid-cols-2 gap-5">
//                 <div className="col-span-2">
//                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Title *</label>
//                   <input 
//                     placeholder="e.g. Q2 Cardiovascular Range Presentation"
//                     className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
//                     value={title} 
//                     onChange={(e)=>setTitle(e.target.value)} 
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Type *</label>
//                   <select 
//                     className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white" 
//                     value={meetingType} 
//                     onChange={(e)=>setMeetingType(e.target.value)}
//                   >
//                     <option value="Doctor Group Meet">Doctor Group Meet</option>
//                     <option value="Stockist Review">Stockist Review</option>
//                     <option value="Clinical Presentation">Clinical Presentation</option>
//                     <option value="Team Sync">Team Sync</option>
//                   </select>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label>
//                     <input 
//                       type="date" 
//                       className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
//                       value={date} 
//                       onChange={(e)=>setDate(e.target.value)} 
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Time *</label>
//                     <input 
//                       type="time" 
//                       className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
//                       value={time} 
//                       onChange={(e)=>setTime(e.target.value)} 
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Venue / Location *</label>
//                   <input 
//                     placeholder="e.g. Apollo Hospital"
//                     className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
//                     value={venue} 
//                     onChange={(e)=>setVenue(e.target.value)} 
//                   />
//                 </div>

//                 <div className="col-span-2">
//                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Participants (Comma separated) *</label>
//                   <input 
//                     placeholder="e.g. Dr. Ramesh, Dr. Sharma, Chemist Sunil"
//                     className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
//                     value={participants} 
//                     onChange={(e)=>setParticipants(e.target.value)} 
//                   />
//                 </div>

//                 <div className="col-span-2">
//                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Agenda / Notes</label>
//                   <textarea 
//                     placeholder="What will be discussed..."
//                     className="w-full border border-slate-300 rounded-xl p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
//                     value={agenda} 
//                     onChange={(e)=>setAgenda(e.target.value)} 
//                   />
//                 </div>
//               </div>
//             </div>
            
//             <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
//               <button 
//                 className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors" 
//                 onClick={() => setIsFormOpen(false)}
//               >
//                 Cancel
//               </button>
//               <button 
//                 className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors" 
//                 onClick={handleSchedule}
//               >
//                 Schedule Meeting
//               </button>
//             </div>

//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
  

/////////////////////////////////////////////////////////////l



import { useState, useEffect } from 'react';
import { Plus, Users, X, Check, XCircle, Edit, Eye, Calendar, MapPin, AlignLeft, Download } from 'lucide-react';
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

const generateMeetingId = (history: CRMMeeting[]) => {
  if (history.length === 0) return 'MT-0001';
  let maxId = 0;
  history.forEach(record => {
    const numPart = parseInt(record.id?.split('-')[1] || '0', 10);
    if (numPart > maxId) maxId = numPart;
  });
  return `MT-${(maxId + 1).toString().padStart(4, '0')}`;
};

// ✅ ChatGPT Polish 3: Clean sequential Activity IDs (ACT-0001)
const generateActivityId = (history: any[]) => {
  if (history.length === 0) return 'ACT-0001';
  let maxId = 0;
  history.forEach(record => {
    const numPart = parseInt(record.id?.split('-')[1] || '0', 10);
    if (numPart > maxId) maxId = numPart;
  });
  return `ACT-${(maxId + 1).toString().padStart(4, '0')}`;
};

interface Lead {
  id: string;
  name: string;
}

interface CRMMeeting {
  id: string;
  leadId: string;
  title: string;
  meetingType: string;
  client: string;
  participants: string;
  venue: string;
  date: string;
  time: string;
  rawTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  agenda: string;
}

export default function CrmMeetings() {
  const [search, setSearch] = useState('');
  const [meetings, setMeetings] = useState<CRMMeeting[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<CRMMeeting | null>(null);
  
  // Edit State
  const [editMeetingId, setEditMeetingId] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('Doctor Group Meet');
  const [leadId, setLeadId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:00');
  const [venue, setVenue] = useState('');
  const [participants, setParticipants] = useState('');
  const [agenda, setAgenda] = useState('');

  useEffect(() => {
    try {
      const storedLeads = localStorage.getItem('crm_leads');
      if (storedLeads) setLeads(JSON.parse(storedLeads));

      const storedMeetings = localStorage.getItem('crm_meetings');
      if (storedMeetings) setMeetings(JSON.parse(storedMeetings));
    } catch (e) {
      console.error('Failed to parse data', e);
    }
  }, []);

  const getManagerName = () => {
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    return authUser?.fullName || authUser?.name || authUser?.username || 'Admin';
  };

  const logActivity = (type: string, description: string) => {
    try {
      const managerName = getManagerName();
      const existingActivities = JSON.parse(localStorage.getItem('crm_activities') || '[]');
      const newActivity = {
        id: generateActivityId(existingActivities), // ✅ Enhancement 3
        type,
        description,
        date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        user: managerName
      };
      localStorage.setItem('crm_activities', JSON.stringify([newActivity, ...existingActivities]));
    } catch (error) {
      console.error("Failed to save activity log:", error);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'Completed' | 'Cancelled') => {
    const targetMeeting = meetings.find(m => m.id === id);
    if (!targetMeeting) return;

    const updated = meetings.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMeetings(updated);
    localStorage.setItem('crm_meetings', JSON.stringify(updated));
    
    logActivity(`Meeting ${newStatus}`, `Marked meeting "${targetMeeting.title}" with ${targetMeeting.client} as ${newStatus}`);
  };

  const openNewMeetingForm = () => {
    setEditMeetingId(null);
    setTitle('');
    setMeetingType('Doctor Group Meet');
    setLeadId('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('11:00');
    setVenue('');
    setParticipants('');
    setAgenda('');
    setIsFormOpen(true);
  };

  const openEditMeetingForm = (meeting: CRMMeeting) => {
    setEditMeetingId(meeting.id);
    setTitle(meeting.title);
    setMeetingType(meeting.meetingType);
    setLeadId(meeting.leadId || '');
    setDate(meeting.date);
    setTime(meeting.rawTime);
    setVenue(meeting.venue);
    setParticipants(meeting.participants);
    setAgenda(meeting.agenda);
    setIsFormOpen(true);
  };

  const handleScheduleOrUpdate = () => {
    if (!title.trim() || !venue.trim() || !participants.trim() || !leadId) {
      alert('Please fill in all required fields (Title, Client/Lead, Venue, Participants).');
      return;
    }

    const selectedLead = leads.find(l => l.id === leadId);
    if (!selectedLead) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (!editMeetingId && date < todayStr) {
      alert('Cannot schedule a meeting on a past date.');
      return;
    }

    if (!editMeetingId && date === todayStr) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      
      if (time < currentTimeStr) {
        alert('Cannot schedule a meeting at a past time today.');
        return;
      }
    }

    const isConflict = meetings.some(
      (m) => m.date === date && m.rawTime === time && m.status === 'Scheduled' && m.id !== editMeetingId && m.leadId === leadId
    );
    if (isConflict) {
      alert(`Scheduling Conflict: You already have an active meeting scheduled with ${selectedLead.name} at this exact time and date.`);
      return;
    }

    let [h, m] = time.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const displayTime = `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;

    const newMeetingData: CRMMeeting = {
      id: editMeetingId || generateMeetingId(meetings),
      leadId: selectedLead.id,
      title: title.trim(),
      meetingType,
      client: selectedLead.name,
      participants: participants.trim(),
      venue: venue.trim(),
      date,
      time: displayTime,
      rawTime: time,
      status: 'Scheduled',
      agenda: agenda.trim()
    };

    let updatedMeetings;
    if (editMeetingId) {
      updatedMeetings = meetings.map(m => m.id === editMeetingId ? newMeetingData : m);
    } else {
      updatedMeetings = [newMeetingData, ...meetings];
    }

    setMeetings(updatedMeetings);
    localStorage.setItem('crm_meetings', JSON.stringify(updatedMeetings));

    if (editMeetingId) {
       logActivity('Meeting Updated', `Updated meeting details for "${newMeetingData.title}" with ${newMeetingData.client}`);
    } else {
       logActivity('Meeting Scheduled', `Scheduled a ${newMeetingData.meetingType} with ${newMeetingData.client} on ${newMeetingData.date}`);
       
       try {
           const storedLeads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
           const updatedLeads = storedLeads.map((l: any) => {
               if (l.id === selectedLead.id && (l.status === 'New' || l.status === 'Assigned' || l.status === 'Contacted')) {
                   return { ...l, status: 'Qualified' };
               }
               return l;
           });
           localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
           setLeads(updatedLeads); // ✅ Enhancement 1: Sync state
       } catch (e) { console.error("Pipeline update failed", e); }
    }

    setIsFormOpen(false);
  };

  const handleExport = () => {
    if (meetings.length === 0) return alert("No data to export!");
    // ✅ Enhancement 4: Added Lead ID to CSV
    const headers = ['Meeting ID', 'Lead ID', 'Title', 'Client', 'Type', 'Date', 'Time', 'Venue', 'Status', 'Participants', 'Agenda'];
    const rows = meetings.map(m => [
      m.id, m.leadId, `"${m.title}"`, `"${m.client}"`, m.meetingType, m.date, m.time, `"${m.venue}"`, m.status, `"${m.participants}"`, `"${m.agenda}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CRM_Meetings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<CRMMeeting>[] = [
    { key: 'title', label: 'Meeting Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
    { key: 'client', label: 'Client / Lead' },
    { key: 'meetingType', label: 'Meeting Type' },
    { key: 'venue', label: 'Venue' },
    { 
      key: 'date', 
      label: 'Date', 
      render: (row) => {
        const d = new Date(row.date);
        const displayDate = isNaN(d.getTime()) ? row.date : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return <span className="text-slate-600 font-medium">{displayDate}</span>;
      }
    },
    { key: 'time', label: 'Time', render: (row) => <span className="text-slate-600 font-medium">{row.time}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'purple' = 'neutral';
        if (row.status === 'Completed') variant = 'success';
        else if (row.status === 'Scheduled') variant = 'info';
        else if (row.status === 'Cancelled') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => setViewMeeting(row)} className="p-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'Scheduled' && (
            <>
              <button onClick={() => openEditMeetingForm(row)} className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleUpdateStatus(row.id, 'Completed')} className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => handleUpdateStatus(row.id, 'Cancelled')} className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded hover:bg-rose-100 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const filteredData = meetings.filter((item) => {
    const s = search.toLowerCase();
    return item.title.toLowerCase().includes(s) || 
           item.client.toLowerCase().includes(s) ||
           item.venue.toLowerCase().includes(s) ||
           item.meetingType.toLowerCase().includes(s);
  });

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="CRM Meeting Scheduling"
        subtitle="Schedule and manage virtual or in-person meetings with clients."
        actions={
          <>
            <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export List</ActionButton>
            <ActionButton onClick={openNewMeetingForm} icon={<Plus className="w-4 h-4" />}>
              Schedule Meeting
            </ActionButton>
          </>
        }
      />

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-indigo-800">CRM Meeting Dashboard</h3>
          <p className="text-sm text-indigo-700 mt-1">
            You have {meetings.filter(m => m.status === 'Scheduled').length} upcoming meetings scheduled.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search meetings, clients, or venues..." />
        </FilterBar>

        <TableCard>
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No meetings found."
          />
        </TableCard>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">
                {editMeetingId ? 'Edit CRM Meeting' : 'Schedule CRM Meeting'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Title *</label>
                  <input placeholder="e.g. Q2 Range Presentation" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={title} onChange={(e)=>setTitle(e.target.value)} />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Client / Lead *</label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" 
                    value={leadId} 
                    onChange={(e)=>setLeadId(e.target.value)}
                  >
                    <option value="" disabled>-- Choose a Lead --</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>{lead.name} ({lead.id})</option>
                    ))}
                  </select>
                  {leads.length === 0 && <p className="text-xs text-rose-500 mt-1">No leads found. Create one first!</p>}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Type *</label>
                  <select className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" value={meetingType} onChange={(e)=>setMeetingType(e.target.value)}>
                    <option value="Doctor Group Meet">Doctor Group Meet</option>
                    <option value="Stockist Review">Stockist Review</option>
                    <option value="Clinical Presentation">Clinical Presentation</option>
                    <option value="Team Sync">Team Sync</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label>
                    <input type="date" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={date} onChange={(e)=>setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Time *</label>
                    <input type="time" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={time} onChange={(e)=>setTime(e.target.value)} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Venue / Location *</label>
                  <input placeholder="e.g. Apollo Hospital Conference Room" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={venue} onChange={(e)=>setVenue(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Participants (Comma separated) *</label>
                  <input placeholder="e.g. Dr. Ramesh, Chemist Sunil" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={participants} onChange={(e)=>setParticipants(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Agenda / Notes</label>
                  <textarea placeholder="What will be discussed..." className="w-full border border-slate-300 rounded-xl p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500" value={agenda} onChange={(e)=>setAgenda(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button disabled={!leadId} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 disabled:bg-slate-300" onClick={handleScheduleOrUpdate}>{editMeetingId ? 'Save Changes' : 'Schedule Meeting'}</button>
            </div>
          </div>
        </div>
      )}

      {viewMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Meeting Details</h2>
              <button onClick={() => setViewMeeting(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewMeeting.title}</h3>
                <p className="text-sm text-indigo-600 font-semibold mt-1">{viewMeeting.meetingType}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Date & Time</p>
                    <p className="text-sm text-slate-800 font-medium">
                      {new Date(viewMeeting.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-600">{viewMeeting.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Venue</p>
                    <p className="text-sm text-slate-800 font-medium">{viewMeeting.venue}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Participants & Client</p>
                    <p className="text-sm text-slate-800 font-medium">Client: {viewMeeting.client}</p>
                    <p className="text-sm text-slate-600 mt-1">{viewMeeting.participants}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <AlignLeft className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">Agenda / Notes</p>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{viewMeeting.agenda || 'No agenda provided.'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors" onClick={() => setViewMeeting(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}