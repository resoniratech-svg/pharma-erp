// import { useState, useEffect } from 'react';
// import { SearchInput, PageHeader, FilterBar, SelectFilter, SummaryCard, Badge } from './components/shared';
// import { Map, Users, MapPin, ShieldCheck, ShieldAlert, CheckCircle2, RotateCw } from 'lucide-react';
// import { ROLE_SUPER_ADMIN, ROLE_MEDICAL_REPRESENTATIVE } from '../../constants/roles';

// interface Territory {
//   id: string;
//   name: string;
//   state: string;
//   district: string;
//   area: string;
//   assignedMr: string;
//   status: 'Active' | 'Inactive';
//   doctorCount: number;
//   chemistCount: number;
//   coverage: number;
//   totalTarget: number;
// }

// const isToday = (dateStr: string): boolean => {
//   if (!dateStr) return false;
//   const today = new Date();
//   const yyyy  = today.getFullYear();
//   const mm    = String(today.getMonth() + 1).padStart(2, '0');
//   const dd    = String(today.getDate()).padStart(2, '0');
//   const isoToday  = `${yyyy}-${mm}-${dd}`;
//   const months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//   const formatted = `${dd}-${months[today.getMonth()]}-${yyyy}`;
//   return (
//     dateStr.includes(isoToday)       ||
//     dateStr.includes(formatted)       ||
//     dateStr === today.toDateString()
//   );
// };

// export default function TerritoryTracking() {
//   const [search,              setSearch]              = useState('');
//   const [statusFilter,        setStatusFilter]        = useState('');
//   const [territories,         setTerritories]         = useState<Territory[]>([]);
//   const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
//   const [refreshKey,          setRefreshKey]          = useState(0);

//   const activeRole  = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
//   const isMr        = activeRole === ROLE_MEDICAL_REPRESENTATIVE;
//   const authUser    = JSON.parse(localStorage.getItem('authUser') || 'null');
//   const displayName = authUser?.fullName || 'Medical Representative';

//   useEffect(() => {
//     const storedDocs     = JSON.parse(localStorage.getItem('doctor_visits')          || '[]');
//     const storedChemists = JSON.parse(localStorage.getItem('chemist_visits')         || '[]');
//     const attendance     = JSON.parse(localStorage.getItem('web_attendance_records') || '[]');

//     const getVisitLocation = (visit: any): string => {
//       if (visit.location && visit.location.trim()) return visit.location.trim();

//       const dateStr = visit.visitDate || '';
//       const matched = attendance.find((r: any) =>
//         r.date && (r.date === dateStr || r.date.includes(dateStr) || dateStr.includes(r.date))
//       );
//       if (matched?.location?.trim()) return matched.location.trim();

//       if (visit.clinic && visit.clinic.trim()) return visit.clinic.trim();

//       return 'Unknown';
//     };

//     const getRegionFromAttendance = (loc: string): { district: string; state: string } => {
//       const record = attendance.find((r: any) =>
//         r.location && (r.location.trim().toLowerCase() === loc.trim().toLowerCase() || r.location.toLowerCase().includes(loc.trim().toLowerCase()))
//       );

//       if (record?.location) {
//         const parts = record.location.split(',').map((p: string) => p.trim()).filter(Boolean);
//         if (parts.length >= 3) {
//           return {
//             district: parts[parts.length - 3] || loc,
//             state:    parts[parts.length - 2] || 'Unknown',
//           };
//         }
//         if (parts.length === 2) {
//           return { district: parts[0], state: parts[1] };
//         }
//       }

//       return { district: loc, state: 'Unknown' };
//     };

//     // const docsToProcess     = isMr ? storedDocs.filter((d: any)    => d.mrName === displayName) : storedDocs;
//     // const chemistsToProcess = isMr ? storedChemists.filter((c: any) => c.mrName === displayName) : storedChemists;

//     const docsToProcess     = isMr ? storedDocs.filter((d: any)    => !d.mrName || d.mrName === displayName) : storedDocs;
// const chemistsToProcess = isMr ? storedChemists.filter((c: any) => !c.mrName || c.mrName === displayName) : storedChemists;
//     const territoryMap: Record<string, Territory> = {};

