import { useState } from 'react';
import { SearchInput, PageHeader, FilterBar } from './components/shared';
import { Crosshair } from 'lucide-react';

export default function LocationTracking() {
  const [search, setSearch] = useState('');

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Daily Movement Tracking"
        subtitle="Real-time GPS tracking of active field representatives."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search active rep..." />
      </FilterBar>

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         
         <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-slate-100 w-64">
            <h4 className="font-semibold text-sm mb-3">Active Reps (2)</h4>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-sm font-medium">Rahul Verma</div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-sm font-medium">Amit Singh</div>
                </div>
            </div>
         </div>

         <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
             <Crosshair className="w-12 h-12 text-slate-400 mx-auto mb-3" />
             <h3 className="text-lg font-semibold text-slate-800">Live Map Placeholder</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-1">Real-time marker locations based on web sockets / GPS polling.</p>
         </div>
      </div>
    </div>
  );
}
