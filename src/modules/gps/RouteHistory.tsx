// // import { useState } from 'react';
// // import { SearchInput, PageHeader, FilterBar, ActionButton, SelectFilter } from './components/shared';
// // import { Route } from 'lucide-react';

// // export default function RouteHistory() {
// //   const [search, setSearch] = useState('');
// //   const [date, setDate] = useState('');

// //   return (
// //     <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
// //       <PageHeader
// //         title="Route History"
// //         subtitle="Playback the historical GPS breadcrumb trail of field reps."
// //       />

// //       <FilterBar>
// //         <SearchInput value={search} onChange={setSearch} placeholder="Search rep name..." />
// //         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
// //         <SelectFilter
// //           value={date}
// //           onChange={setDate}
// //           options={[
// //             { label: 'Today', value: 'today' },
// //             { label: 'Yesterday', value: 'yesterday' },
// //           ]}
// //           placeholder="Select Date"
// //         />
// //         <ActionButton icon={<Route className="w-4 h-4" />}>Load Route</ActionButton>
// //       </FilterBar>

// //       <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
// //          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
// //          <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
// //              <Route className="w-12 h-12 text-slate-400 mx-auto mb-3" />
// //              <h3 className="text-lg font-semibold text-slate-800">Map Interface Placeholder</h3>
// //              <p className="text-sm text-slate-500 max-w-sm mt-1">Select a representative and date to view their route history polyline on the map.</p>
// //          </div>
// //       </div>
// //     </div>
// //   );
// // }


// //////////////////////////////////////////////////////////////////////////////////////////////

// import { useState } from 'react';
// import { SearchInput, PageHeader, FilterBar, ActionButton, SelectFilter } from './components/shared';
// import { Route, Clock, MapPin } from 'lucide-react';

// // ✅ Fix 2: Proper TypeScript Interface instead of any[]
// interface RouteWaypoint {
//     time: string;
//     label: string;
//     lat?: number;
//     lng?: number;
//     type: 'start' | 'visit' | 'end';
// }

// export default function RouteHistory() {
//   const [search, setSearch] = useState('');
//   const [date, setDate] = useState('today');
  
//   // ✅ Applied the new interface here
//   const [routeData, setRouteData] = useState<RouteWaypoint[]>([]);
//   const [hasLoaded, setHasLoaded] = useState(false);

//   const handleLoadRoute = () => {
//     const targetDate = new Date();
//     if (date === 'yesterday') {
//         targetDate.setDate(targetDate.getDate() - 1);
//     }
//     const targetDateStr = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

//     const waypoints: RouteWaypoint[] = [];

//     // --- A. Fetch Attendance (Check-In & Check-Out) ---
//     const attendanceData = JSON.parse(localStorage.getItem('web_attendance_records') || '[]');
//     const filteredAttendance = attendanceData.filter((a: any) => 
//         a.date === targetDateStr && 
//         (search ? a.repName.toLowerCase().includes(search.toLowerCase()) : true)
//     );

//     filteredAttendance.forEach((a: any) => {
//       if (a.checkInTime) {
//           waypoints.push({ time: a.checkInTime, label: 'Day Started (Check-In)', lat: a.latitude, lng: a.longitude, type: 'start' });
//       }
//       if (a.checkOutTime && a.checkOutTime !== '-') {
//           waypoints.push({ time: a.checkOutTime, label: 'Day Ended (Check-Out)', lat: a.checkOutLatitude, lng: a.checkOutLongitude, type: 'end' });
//       }
//     });

//     // --- B. Fetch Doctor Visits ---
//     const doctorData = JSON.parse(localStorage.getItem('doctor_visits') || '[]');
//     const filteredDoctors = doctorData.filter((d: any) => 
//         (d.visitDate === targetDateStr || !d.visitDate) &&
//         (search ? (d.mrName?.toLowerCase() || '').includes(search.toLowerCase()) : true)
//     );

