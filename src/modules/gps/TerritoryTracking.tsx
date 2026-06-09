import { PageHeader } from './components/shared';
import { Map } from 'lucide-react';

export default function TerritoryTracking() {
  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Territory Tracking"
        subtitle="Visualize assigned patches, HQ boundaries, and coverage gaps."
      />

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         <div className="text-center z-10 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-sm">
             <Map className="w-12 h-12 text-slate-400 mx-auto mb-3" />
             <h3 className="text-lg font-semibold text-slate-800">Territory Map Placeholder</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-1">Geofencing and territory polygons will be rendered here for spatial analysis.</p>
         </div>
      </div>
    </div>
  );
}
