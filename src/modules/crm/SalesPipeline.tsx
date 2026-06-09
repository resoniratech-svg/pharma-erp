import { TrendingUp, Download, PieChart } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
  SummaryCard,
} from './components/shared';

export default function SalesPipeline() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Sales Activity Monitoring"
        subtitle="Visual overview of institutional and B2B deals in progress."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Pipeline Data</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Lead Generation"
          value="45"
          subtitle="New institutional leads"
          icon={<PieChart className="w-6 h-6" />}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
        />
        <SummaryCard
          title="In Negotiation"
          value="12"
          subtitle="Proposals sent"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Won / Closed"
          value="8"
          subtitle="This quarter"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pipeline Value"
          value="₹ 4.2 Cr"
          subtitle="Weighted probability"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
         <p className="text-slate-500 font-medium mb-6">Pipeline Funnel Visualization (Mock)</p>
         
         <div className="w-full max-w-xl space-y-4">
             <div className="w-full h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between px-6">
                <span className="font-semibold text-slate-700">1. Prospecting / Leads</span>
                <span className="text-slate-500 font-mono">45 Deals</span>
             </div>
             <div className="w-11/12 h-12 bg-indigo-50 rounded-lg border border-indigo-100 mx-auto flex items-center justify-between px-6">
                <span className="font-semibold text-indigo-700">2. Qualification</span>
                <span className="text-indigo-600 font-mono">32 Deals</span>
             </div>
             <div className="w-4/5 h-12 bg-amber-50 rounded-lg border border-amber-100 mx-auto flex items-center justify-between px-6">
                <span className="font-semibold text-amber-700">3. Proposal / Negotiation</span>
                <span className="text-amber-600 font-mono">12 Deals</span>
             </div>
             <div className="w-3/5 h-12 bg-emerald-50 rounded-lg border border-emerald-100 mx-auto flex items-center justify-between px-6">
                <span className="font-semibold text-emerald-700">4. Closed Won</span>
                <span className="text-emerald-600 font-mono">8 Deals</span>
             </div>
         </div>
      </div>
    </div>
  );
}