//     filteredDoctors.forEach((d: any) => {
//         // ✅ Fix 3: Use checkInDateTime if available for safer parsing
//         let vTime = d.visitTime || '-';
//         if (d.checkInDateTime) {
//             vTime = new Date(d.checkInDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
//         }
//         waypoints.push({ time: vTime, label: `Visited ${d.doctorName || 'Doctor'}`, lat: d.latitude, lng: d.longitude, type: 'visit' });
//     });

//     // --- C. Fetch Chemist Visits ---
//     const chemistData = JSON.parse(localStorage.getItem('chemist_visits') || '[]');
//     const filteredChemists = chemistData.filter((c: any) => 
//         (c.visitDate === targetDateStr || !c.visitDate) && 
//         (search ? (c.mrName?.toLowerCase() || '').includes(search.toLowerCase()) : true)
//     );

//     filteredChemists.forEach((c: any) => {
//         let vTime = c.visitTime || '-';
//         if (c.checkInDateTime) {
//             vTime = new Date(c.checkInDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
//         }
//         waypoints.push({ time: vTime, label: `Visited ${c.chemistName || c.shopName || 'Chemist'}`, lat: c.latitude, lng: c.longitude, type: 'visit' });
//     });

//     // ✅ Fix 1: Sort by time exactly as ChatGPT suggested!
//     waypoints.sort((a, b) => {
//         if (a.time === '-' && b.time !== '-') return 1;
//         if (a.time !== '-' && b.time === '-') return -1;
//         if (a.time === '-' && b.time === '-') return 0;
//         const timeA = new Date(`1970-01-01 ${a.time}`).getTime();
//         const timeB = new Date(`1970-01-01 ${b.time}`).getTime();
//         return timeA - timeB;
//     });

//     setRouteData(waypoints);
//     setHasLoaded(true);
//   };

//   return (
//     <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
//       <PageHeader
//         title="Route History"
//         subtitle="Playback the historical GPS breadcrumb trail of field reps."
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search rep name..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={date}
//           onChange={setDate}
//           options={[
//             { label: 'Today', value: 'today' },
//             { label: 'Yesterday', value: 'yesterday' },
//           ]}
//           placeholder="Select Date"
//         />
//         <ActionButton onClick={handleLoadRoute} icon={<Route className="w-4 h-4" />}>
//             Load Route
//         </ActionButton>
//       </FilterBar>

//       <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
//          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         
//          {hasLoaded && routeData.length > 0 ? (
//              <div className="absolute top-6 left-6 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-5 max-h-[90%] overflow-y-auto z-20 animate-in slide-in-from-left-4 duration-500">
//                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
//                      <Route className="w-5 h-5 text-indigo-600"/> Route Timeline
//                  </h4>
//                  <div className="flex flex-col gap-6">
//                      {routeData.map((wp, i) => (
//                          <div key={i} className="flex gap-4 relative">
//                             {i !== routeData.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-slate-200" />}
                            
//                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${wp.type === 'start' ? 'bg-emerald-100 text-emerald-600' : wp.type === 'end' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
//                                 <div className={`w-2.5 h-2.5 rounded-full ${wp.type === 'start' ? 'bg-emerald-600' : wp.type === 'end' ? 'bg-rose-600' : 'bg-indigo-600'}`} />
//                             </div>
                            
//                             <div className="pt-1">
//                                 <p className="font-semibold text-sm text-slate-800">{wp.label}</p>
//                                 <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
//                                     <Clock className="w-3.5 h-3.5"/> {wp.time}
//                                 </p>
//                                 {/* ✅ Fix 4: Safely check if lat/lng are not null */}
//                                {wp.lat != null && wp.lng != null &&(
//                                     <p className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center gap-1 bg-slate-50 p-1 rounded">
//                                         <MapPin className="w-3 h-3"/> {Number(wp.lat).toFixed(4)}, {Number(wp.lng).toFixed(4)}
//                                     </p>
//                                 )}
//                             </div>
//                          </div>
//                      ))}
//                  </div>
//              </div>
//          ) : hasLoaded ? (
//              <div className="absolute top-6 left-6 bg-white/95 p-4 rounded-xl shadow-lg border border-slate-200 z-20 animate-in fade-in">
//                  <p className="text-slate-600 font-medium">No route data found for this selection.</p>
//              </div>
//          ) : null}

