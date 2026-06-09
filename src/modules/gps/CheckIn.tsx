import { MapPin, Navigation } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
} from './components/shared';

export default function CheckIn() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Day Start / Check-In"
        subtitle="Record your starting location and timestamp for the day."
      />

      <div className="max-w-xl mx-auto mt-8">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Navigation className="w-10 h-10 text-emerald-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to start your day?</h2>
            <p className="text-slate-500 mb-8">Ensure your device GPS is enabled. Your current location will be recorded as your starting point.</p>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center justify-center gap-3 text-slate-700">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span className="font-medium">Fetching accurate location...</span>
            </div>

            <ActionButton className="w-full justify-center py-4 text-lg rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                Confirm Check-In
            </ActionButton>
        </div>
      </div>
    </div>
  );
}
