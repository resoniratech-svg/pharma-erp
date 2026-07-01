// import { useState } from 'react';
// import { SearchInput, PageHeader, FilterBar } from './components/shared';
// import { Crosshair } from 'lucide-react';

// export default function LocationTracking() {
//   const [search, setSearch] = useState('');

//   return (
//     <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
//       <PageHeader
//         title="Daily Movement Tracking"
//         subtitle="Real-time GPS tracking of active field representatives."
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search active rep..." />
//       </FilterBar>

//       <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
//          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         
//          <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-slate-100 w-64">
//             <h4 className="font-semibold text-sm mb-3">Active Reps (2)</h4>
//             <div className="space-y-3">
//                 <div className="flex items-center gap-3">
//                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
//                     <div className="text-sm font-medium">Rahul Verma</div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
//                     <div className="text-sm font-medium">Amit Singh</div>
//                 </div>
//             </div>
//          </div>

//          <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
//              <Crosshair className="w-12 h-12 text-slate-400 mx-auto mb-3" />
//              <h3 className="text-lg font-semibold text-slate-800">Live Map Placeholder</h3>
//              <p className="text-sm text-slate-500 max-w-sm mt-1">Real-time marker locations based on web sockets / GPS polling.</p>
//          </div>
//       </div>
//     </div>
//   );
// }



//////////////////////////////////////////////////////////////////////
import { useState, useEffect } from 'react';
import { SearchInput, PageHeader, FilterBar } from './components/shared';
import { Crosshair, MapPin } from 'lucide-react';

// ✅ Fix 2: Added 'id' to guarantee unique React keys, and ✅ Fix 3: Removed unused 'status' field
interface ActiveRep {
  id: string;
  repName: string;
  checkInTime: string;
  location: string;
  lat?: number;
  lng?: number;
  lastUpdated?: string;
}

export default function LocationTracking() {
  const [search, setSearch] = useState('');
  const [activeReps, setActiveReps] = useState<ActiveRep[]>([]);

  const loadActiveReps = () => {
    const todayDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    
    // ✅ Fix 1: Added try...catch block to protect against corrupted localStorage data
    let attendanceData = [];
    try {
        attendanceData = JSON.parse(localStorage.getItem('web_attendance_records') || '[]');
    } catch (error) {
        console.error("Failed to load attendance:", error);
    }
    
    const activeToday = attendanceData.filter((a: any) => 
        a.date === todayDateStr && 
        (!a.checkOutTime || a.checkOutTime === '-')
    );

    const mappedReps: ActiveRep[] = activeToday.map((a: any, idx: number) => ({
      id: a.id || a.userId || `${a.repName}-${idx}`, // Guarantees a unique ID
      repName: a.repName,
      checkInTime: a.checkInTime,
      location: a.location || 'Unknown Location',
      lat: a.latitude,
      lng: a.longitude,
      lastUpdated: a.checkInTime, 
    }));

    setActiveReps(mappedReps);
  };

  useEffect(() => {
    loadActiveReps();
    const interval = setInterval(loadActiveReps, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredReps = activeReps.filter(rep => 
    rep.repName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Daily Movement Tracking"
        subtitle="Real-time GPS tracking of active field representatives."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search active rep..." />
      </FilterBar>

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center min-h-[600px] mt-2">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         
         <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100 w-72 max-h-[80%] overflow-y-auto z-20">
            <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
               Active Reps 
               <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs ml-auto">{filteredReps.length}</span>
            </h4>
            
            {filteredReps.length > 0 ? (
                <div className="space-y-3">
                    {/* ✅ Used the unique ID as the React Key */}
                    {filteredReps.map((rep) => (
                        <div key={rep.id} className="flex gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mt-1 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <div>
                                <div className="text-sm font-bold text-slate-900">{rep.repName}</div>
                                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3 text-slate-400"/> {rep.location}
                                </div>
                                <div className="text-[10px] font-bold text-indigo-500 mt-1 bg-indigo-50 inline-block px-1.5 py-0.5 rounded">
                                    Last Activity: {rep.lastUpdated}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6">
                    <Crosshair className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        {search ? 'No active reps match your search.' : 'No reps are currently checked in today.'}
                    </p>
                </div>
            )}
         </div>

         <div className="text-center z-10 p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm max-w-sm">
             <Crosshair className="w-12 h-12 text-slate-400 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-slate-800">Live Map Placeholder</h3>
             <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                 Real-time marker locations based on web sockets / GPS polling. Selecting an active rep will zoom to their current location.
             </p>
         </div>
      </div>
    </div>
  );
}