//          <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
//              <Route className="w-12 h-12 text-slate-400 mx-auto mb-3" />
//              <h3 className="text-lg font-semibold text-slate-800">Map Interface Placeholder</h3>
//              <p className="text-sm text-slate-500 max-w-sm mt-1">Select a representative and date to view their route history polyline on the map.</p>
//          </div>
//       </div>
//     </div>
//   );
// }



///////////////////////////////////

import { useState } from 'react';
import { SearchInput, PageHeader, FilterBar, ActionButton, SelectFilter } from './components/shared';
// ✅ Added professional Lucide icons instead of emojis!
import { Route, Clock, MapPin, Navigation, Flag, User, Store } from 'lucide-react';

interface RouteWaypoint {
    time: string;
    timestamp: number; // ✅ For perfectly accurate sorting
    label: string;
    repName: string;   // ✅ Added Representative Name
    lat?: number;
    lng?: number;
    type: 'start' | 'visit' | 'end' | 'doctor' | 'chemist';
}

export default function RouteHistory() {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('today');
  
  const [routeData, setRouteData] = useState<RouteWaypoint[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleLoadRoute = () => {
    const targetDate = new Date();
    if (date === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
    }
    const targetDateStr = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

    const waypoints: RouteWaypoint[] = [];

    // --- A. Fetch Attendance (Check-In & Check-Out) ---
    const attendanceData = JSON.parse(localStorage.getItem('web_attendance_records') || '[]');
    const filteredAttendance = attendanceData.filter((a: any) => 
        a.date === targetDateStr && 
        (search ? a.repName.toLowerCase().includes(search.toLowerCase()) : true)
    );

    filteredAttendance.forEach((a: any) => {
      if (a.checkInTime) {
          waypoints.push({ 
              time: a.checkInTime, 
              timestamp: new Date(a.checkInDateTime || new Date()).getTime(),
              label: 'Day Started (Check-In)', 
              repName: a.repName,
              lat: a.latitude, 
              lng: a.longitude, 
              type: 'start' 
          });
      }
      if (a.checkOutTime && a.checkOutTime !== '-') {
          waypoints.push({ 
              time: a.checkOutTime, 
              timestamp: new Date(a.checkOutDateTime || new Date()).getTime(),
              label: 'Day Ended (Check-Out)', 
              repName: a.repName,
              lat: a.checkOutLatitude, 
              lng: a.checkOutLongitude, 
              type: 'end' 
          });
      }
    });

    // --- B. Fetch Doctor Visits ---
    const doctorData = JSON.parse(localStorage.getItem('doctor_visits') || '[]');
    const filteredDoctors = doctorData.filter((d: any) => 
        (d.visitDate === targetDateStr || !d.visitDate) &&
        (search ? (d.mrName?.toLowerCase() || '').includes(search.toLowerCase()) : true)
    );

    filteredDoctors.forEach((d: any) => {
        let vTime = d.visitTime || '-';
        let tStamp = 0;
        if (d.checkInDateTime) {
            vTime = new Date(d.checkInDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            tStamp = new Date(d.checkInDateTime).getTime();
        } else if (d.visitDate) {
            tStamp = new Date(d.visitDate).getTime();
        }
        
        waypoints.push({ 
            time: vTime, 
            timestamp: tStamp,
            label: `Visited ${d.doctorName || 'Doctor'}`, 
            repName: d.mrName || search || 'Medical Representative',
            lat: d.latitude, 
            lng: d.longitude, 
            type: 'doctor' 
        });
    });

    // --- C. Fetch Chemist Visits ---
    const chemistData = JSON.parse(localStorage.getItem('chemist_visits') || '[]');
    const filteredChemists = chemistData.filter((c: any) => 
        (c.visitDate === targetDateStr || !c.visitDate) && 
        (search ? (c.mrName?.toLowerCase() || '').includes(search.toLowerCase()) : true)
    );

    filteredChemists.forEach((c: any) => {
        let vTime = c.visitTime || '-';
        let tStamp = 0;
        if (c.checkInDateTime) {
            vTime = new Date(c.checkInDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            tStamp = new Date(c.checkInDateTime).getTime();
        } else if (c.visitDate) {
            tStamp = new Date(c.visitDate).getTime();
        }

        waypoints.push({ 
            time: vTime, 
            timestamp: tStamp,
            label: `Visited ${c.chemistName || c.shopName || 'Chemist'}`, 
            repName: c.mrName || search || 'Medical Representative',
            lat: c.latitude, 
            lng: c.longitude, 
            type: 'chemist' 
        });
    });

    // ✅ Fix 1: Perfect numerical timestamp sorting
    waypoints.sort((a, b) => a.timestamp - b.timestamp);

    setRouteData(waypoints);
    setHasLoaded(true);
  };

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Route History"
        subtitle="Playback the historical GPS breadcrumb trail of field reps."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search rep name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={date}
          onChange={setDate}
          options={[
            { label: 'Today', value: 'today' },
            { label: 'Yesterday', value: 'yesterday' },
          ]}
          placeholder="Select Date"
        />
        <ActionButton onClick={handleLoadRoute} icon={<Route className="w-4 h-4" />}>
            Load Route
        </ActionButton>
      </FilterBar>

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         
         {hasLoaded && routeData.length > 0 ? (
             <div className="absolute top-6 left-6 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-5 max-h-[90%] overflow-y-auto z-20 animate-in slide-in-from-left-4 duration-500">
                 <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                     <Route className="w-5 h-5 text-indigo-600"/> Route Timeline
                 </h4>
                 <div className="flex flex-col gap-6">
                     {routeData.map((wp, i) => (
                         <div key={i} className="flex gap-4 relative">
                            {i !== routeData.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-slate-200" />}
                            
                            {/* ✅ Updated Icon Logic instead of emojis */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm 
                                ${wp.type === 'start' ? 'bg-emerald-100 text-emerald-600' : 
                                  wp.type === 'end' ? 'bg-rose-100 text-rose-600' : 
                                  wp.type === 'doctor' ? 'bg-blue-100 text-blue-600' : 
                                  'bg-purple-100 text-purple-600'}`}>
                                
                                {wp.type === 'start' && <Navigation className="w-3.5 h-3.5" />}
                                {wp.type === 'end' && <Flag className="w-3.5 h-3.5" />}
                                {wp.type === 'doctor' && <User className="w-3.5 h-3.5" />}
                                {wp.type === 'chemist' && <Store className="w-3.5 h-3.5" />}
                            </div>
                            
                            <div className="pt-1">
                                <p className="font-semibold text-sm text-slate-800">{wp.label}</p>
                                {/* ✅ Added Rep Name */}
                                <p className="text-xs font-medium text-slate-500 mb-1">{wp.repName}</p>
                                
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                                    <Clock className="w-3.5 h-3.5"/> {wp.time}
                                </p>
                                {wp.lat != null && wp.lng != null && (
                                    <p className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center gap-1 bg-slate-50 p-1 rounded">
                                        <MapPin className="w-3 h-3"/> {Number(wp.lat).toFixed(4)}, {Number(wp.lng).toFixed(4)}
                                    </p>
                                )}
                            </div>
                         </div>
                     ))}
                 </div>
             </div>
         ) : hasLoaded ? (
             <div className="absolute top-6 left-6 bg-white/95 p-4 rounded-xl shadow-lg border border-slate-200 z-20 animate-in fade-in">
                 <p className="text-slate-600 font-medium">No route data found for this selection.</p>
             </div>
         ) : null}

         <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
             <Route className="w-12 h-12 text-slate-400 mx-auto mb-3" />
             <h3 className="text-lg font-semibold text-slate-800">Map Interface Placeholder</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-1">Select a representative and date to view their route history polyline on the map.</p>
         </div>
      </div>
    </div>
  );
}