// import { useState } from 'react';
// import { Plus, Video, Users } from 'lucide-react';
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

// interface Meeting {
//   id: string;
//   title: string;
//   date: string;
//   type: 'Cycle Meeting' | 'Training' | 'Review';
//   status: 'Scheduled' | 'Completed';
// }

// const mockData: Meeting[] = [
//   { id: '1', title: 'Q3 Cycle Meeting & Product Launch', date: '25-Oct-2026', type: 'Cycle Meeting', status: 'Scheduled' },
//   { id: '2', title: 'Monthly Sales Review', date: '30-Oct-2026', type: 'Review', status: 'Scheduled' },
//   { id: '3', title: 'New Product Detailing Training', date: '05-Oct-2026', type: 'Training', status: 'Completed' },
// ];

// export default function Meetings() {
//   const [search, setSearch] = useState('');

//   const columns: Column<Meeting>[] = [
//     { key: 'title', label: 'Meeting Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
//     { key: 'date', label: 'Date' },
//     { key: 'type', label: 'Type', render: (row) => <span className="font-medium text-slate-600">{row.type}</span> },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Completed' ? 'neutral' : 'info';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: (row) => row.status === 'Scheduled' ? <ActionButton variant="secondary" className="text-xs px-2 py-1 border-violet-200 text-violet-700"><Video className="w-4 h-4 mr-1" /> Join</ActionButton> : <span className="text-slate-300">-</span>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     return item.title.toLowerCase().includes(search.toLowerCase());
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Meeting Scheduling"
//         subtitle="Manage cycle meetings, territory reviews, and corporate training sessions."
//         actions={
//           <ActionButton icon={<Plus className="w-4 h-4" />}>Schedule Meeting</ActionButton>
//         }
//       />

//       <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
//         <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-semibold text-indigo-800">Upcoming Regional Meeting</h3>
//           <p className="text-sm text-indigo-700 mt-1">You are required to attend the Q3 Cycle Meeting on Oct 25th in Mumbai.</p>
//         </div>
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search meetings..." />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No meetings found."
//         />
//       </TableCard>
//     </div>
//   );
// }



////////////////////////////////////////////////////////////////////////import { useState, useEffect } from 'react';

import { useState ,useEffect} from 'react';

//import React, { useState, useEffect } from 'react';
import { Plus, Users, X, Check, XCircle, Edit, Eye, Calendar, MapPin, AlignLeft, UserCircle, AlertCircle, Video, Clock } from 'lucide-react';
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
import { validateCheckIn } from '../../utils/attendanceValidation';

interface MRMeeting {
  id: string;
  title: string;
  type: string;
  organizer: string;
  location: string;
  meetingMode: 'Offline' | 'Online' | 'Hybrid';
  date: string;
  time: string;
  rawTime: string;
  priority: 'High' | 'Medium' | 'Low';
  reminder: '15 Minutes' | '30 Minutes' | '1 Hour' | '1 Day' | 'None';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  agenda: string;
  participants: string;
  attendeesCount: number;
  followUpDate: string;
  outcome: string;
}

