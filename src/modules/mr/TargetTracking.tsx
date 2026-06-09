import { Download, Target } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
  SummaryCard,
} from './components/shared';

export default function TargetTracking() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Target Tracking"
        subtitle="Monitor monthly sales quotas and performance metrics."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Download Report</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Monthly Target"
          value="₹ 15,00,000"
          subtitle="Oct 2026 Quota"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Achieved"
          value="₹ 8,45,000"
          subtitle="56% Completion"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending"
          value="₹ 6,55,000"
          subtitle="Required run-rate: ₹40k/day"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
         <p className="text-slate-500 font-medium">Performance vs Target Chart (Mock)</p>
         <div className="w-full max-w-2xl h-64 bg-slate-50 rounded-lg mt-6 border border-slate-100 flex items-center justify-center">
            <span className="text-slate-400 text-sm">Chart Placeholder</span>
         </div>
      </div>
    </div>
  );
}