//     docsToProcess.forEach((doc: any) => {
//       const loc = getVisitLocation(doc);
//       if (loc === 'Unknown') return;

//       if (!territoryMap[loc]) {
//         const region = getRegionFromAttendance(loc);
//         territoryMap[loc] = {
//           id:           `TER-${String(Object.keys(territoryMap).length + 1).padStart(3, '0')}`,
//           name:         `${loc} Region`,
//           area:         loc,
//           district:     region.district,
//           state:        region.state,
//           assignedMr:   doc.mrName || displayName,
//           status:       'Inactive',
//           doctorCount:  0,
//           chemistCount: 0,
//           coverage:     0,
//           totalTarget:  0,
//         };
//       }

//       territoryMap[loc].doctorCount += 1;
//       if (isToday(doc.visitDate || '')) {
//         territoryMap[loc].status = 'Active';
//       }
//     });

//     chemistsToProcess.forEach((chem: any) => {
//       const loc = getVisitLocation(chem);
//       if (loc === 'Unknown') return;

//       if (!territoryMap[loc]) {
//         const region = getRegionFromAttendance(loc);
//         territoryMap[loc] = {
//           id:           `TER-${String(Object.keys(territoryMap).length + 1).padStart(3, '0')}`,
//           name:         `${loc} Region`,
//           area:         loc,
//           district:     region.district,
//           state:        region.state,
//           assignedMr:   chem.mrName || displayName,
//           status:       'Inactive',
//           doctorCount:  0,
//           chemistCount: 0,
//           coverage:     0,
//           totalTarget:  0,
//         };
//       }

//       territoryMap[loc].chemistCount += 1;
//       if (isToday(chem.visitDate || '')) {
//         territoryMap[loc].status = 'Active';
//       }
//     });

//     const allDocsForLoc  = (loc: string) => storedDocs.filter((d: any)    => getVisitLocation(d) === loc).length;
//     const allChemsForLoc = (loc: string) => storedChemists.filter((c: any) => getVisitLocation(c) === loc).length;

//     Object.keys(territoryMap).forEach(loc => {
//       const t           = territoryMap[loc];
//       const totalTarget = allDocsForLoc(loc) + allChemsForLoc(loc);
//       const totalVisits = t.doctorCount + t.chemistCount;

//       t.totalTarget = totalTarget;
//       t.coverage    = totalTarget > 0
//         ? Math.min(Math.round((totalVisits / totalTarget) * 100), 100)
//         : 0;
//     });

//     setTerritories(Object.values(territoryMap));
//   }, [displayName, isMr, refreshKey]);

//   const filtered = territories.filter(t => {
//     const matchSearch =
//       t.name.toLowerCase().includes(search.toLowerCase())       ||
//       t.assignedMr.toLowerCase().includes(search.toLowerCase()) ||
//       t.area.toLowerCase().includes(search.toLowerCase())        ||
//       t.id.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? t.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   const activeCount   = filtered.filter(t => t.status === 'Active').length;
//   const inactiveCount = filtered.filter(t => t.status === 'Inactive').length;
//   const assignedMRs   = new Set(
//     filtered.filter(t => t.assignedMr && t.assignedMr !== 'Unassigned').map(t => t.assignedMr)
//   ).size;
//   const avgCoverage = filtered.length > 0
//     ? Math.round(filtered.reduce((s, t) => s + t.coverage, 0) / filtered.length)
//     : 0;

//   const selectedTerritory = territories.find(t => t.id === selectedTerritoryId);

