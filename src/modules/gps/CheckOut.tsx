import { MapPin, Flag } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
} from './components/shared';

export default function CheckOut() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Day End / Check-Out"
        subtitle="Record your ending location and timestamp for the day."
      />

      <div className="max-w-xl mx-auto mt-8">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flag className="w-10 h-10 text-rose-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to end your day?</h2>
            <p className="text-slate-500 mb-8">Ensure your DCR is submitted before checking out. Your current location will be recorded as your ending point.</p>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-8 flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Calls Logged:</span>
                    <span className="font-semibold text-slate-900">12</span>
                </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">POB Collected:</span>
                    <span className="font-semibold text-slate-900">₹ 24,500</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location:</span>
                    <span className="font-semibold text-slate-700">Andheri East</span>
                </div>
            </div>

            <ActionButton className="w-full justify-center py-4 text-lg rounded-xl bg-rose-600 hover:bg-rose-700 shadow-rose-200">
                Confirm Check-Out
            </ActionButton>
        </div>
      </div>
    </div>
  );
}