export default function MrMeetings() {
  const [search, setSearch] = useState('');
  const [meetings, setMeetings] = useState<MRMeeting[]>([]);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<MRMeeting | null>(null);
  
  // Edit State
  const [editMeetingId, setEditMeetingId] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Doctor Group Meeting');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [meetingMode, setMeetingMode] = useState<'Offline' | 'Online' | 'Hybrid'>('Offline');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [reminder, setReminder] = useState<'15 Minutes' | '30 Minutes' | '1 Hour' | '1 Day' | 'None'>('15 Minutes');
  const [agenda, setAgenda] = useState('');
  const [participants, setParticipants] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('@mr_meetings');
    if (stored) {
      try {
        setMeetings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse MR meetings', e);
      }
    }
  }, []);

  const handleUpdateStatus = (id: string, newStatus: 'Completed' | 'Cancelled') => {
    const updated = meetings.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMeetings(updated);
    localStorage.setItem('@mr_meetings', JSON.stringify(updated));
  };

  const openNewMeetingForm = () => {
    setEditMeetingId(null);
    setTitle('');
    setType('Doctor Group Meeting');
    setOrganizer('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('10:00');
    setLocation('');
    setMeetingMode('Offline');
    setPriority('Medium');
    setReminder('15 Minutes');
    setAgenda('');
    setParticipants('');
    setFollowUpDate('');
    setIsFormOpen(true);
  };

  const openEditMeetingForm = (meeting: MRMeeting) => {
    setEditMeetingId(meeting.id);
    setTitle(meeting.title);
    setType(meeting.type);
    setOrganizer(meeting.organizer);
    setDate(meeting.date);
    setTime(meeting.rawTime);
    setLocation(meeting.location);
    setMeetingMode(meeting.meetingMode || 'Offline');
    setPriority(meeting.priority || 'Medium');
    setReminder(meeting.reminder || '15 Minutes');
    setAgenda(meeting.agenda);
    setParticipants(meeting.participants || '');
    setFollowUpDate(meeting.followUpDate || '');
    setIsFormOpen(true);
  };

  // const handleScheduleOrUpdate = () => {
    
  //   if (!title.trim() || !location.trim() || !organizer.trim() || !participants.trim()) {
  //     alert('Please fill in all required fields (Title, Location, Organizer, Participants).');
  //     return;
  //   }

  //   if (followUpDate && followUpDate < date) {
  //     alert('Follow-up date cannot be earlier than meeting date.');
  //     return;
  //   }

  //   const todayStr = new Date().toISOString().split('T')[0];
  //   if (!editMeetingId && date < todayStr) {
  //     alert('Cannot schedule a meeting on a past date.');
  //     return;
  //   }

  //   if (!editMeetingId && date === todayStr) {
  //     const now = new Date();
  //     const currentHours = now.getHours();
  //     const currentMinutes = now.getMinutes();
  //     const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      
  //     if (time < currentTimeStr) {
  //       alert('Cannot schedule a meeting at a past time today.');
  //       return;
  //     }
  //   }
  const handleScheduleOrUpdate = () => {
    // 1. NEW: Check if the MR is checked in before they can schedule!
    if (!validateCheckIn()) {
      return;
    }

    if (!title.trim() || !location.trim() || !organizer.trim() || !participants.trim()) {
      alert('Please fill in all required fields (Title, Location, Organizer, Participants).');
      return;
    }

    if (followUpDate && followUpDate < date) {
      alert('Follow-up date cannot be earlier than meeting date.');
      return;
    }

    // 2. NEW: Prevent scheduling meetings on past dates
    const todayStr = new Date().toISOString().split('T')[0];
    if (!editMeetingId && date < todayStr) {
      alert('Cannot schedule a meeting on a past date.');
      return;
    }

    // 3. NEW: Prevent scheduling past times if the meeting is today
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

    // ... continue with your existing meeting conflict logic below ...
    const isConflict = meetings.some(
      (m) => m.date === date && m.rawTime === time && m.status === 'Scheduled' && m.id !== editMeetingId
    );
    if (isConflict) {
      alert('Scheduling Conflict: You already have an active meeting scheduled at this exact time and date.');
      return;
    }

    let [h, m] = time.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const displayTime = `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;

    const attendeesCount = participants.split(',').map(p => p.trim()).filter(p => p.length > 0).length;

    const newMeetingData: MRMeeting = {
      id: editMeetingId || Date.now().toString(),
      title,
      type,
      organizer: organizer.trim(),
      location,
      meetingMode,
      date,
      time: displayTime,
      rawTime: time,
      priority,
      reminder,
      status: 'Scheduled',
      agenda,
      participants,
      attendeesCount,
      followUpDate,
      outcome: ''
    };

    let updatedMeetings;
    if (editMeetingId) {
      updatedMeetings = meetings.map(m => m.id === editMeetingId ? newMeetingData : m);
    } else {
      updatedMeetings = [newMeetingData, ...meetings];
    }

    setMeetings(updatedMeetings);
    localStorage.setItem('@mr_meetings', JSON.stringify(updatedMeetings));
        // --- START OF GLOBAL NOTIFICATION BRIDGE ---
    try {
      const storedGlobal = localStorage.getItem('crm_meetings');
      let globalMeetings = storedGlobal ? JSON.parse(storedGlobal) : [];
      
      const newGlobalReminder = {
        meetingId: newMeetingData.id,
        meetingTitle: newMeetingData.title,
        participant: newMeetingData.organizer || newMeetingData.participants,
        meetingType: newMeetingData.type,
        date: newMeetingData.date,
        time: newMeetingData.time,
        reminderStatus: 'Pending',
        status: newMeetingData.status
      };
      
      // If we are editing, update the old one. If not, add the new one!
      if (editMeetingId) {
        globalMeetings = globalMeetings.map((m: any) => 
          m.meetingId === editMeetingId ? { ...m, ...newGlobalReminder } : m
        );
      } else {
        globalMeetings.push(newGlobalReminder);
      }
      
      // Send it to the Notification Engine
      localStorage.setItem('crm_meetings', JSON.stringify(globalMeetings));
    } catch (e) {
      console.error("Failed to sync global meeting", e);
    }
    // --- END OF GLOBAL NOTIFICATION BRIDGE ---

    setIsFormOpen(false);
       if (editMeetingId) {
      alert('✅ Meeting updated successfully!');
    } else {
      alert('✅ Meeting scheduled successfully!');
    }
  };

  const columns: Column<MRMeeting>[] = [
    { key: 'title', label: 'Meeting Title', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
    { key: 'type', label: 'Type' },
    { key: 'organizer', label: 'Organizer', render: (row) => <span className="text-slate-600 font-medium">{row.organizer}</span> },
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600 font-medium">{row.date}</span> },
    { key: 'time', label: 'Time', render: (row) => <span className="text-slate-600 font-medium">{row.time}</span> },
    { key: 'attendees', label: 'Attendees', render: (row) => <span className="text-slate-600 font-medium">{row.attendeesCount || 0}</span> },
    { 
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Scheduled' ? 'info' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => setViewMeeting(row)} className="p-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'Scheduled' && (
            <>
              <button onClick={() => openEditMeetingForm(row)} className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors" title="Edit Meeting">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleUpdateStatus(row.id, 'Completed')} className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors" title="Mark Completed">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => handleUpdateStatus(row.id, 'Cancelled')} className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded hover:bg-rose-100 transition-colors" title="Cancel Meeting">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const filteredData = meetings.filter((item) => {
    return item.title.toLowerCase().includes(search.toLowerCase()) || 
           item.type.toLowerCase().includes(search.toLowerCase());
  });

  const scheduledCount = meetings.filter(m => m.status === 'Scheduled').length;
  const completedCount = meetings.filter(m => m.status === 'Completed').length;
  const cancelledCount = meetings.filter(m => m.status === 'Cancelled').length;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="MR Meeting Scheduling"
        subtitle="Manage territory reviews, chemist meetings, and corporate training sessions."
        actions={
          <ActionButton onClick={openNewMeetingForm} icon={<Plus className="w-4 h-4" />}>
            Schedule Meeting
          </ActionButton>
        }
      />

      {/* SUMMARY CARDS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <Calendar className="w-6 h-6 text-indigo-600 mt-1" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-800">Upcoming Meetings</h3>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{scheduledCount}</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <Check className="w-6 h-6 text-emerald-600 mt-1" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-800">Completed</h3>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <XCircle className="w-6 h-6 text-rose-600 mt-1" />
          <div>
            <h3 className="text-sm font-semibold text-rose-800">Cancelled</h3>
            <p className="text-2xl font-bold text-rose-700 mt-1">{cancelledCount}</p>
          </div>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search meetings or types..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No meetings found."
        />
      </TableCard>

      {/* SCHEDULING / EDITING MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">
                {editMeetingId ? 'Edit Meeting' : 'Schedule Meeting'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Title *</label>
                  <input placeholder="e.g. Q3 Cycle Meeting" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={title} onChange={(e)=>setTitle(e.target.value)} />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Type *</label>
                  <select className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" value={type} onChange={(e)=>setType(e.target.value)}>
                    <option value="Doctor Group Meeting">Doctor Group Meeting</option>
                    <option value="Chemist Meeting">Chemist Meeting</option>
                    <option value="Hospital Meeting">Hospital Meeting</option>
                    <option value="Stockist Review">Stockist Review</option>
                    <option value="Clinical Presentation">Clinical Presentation</option>
                    <option value="Team Meeting">Team Meeting</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Organizer *</label>
                  <input placeholder="e.g. Regional Manager" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={organizer} onChange={(e)=>setOrganizer(e.target.value)} />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                  <select className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" value={priority} onChange={(e)=>setPriority(e.target.value as 'High' | 'Medium' | 'Low')}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
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

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Mode *</label>
                  <select className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" value={meetingMode} onChange={(e)=>setMeetingMode(e.target.value as 'Offline' | 'Online' | 'Hybrid')}>
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location / Venue *</label>
                  <input placeholder="e.g. Mumbai Regional Office" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={location} onChange={(e)=>setLocation(e.target.value)} />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reminder Before *</label>
                  <select className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" value={reminder} onChange={(e)=>setReminder(e.target.value as '15 Minutes' | '30 Minutes' | '1 Hour' | '1 Day' | 'None')}>
                    <option value="None">None</option>
                    <option value="15 Minutes">15 Minutes</option>
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="1 Day">1 Day</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Participants *</label>
                  <input placeholder="e.g. Dr. Sharma, Chemist Sunil" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={participants} onChange={(e)=>setParticipants(e.target.value)} />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Follow-Up Date</label>
                  <input type="date" className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" value={followUpDate} onChange={(e)=>setFollowUpDate(e.target.value)} />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Agenda / Notes</label>
                  <textarea placeholder="What will be discussed..." className="w-full border border-slate-300 rounded-xl p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500" value={agenda} onChange={(e)=>setAgenda(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700" onClick={handleScheduleOrUpdate}>{editMeetingId ? 'Save Changes' : 'Schedule Meeting'}</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW AGENDA MODAL */}
      {viewMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Meeting Details</h2>
              <button onClick={() => setViewMeeting(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{viewMeeting.title}</h3>
                  <p className="text-sm text-indigo-600 font-semibold mt-1">{viewMeeting.type}</p>
                </div>
                <Badge variant={viewMeeting.status === 'Completed' ? 'success' : viewMeeting.status === 'Scheduled' ? 'info' : 'neutral'}>
                  {viewMeeting.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Date & Time</p>
                    <p className="text-sm text-slate-800 font-medium">{viewMeeting.date}</p>
                    <p className="text-sm text-slate-600">{viewMeeting.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {viewMeeting.meetingMode === 'Online' ? <Video className="w-5 h-5 text-slate-400 mt-0.5" /> : <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Location ({viewMeeting.meetingMode})</p>
                    <p className="text-sm text-slate-800 font-medium">{viewMeeting.location}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <UserCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Organizer</p>
                    <p className="text-sm text-slate-800 font-medium">{viewMeeting.organizer}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Priority</p>
                    <p className={`text-sm font-semibold ${viewMeeting.priority === 'High' ? 'text-rose-600' : viewMeeting.priority === 'Medium' ? 'text-amber-600' : 'text-slate-600'}`}>
                      {viewMeeting.priority || 'Medium'}
                    </p>
                  </div>
                </div>
              </div>
              {viewMeeting.reminder !== 'None' && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <p className="text-sm text-slate-700"><span className="font-bold">Reminder:</span> {viewMeeting.reminder} before</p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">Participants ({viewMeeting.attendeesCount || 0})</p>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{viewMeeting.participants || 'None listed'}</p>
                  </div>
                </div>
                {viewMeeting.followUpDate && (
                  <div className="flex items-start gap-3 mt-4">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-500 uppercase">Follow-Up Date</p>
                      <p className="text-sm text-slate-700 mt-1">{viewMeeting.followUpDate}</p>
                    </div>
                  </div>
                )}
                {viewMeeting.outcome && (
                  <div className="flex items-start gap-3 mt-4">
                    <Check className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-500 uppercase">Outcome</p>
                      <p className="text-sm text-slate-700 mt-1">{viewMeeting.outcome}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 mt-4">
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