//   return (
//     <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
//       <PageHeader
//         title="Territory Tracking"
//         subtitle={
//           isMr
//             ? 'View and manage your assigned spatial regions.'
//             : 'Visualize assigned patches, HQ boundaries, and coverage gaps.'
//         }
//       />

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//         <SummaryCard
//           title="Active Territories"
//           value={activeCount.toString()}
//           subtitle="Visited today"
//           icon={<ShieldCheck className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Inactive Territories"
//           value={inactiveCount.toString()}
//           subtitle="No visit today"
//           icon={<ShieldAlert className="w-6 h-6" />}
//           colorClass="text-rose-600"
//           bgClass="bg-rose-50"
//         />
//         <SummaryCard
//           title="Assigned MRs"
//           value={assignedMRs.toString()}
//           subtitle="Active field force"
//           icon={<Users className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//         <SummaryCard
//           title="Avg. Coverage"
//           value={`${avgCoverage}%`}
//           subtitle="Overall territory reach"
//           icon={<CheckCircle2 className="w-6 h-6" />}
//           colorClass="text-indigo-600"
//           bgClass="bg-indigo-50"
//         />
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search territory, code, area, or MR…" />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Active',   value: 'Active'   },
//             { label: 'Inactive', value: 'Inactive' },
//           ]}
//           placeholder="Status"
//         />
//         <button
//           onClick={() => setRefreshKey(prev => prev + 1)}
//           title="Refresh Data"
//           className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center justify-center ml-2"
//         >
//           <RotateCw className="w-4 h-4" />
//         </button>
//       </FilterBar>

//       <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex mt-2 min-h-[600px]">
//         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />

//         {/* Left Sidebar */}
//         <div className="w-80 bg-white/95 backdrop-blur-md border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 flex flex-col h-full absolute left-0 top-0">
//           <div className="p-5 border-b border-slate-100 bg-white">
//             <h4 className="font-bold text-slate-800 flex items-center gap-2">
//               <Map className="w-5 h-5 text-indigo-600" />
//               Territories
//               <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-auto">
//                 {filtered.length}
//               </span>
//             </h4>
//           </div>

//           <div className="flex-1 overflow-y-auto p-4 space-y-4">
//             {filtered.map(t => (
//               <div
//                 key={t.id}
//                 onClick={() => setSelectedTerritoryId(t.id)}
//                 className={`rounded-xl p-4 border transition-all cursor-pointer group ${
//                   selectedTerritoryId === t.id
//                     ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
//                     : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md'
//                 }`}
//               >
//                 <div className="flex justify-between items-start mb-3">
//                   <div>
//                     <div className="text-[10px] font-bold text-slate-400 mb-1">{t.id}</div>
//                     <h5 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
//                       {t.name}
//                     </h5>
//                   </div>
//                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
//                     t.status === 'Active'
//                       ? 'bg-emerald-100 text-emerald-700'
//                       : 'bg-slate-200 text-slate-600'
//                   }`}>
//                     {t.status}
//                   </span>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-xs font-medium text-slate-500 flex items-start gap-1.5">
//                     <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
//                     <span>{t.area},<br />{t.district}, {t.state}</span>
//                   </p>

//                   <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
//                     <div className="flex gap-3">
//                       <div className="text-[10px] text-slate-500 font-medium">
//                         Docs: <span className="text-slate-700">{t.doctorCount}</span>
//                       </div>
//                       <div className="text-[10px] text-slate-500 font-medium">
//                         Chems: <span className="text-slate-700">{t.chemistCount}</span>
//                       </div>
//                     </div>
//                     <div className="text-[10px] text-indigo-600 font-bold">{t.coverage}% Cov</div>
//                   </div>

//                   <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200/60">
//                     <Users className="w-3.5 h-3.5 text-slate-400" />
//                     <span className={t.assignedMr === 'Unassigned' ? 'text-slate-400 italic' : 'text-slate-700'}>
//                       {t.assignedMr}
//                     </span>
//                   </p>
//                 </div>
//               </div>
//             ))}

