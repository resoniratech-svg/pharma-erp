// import { PageHeader } from './components/shared';
// import { Map } from 'lucide-react';

// export default function TerritoryTracking() {
//   return (
//     <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
//       <PageHeader
//         title="Territory Tracking"
//         subtitle="Visualize assigned patches, HQ boundaries, and coverage gaps."
//       />

//       <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
//          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
//          <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
//              <Map className="w-12 h-12 text-slate-400 mx-auto mb-3" />
//              <h3 className="text-lg font-semibold text-slate-800">Territory Map Placeholder</h3>
//              <p className="text-sm text-slate-500 max-w-sm mt-1">Geofencing and territory polygons will be rendered here for spatial analysis.</p>
//          </div>
//       </div>
//     </div>
//   );
// }



//////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { SearchInput, PageHeader, FilterBar, SelectFilter, SummaryCard } from './components/shared';
import { Map, Users, MapPin, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Territory {
    id: string; 
    name: string;
    state: string;
    district: string;
    area: string;
    assignedMr: string;
    status: 'Active' | 'Inactive';
    doctorCount?: number;
    chemistCount?: number;
    coverage?: number;
}

export default function TerritoryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [territories, setTerritories] = useState<Territory[]>([]);

  useEffect(() => {
     // ✅ SMART CACHE BREAKER: Wipes your old stubborn dummy data exactly ONCE.
     const isWiped = localStorage.getItem('territories_wiped_v2');
     if (!isWiped) {
         localStorage.removeItem('territories');
         localStorage.setItem('territories_wiped_v2', 'true');
     }

     // ✅ ChatGPT's exact recommended dynamic loading logic!
     const stored = localStorage.getItem('territories');
     setTerritories(stored ? JSON.parse(stored) : []);
  }, []);

  const filtered = territories.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.assignedMr.toLowerCase().includes(search.toLowerCase()) ||
                          t.area.toLowerCase().includes(search.toLowerCase()) ||
                          t.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? t.status === statusFilter : true;
      return matchSearch && matchStatus;
  });

  const activeCount = territories.filter(t => t.status === 'Active').length;
  const inactiveCount = territories.filter(t => t.status === 'Inactive').length;
  const assignedMRs = new Set(territories.filter(t => t.status === 'Active' && t.assignedMr && t.assignedMr !== 'Unassigned').map(t => t.assignedMr)).size;
  const totalCoverage = territories.reduce((sum, t) => sum + (t.coverage || 0), 0);
  const avgCoverage = territories.length > 0 ? Math.round(totalCoverage / territories.length) : 0;

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Territory Tracking"
        subtitle="Visualize assigned patches, HQ boundaries, and coverage gaps."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Active Territories"
          value={activeCount.toString()}
          subtitle="Currently operational"
          icon={<ShieldCheck className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Inactive Territories"
          value={inactiveCount.toString()}
          subtitle="Pending assignment"
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search territory, code, area, or MR..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex mt-2 min-h-[600px]">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         
         <div className="w-80 bg-white/95 backdrop-blur-md border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 flex flex-col h-full absolute left-0 top-0">
             <div className="p-5 border-b border-slate-100 bg-white">
                 <h4 className="font-bold text-slate-800 flex items-center gap-2">
                     <Map className="w-5 h-5 text-indigo-600" /> 
                     Territories 
                     <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-auto">{filtered.length}</span>
                 </h4>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {filtered.map(t => (
                     <div key={t.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                         <div className="flex justify-between items-start mb-3">
                             <div>
                                <div className="text-[10px] font-bold text-slate-400 mb-1">{t.id}</div>
                                <h5 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{t.name}</h5>
                             </div>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                 {t.status}
                             </span>
                         </div>
                         <div className="space-y-2">
                             <p className="text-xs font-medium text-slate-500 flex items-start gap-1.5">
                                 <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /> 
                                 <span>{t.area}, <br/>{t.district}, {t.state}</span>
                             </p>
                             
                             <div className="flex items-center justify-between py-1 border-t border-slate-200/60 mt-2 pt-2">
                                <div className="flex gap-3">
                                    <div className="text-[10px] text-slate-500 font-medium">Docs: <span className="text-slate-700">{t.doctorCount || 0}</span></div>
                                    <div className="text-[10px] text-slate-500 font-medium">Chems: <span className="text-slate-700">{t.chemistCount || 0}</span></div>
                                </div>
                                <div className="text-[10px] text-indigo-600 font-bold ml-auto">{t.coverage || 0}% Cov</div>
                             </div>

                             <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200/60">
                                 <Users className="w-3.5 h-3.5 text-slate-400" /> 
                                 <span className={t.assignedMr === 'Unassigned' ? 'text-slate-400 italic' : 'text-slate-700'}>{t.assignedMr}</span>
                             </p>
                         </div>
                     </div>
                 ))}
                 {filtered.length === 0 && (
                     <div className="text-center py-10 px-4">
                         <Map className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                         <p className="text-sm font-medium text-slate-500 leading-relaxed">
                             {search ? 'No territories match your search.' : 'No territories assigned yet. Waiting for Admin setup.'}
                         </p>
                     </div>
                 )}
             </div>
         </div>

         <div className="flex-1 flex items-center justify-center relative z-10 ml-80">
             <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm max-w-sm">
                 <Map className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-slate-800">Territory Map Placeholder</h3>
                 <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                    Geofencing and territory polygons will be rendered here for spatial analysis when you select a territory from the list.
                 </p>
             </div>
         </div>
      </div>
    </div>
  );
}