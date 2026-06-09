import { useState } from 'react';
import { SearchInput, PageHeader, FilterBar, ActionButton, SelectFilter } from './components/shared';
import { Route } from 'lucide-react';

export default function RouteHistory() {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

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
        <ActionButton icon={<Route className="w-4 h-4" />}>Load Route</ActionButton>
      </FilterBar>

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
             <Route className="w-12 h-12 text-slate-400 mx-auto mb-3" />
             <h3 className="text-lg font-semibold text-slate-800">Map Interface Placeholder</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-1">Select a representative and date to view their route history polyline on the map.</p>
         </div>
      </div>
    </div>
  );
}