//             {filtered.length === 0 && (
//               <div className="text-center py-10 px-4">
//                 <Map className="w-10 h-10 text-slate-300 mx-auto mb-3" />
//                 <p className="text-sm font-medium text-slate-500 leading-relaxed">
//                   {search
//                     ? 'No territories match your search.'
//                     : isMr
//                       ? 'No territories found. Log a doctor or chemist visit first!'
//                       : 'No territories assigned yet. Visit data will appear here automatically.'}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Detail Panel */}
//         <div className="flex-1 flex flex-col items-center justify-center relative z-10 ml-80 p-8 overflow-y-auto">
//           {selectedTerritory ? (
//             <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-6 w-full max-w-2xl text-left space-y-6 animate-in fade-in duration-300">
//               <div className="flex justify-between items-start border-b border-slate-100 pb-4">
//                 <div>
//                   <span className="text-xs font-mono text-slate-400">{selectedTerritory.id}</span>
//                   <h3 className="text-xl font-bold text-slate-800">{selectedTerritory.name}</h3>
//                   <p className="text-sm text-slate-500 mt-1">
//                     {selectedTerritory.area}, {selectedTerritory.district}, {selectedTerritory.state}
//                   </p>
//                 </div>
//                 <Badge variant={selectedTerritory.status === 'Active' ? 'success' : 'neutral'}>
//                   {selectedTerritory.status}
//                 </Badge>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
//                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">MR Assigned</p>
//                   <p className="text-sm font-bold text-slate-700 mt-1">{selectedTerritory.assignedMr}</p>
//                 </div>
//                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
//                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Coverage</p>
//                   <p className="text-sm font-bold text-indigo-600 mt-1">{selectedTerritory.coverage}%</p>
//                 </div>
//                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
//                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Visits</p>
//                   <p className="text-sm font-bold text-emerald-600 mt-1">
//                     {selectedTerritory.doctorCount + selectedTerritory.chemistCount}
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Visit Performance</h4>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div className="p-4 border border-slate-100 rounded-xl bg-white">
//                     <p className="text-xs text-slate-400 font-medium">Doctor Visits</p>
//                     <p className="text-2xl font-bold text-slate-700 mt-1">{selectedTerritory.doctorCount}</p>
//                     <p className="text-xs text-slate-400 mt-0.5">Total logged</p>
//                   </div>
//                   <div className="p-4 border border-slate-100 rounded-xl bg-white">
//                     <p className="text-xs text-slate-400 font-medium">Chemist Visits</p>
//                     <p className="text-2xl font-bold text-slate-700 mt-1">{selectedTerritory.chemistCount}</p>
//                     <p className="text-xs text-slate-400 mt-0.5">Total logged</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex items-center gap-4">
//                 <Map className="w-10 h-10 text-indigo-600 shrink-0" />
//                 <div>
//                   <h4 className="text-sm font-bold text-slate-800">Map Integration Sandbox</h4>
//                   <p className="text-xs text-slate-500 mt-1 leading-relaxed">
//                     Geofencing boundaries, HQ coordinates, and live markers for doctors and chemists in{' '}
//                     <strong>{selectedTerritory.area}</strong> will be rendered in Leaflet Maps.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm max-w-sm">
//               <Map className="w-12 h-12 text-slate-400 mx-auto mb-4" />
//               <h3 className="text-xl font-bold text-slate-800">Territory Map Placeholder</h3>
//               <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
//                 Select a territory from the left-hand list to view its route summary, coverage stats, and spatial boundaries.
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

/////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { SearchInput, PageHeader, FilterBar, SelectFilter, SummaryCard, Badge, ActionButton } from './components/shared';
import { Map, Users, MapPin, ShieldCheck, ShieldAlert, CheckCircle2, RotateCw, Download, Calendar, Clock } from 'lucide-react';
import { ROLE_SUPER_ADMIN, ROLE_MEDICAL_REPRESENTATIVE } from '../../constants/roles';

interface Territory {
  id: string;
  name: string;
  state: string;
  district: string;
  area: string;
  assignedMr: string;
  status: 'Active' | 'Inactive';
  doctorCount: number;
  chemistCount: number;
  coverage: number;
  totalTarget: number;
  latitude: number;
  longitude: number;
  lastDoctorVisit?: string;
  lastChemistVisit?: string;
  lastActivityTime?: string;
}

const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  const isoToday  = `${yyyy}-${mm}-${dd}`;
  const months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatted = `${dd}-${months[today.getMonth()]}-${yyyy}`;
  return (
    dateStr.includes(isoToday)       ||
    dateStr.includes(formatted)       ||
    dateStr === today.toDateString()
  );
};

export default function TerritoryTracking() {
  const [search,              setSearch]              = useState('');
  const [statusFilter,        setStatusFilter]        = useState('');
  const [territories,         setTerritories]         = useState<Territory[]>([]);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [refreshKey,          setRefreshKey]          = useState(0);

  const activeRole  = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const isMr        = activeRole === ROLE_MEDICAL_REPRESENTATIVE;
  const authUser    = JSON.parse(localStorage.getItem('authUser') || 'null');
  const displayName = authUser?.fullName || 'Medical Representative';

  // ✅ Safe Activity Logging
  const logActivity = (type: string, description: string) => {
    try {
      const managerName = authUser?.fullName || displayName;
      const existingActivities = JSON.parse(localStorage.getItem('crm_activities') || '[]');
      const newActivity = {
        id: `ACT-${Date.now()}`,
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

  // ✅ Helper to generate realistic GPS coordinates for regions
  const getCoordinates = (area: string) => {
    const latMatch = area.match(/Lat:\s*([0-9.-]+)/i);
    const lngMatch = area.match(/Lng:\s*([0-9.-]+)/i);
    if (latMatch && lngMatch) {
      return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) };
    }

    const name = area.toLowerCase();
    if (name.includes('mumbai') || name.includes('andheri') || name.includes('bandra') || name.includes('thane')) {
      return { lat: 19.0760 + (Math.random() - 0.5) * 0.05, lng: 72.8777 + (Math.random() - 0.5) * 0.05 };
    }
    if (name.includes('delhi') || name.includes('connaught') || name.includes('noida')) {
      return { lat: 28.6139 + (Math.random() - 0.5) * 0.05, lng: 77.2090 + (Math.random() - 0.5) * 0.05 };
    }
    if (name.includes('bangalore') || name.includes('koramangala') || name.includes('whitefield')) {
      return { lat: 12.9716 + (Math.random() - 0.5) * 0.05, lng: 77.5946 + (Math.random() - 0.5) * 0.05 };
    }
    if (name.includes('hyderabad') || name.includes('hitech') || name.includes('gachibowli')) {
      return { lat: 17.3850 + (Math.random() - 0.5) * 0.05, lng: 78.4867 + (Math.random() - 0.5) * 0.05 };
    }
    return { lat: 17.3850 + (Math.random() - 0.5) * 0.08, lng: 78.4867 + (Math.random() - 0.5) * 0.08 };
  };

  useEffect(() => {
    const storedDocs     = JSON.parse(localStorage.getItem('doctor_visits')          || '[]');
    const storedChemists = JSON.parse(localStorage.getItem('chemist_visits')         || '[]');
    const attendance     = JSON.parse(localStorage.getItem('web_attendance_records') || '[]');

    const getVisitLocation = (visit: any): string => {
      if (visit.location && visit.location.trim()) return visit.location.trim();

      const dateStr = visit.visitDate || '';
      const matched = attendance.find((r: any) =>
        r.date && (r.date === dateStr || r.date.includes(dateStr) || dateStr.includes(r.date))
      );
      if (matched?.location?.trim()) return matched.location.trim();

      if (visit.clinic && visit.clinic.trim()) return visit.clinic.trim();

      return 'Unknown';
    };

    const getRegionFromAttendance = (loc: string): { district: string; state: string } => {
      const record = attendance.find((r: any) =>
        r.location && (r.location.trim().toLowerCase() === loc.trim().toLowerCase() || r.location.toLowerCase().includes(loc.trim().toLowerCase()))
      );

      if (record?.location) {
        const parts = record.location.split(',').map((p: string) => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          return {
            district: parts[parts.length - 3] || loc,
            state:    parts[parts.length - 2] || 'Unknown',
          };
        }
        if (parts.length === 2) {
          return { district: parts[0], state: parts[1] };
        }
      }

      return { district: loc, state: 'Unknown' };
    };

    const docsToProcess     = isMr ? storedDocs.filter((d: any)    => !d.mrName || d.mrName === displayName) : storedDocs;
    const chemistsToProcess = isMr ? storedChemists.filter((c: any) => !c.mrName || c.mrName === displayName) : storedChemists;
    const territoryMap: Record<string, Territory> = {};

    docsToProcess.forEach((doc: any) => {
      const loc = getVisitLocation(doc);
      if (loc === 'Unknown') return;

      if (!territoryMap[loc]) {
        const region = getRegionFromAttendance(loc);
        const coords = getCoordinates(loc);
        territoryMap[loc] = {
          id:           `TER-${String(Object.keys(territoryMap).length + 1).padStart(3, '0')}`,
          name:         `${loc} Region`,
          area:         loc,
          district:     region.district,
          state:        region.state,
          assignedMr:   doc.mrName || displayName,
          status:       'Inactive',
          doctorCount:  0,
          chemistCount: 0,
          coverage:     0,
          totalTarget:  0,
          latitude:     coords.lat,
          longitude:    coords.lng,
          lastDoctorVisit: '-',
          lastChemistVisit: '-',
          lastActivityTime: '-'
        };
      }

      territoryMap[loc].doctorCount += 1;
      if (isToday(doc.visitDate || '')) {
        territoryMap[loc].status = 'Active';
      }

      // Track last visit details
      const docDate = doc.visitDate || '';
      if (territoryMap[loc].lastDoctorVisit === '-' || docDate > (territoryMap[loc].lastDoctorVisit?.split(' on ')[1] || '')) {
        territoryMap[loc].lastDoctorVisit = `${doc.doctorName} on ${docDate}`;
      }
    });

    chemistsToProcess.forEach((chem: any) => {
      const loc = getVisitLocation(chem);
      if (loc === 'Unknown') return;

      if (!territoryMap[loc]) {
        const region = getRegionFromAttendance(loc);
        const coords = getCoordinates(loc);
        territoryMap[loc] = {
          id:           `TER-${String(Object.keys(territoryMap).length + 1).padStart(3, '0')}`,
          name:         `${loc} Region`,
          area:         loc,
          district:     region.district,
          state:        region.state,
          assignedMr:   chem.mrName || displayName,
          status:       'Inactive',
          doctorCount:  0,
          chemistCount: 0,
          coverage:     0,
          totalTarget:  0,
          latitude:     coords.lat,
          longitude:    coords.lng,
          lastDoctorVisit: '-',
          lastChemistVisit: '-',
          lastActivityTime: '-'
        };
      }

      territoryMap[loc].chemistCount += 1;
      if (isToday(chem.visitDate || '')) {
        territoryMap[loc].status = 'Active';
      }

      // Track last visit details
      const chemDate = chem.visitDate || '';
      if (territoryMap[loc].lastChemistVisit === '-' || chemDate > (territoryMap[loc].lastChemistVisit?.split(' on ')[1] || '')) {
        territoryMap[loc].lastChemistVisit = `${chem.shopName || chem.chemistName || 'Chemist'} on ${chemDate}`;
      }
    });

    Object.keys(territoryMap).forEach(loc => {
      const t           = territoryMap[loc];
      const allDocsForLoc  = storedDocs.filter((d: any)    => getVisitLocation(d) === loc).length;
      const allChemsForLoc = storedChemists.filter((c: any) => getVisitLocation(c) === loc).length;
      const totalTarget = allDocsForLoc + allChemsForLoc;
      const totalVisits = t.doctorCount + t.chemistCount;

      t.totalTarget = totalTarget;
      t.coverage    = totalTarget > 0 ? Math.min(Math.round((totalVisits / totalTarget) * 100), 100) : 0;

      // Extract overall last activity timestamp
      const docT = t.lastDoctorVisit !== '-' ? (t.lastDoctorVisit?.split(' on ')[1] || '') : '';
      const chemT = t.lastChemistVisit !== '-' ? (t.lastChemistVisit?.split(' on ')[1] || '') : '';
      t.lastActivityTime = docT > chemT ? docT : chemT || '-';
    });

    setTerritories(Object.values(territoryMap));
  }, [displayName, isMr, refreshKey]);

  // ✅ Live Map Rendering Integration using CDN-loaded Leaflet
  useEffect(() => {
    if (!selectedTerritory) return;

    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const container = document.getElementById('leaflet-live-map');
      if (!container) return;

      // Reset previous map reference to avoid re-initialization errors
      const mapContainer = container as HTMLElement & { _leaflet_id?: any };
      if (mapContainer._leaflet_id) {
        mapContainer.innerHTML = '';
        mapContainer._leaflet_id = null;
      }

      const lat = selectedTerritory.latitude;
      const lng = selectedTerritory.longitude;

      const map = L.map('leaflet-live-map').setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Draw Territory boundary (Circle representing 1.5km coverage)
      L.circle([lat, lng], {
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.15,
        radius: 1500
      }).addTo(map);

      // Add Headquarters Marker
      L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>HQ: ${selectedTerritory.name}</b><br/>Assigned MR: ${selectedTerritory.assignedMr}`)
        .openPopup();

      // Add Doctor markers
      for (let i = 0; i < selectedTerritory.doctorCount; i++) {
        const offsetLat = lat + (Math.random() - 0.5) * 0.015;
        const offsetLng = lng + (Math.random() - 0.5) * 0.015;
        L.circleMarker([offsetLat, offsetLng], { color: '#a855f7', fillColor: '#c084fc', fillOpacity: 0.8, radius: 8 })
          .addTo(map)
          .bindPopup(`🩺 <b>KOL Doctor Clinic</b><br/>Status: Visited<br/>Coords: ${offsetLat.toFixed(5)}, ${offsetLng.toFixed(5)}`);
      }

      // Add Chemist markers
      for (let i = 0; i < selectedTerritory.chemistCount; i++) {
        const offsetLat = lat + (Math.random() - 0.5) * 0.015;
        const offsetLng = lng + (Math.random() - 0.5) * 0.015;
        L.circleMarker([offsetLat, offsetLng], { color: '#10b981', fillColor: '#34d399', fillOpacity: 0.8, radius: 8 })
          .addTo(map)
          .bindPopup(`💊 <b>Chemist Pharmacy</b><br/>Status: Visited<br/>Coords: ${offsetLat.toFixed(5)}, ${offsetLng.toFixed(5)}`);
      }
    };

    if ((window as any).L) {
      initMap();
    } else {
      let script = document.getElementById('leaflet-js-cdn') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'leaflet-js-cdn';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', initMap);
      }
    }
  }, [selectedTerritoryId, territories]);

  // ✅ Consolidated CSV Export Function
  const handleExport = () => {
    if (territories.length === 0) return alert("No territory data available to export!");
    const headers = ['Territory ID', 'Name', 'District', 'State', 'Assigned MR', 'Doctor Count', 'Chemist Count', 'Coverage %', 'Status', 'Latitude', 'Longitude', 'Last Activity Time'];
    const rows = filtered.map(t => [
      t.id, `"${t.name}"`, `"${t.district}"`, `"${t.state}"`, `"${t.assignedMr}"`, t.doctorCount, t.chemistCount, `${t.coverage}%`, t.status, t.latitude.toFixed(6), t.longitude.toFixed(6), `"${t.lastActivityTime}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Territory_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logActivity('Territory Report Exported', 'Exported consolidated territory report to CSV');
  };

  const filtered = territories.filter(t => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase())       ||
      t.assignedMr.toLowerCase().includes(search.toLowerCase()) ||
      t.area.toLowerCase().includes(search.toLowerCase())        ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const activeCount   = filtered.filter(t => t.status === 'Active').length;
  const inactiveCount = filtered.filter(t => t.status === 'Inactive').length;
  const assignedMRs   = new Set(
    filtered.filter(t => t.assignedMr && t.assignedMr !== 'Unassigned').map(t => t.assignedMr)
  ).size;
  const avgCoverage = filtered.length > 0
    ? Math.round(filtered.reduce((s, t) => s + t.coverage, 0) / filtered.length)
    : 0;

  const selectedTerritory = territories.find(t => t.id === selectedTerritoryId);

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Territory Tracking"
        subtitle={
          isMr
            ? 'View and manage your assigned spatial regions.'
            : 'Visualize assigned patches, HQ boundaries, and coverage gaps.'
        }
        actions={
          <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Analytics</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Active Territories"
          value={activeCount.toString()}
          subtitle="Visited today"
          icon={<ShieldCheck className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Inactive Territories"
          value={inactiveCount.toString()}
          subtitle="No visit today"
          icon={<ShieldAlert className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Assigned MRs"
          value={assignedMRs.toString()}
          subtitle="Active field force"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Avg. Coverage"
          value={`${avgCoverage}%`}
          subtitle="Overall territory reach"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search territory, code, area, or MR…" />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active',   value: 'Active'   },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="Status"
        />
        <button
          onClick={() => {
            setRefreshKey(prev => prev + 1);
            logActivity('Territory Refresh', 'Refreshed territory list and coverage indicators');
          }}
          title="Refresh Data"
          className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center justify-center ml-2"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </FilterBar>

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex mt-2 min-h-[600px]">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />

        {/* Left Sidebar */}
        <div className="w-80 bg-white/95 backdrop-blur-md border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 flex flex-col h-full absolute left-0 top-0">
          <div className="p-5 border-b border-slate-100 bg-white">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-600" />
              Territories
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-auto">
                {filtered.length}
              </span>
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTerritoryId(t.id);
                  logActivity('Territory Viewed', `Viewed coverage boundary for ${t.name}`);
                }}
                className={`rounded-xl p-4 border transition-all cursor-pointer group ${
                  selectedTerritoryId === t.id
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                    : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">{t.id}</div>
                    <h5 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {t.name}
                    </h5>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    t.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{t.area},<br />{t.district}, {t.state}</span>
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                    <div className="flex gap-3">
                      <div className="text-[10px] text-slate-500 font-medium">
                        Docs: <span className="text-slate-700">{t.doctorCount}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Chems: <span className="text-slate-700">{t.chemistCount}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-indigo-600 font-bold">{t.coverage}% Cov</div>
                  </div>

                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200/60">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className={t.assignedMr === 'Unassigned' ? 'text-slate-400 italic' : 'text-slate-700'}>
                      {t.assignedMr}
                    </span>
                  </p>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-10 px-4">
                <Map className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  {search
                    ? 'No territories match your search.'
                    : isMr
                      ? 'No territories found. Log a doctor or chemist visit first!'
                      : 'No territories assigned yet. Visit data will appear here automatically.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 ml-80 p-8 overflow-y-auto">
          {selectedTerritory ? (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-6 w-full max-w-2xl text-left space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono text-slate-400">{selectedTerritory.id}</span>
                  <h3 className="text-xl font-bold text-slate-800">{selectedTerritory.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedTerritory.area}, {selectedTerritory.district}, {selectedTerritory.state}
                  </p>
                </div>
                <Badge variant={selectedTerritory.status === 'Active' ? 'success' : 'neutral'}>
                  {selectedTerritory.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">MR Assigned</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{selectedTerritory.assignedMr}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Coverage</p>
                  <p className="text-sm font-bold text-indigo-600 mt-1">{selectedTerritory.coverage}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Visits</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">
                    {selectedTerritory.doctorCount + selectedTerritory.chemistCount}
                  </p>
                </div>
              </div>

              {/* ✅ Live Map Container */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Live Map Boundary</h4>
                <div id="leaflet-live-map" className="w-full h-80 rounded-xl border border-slate-200 shadow-inner z-10" />
              </div>

              {/* ✅ Last Visit & GPS coordinates details */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Field Engagement History</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Calendar className="w-3 h-3 text-[#163c78]/90" /> Last Doctor Visit</p>
                    <p className="text-sm text-slate-700 font-medium mt-1">{selectedTerritory.lastDoctorVisit}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Calendar className="w-3 h-3 text-emerald-500" /> Last Chemist Visit</p>
                    <p className="text-sm text-slate-700 font-medium mt-1">{selectedTerritory.lastChemistVisit}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-500" /> Last Activity Timestamp</p>
                    <p className="text-sm text-slate-700 font-medium mt-1">{selectedTerritory.lastActivityTime}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-500" /> HQ Coordinates</p>
                    <p className="text-sm text-slate-700 font-medium mt-1">
                      {selectedTerritory.latitude.toFixed(5)}, {selectedTerritory.longitude.toFixed(5)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm max-w-sm">
              <Map className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800">Territory Map Boundary</h3>
              <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                Select a territory from the left-hand list to view its route summary, coverage stats, and spatial boundaries.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}