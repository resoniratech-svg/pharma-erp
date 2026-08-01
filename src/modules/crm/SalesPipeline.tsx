// import { TrendingUp, Download, PieChart } from 'lucide-react';
// import {
//   PageHeader,
//   ActionButton,
//   SummaryCard,
// } from './components/shared';

// export default function SalesPipeline() {
//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Sales Activity Monitoring"
//         subtitle="Visual overview of institutional and B2B deals in progress."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Pipeline Data</ActionButton>
//         }
//       />

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Lead Generation"
//           value="45"
//           subtitle="New institutional leads"
//           icon={<PieChart className="w-6 h-6" />}
//           colorClass="text-slate-600"
//           bgClass="bg-slate-100"
//         />
//         <SummaryCard
//           title="In Negotiation"
//           value="12"
//           subtitle="Proposals sent"
//           icon={<TrendingUp className="w-6 h-6" />}
//           colorClass="text-amber-600"
//           bgClass="bg-amber-50"
//         />
//         <SummaryCard
//           title="Won / Closed"
//           value="8"
//           subtitle="This quarter"
//           icon={<TrendingUp className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Pipeline Value"
//           value="₹ 4.2 Cr"
//           subtitle="Weighted probability"
//           icon={<TrendingUp className="w-6 h-6" />}
//           colorClass="text-[#163c78]"
//           bgClass="bg-[#163c78]/10"
//         />
//       </div>

//       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
//          <p className="text-slate-500 font-medium mb-6">Pipeline Funnel Visualization (Mock)</p>
         
//          <div className="w-full max-w-xl space-y-4">
//              <div className="w-full h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between px-6">
//                 <span className="font-semibold text-slate-700">1. Prospecting / Leads</span>
//                 <span className="text-slate-500 font-mono">45 Deals</span>
//              </div>
//              <div className="w-11/12 h-12 bg-indigo-50 rounded-lg border border-indigo-100 mx-auto flex items-center justify-between px-6">
//                 <span className="font-semibold text-indigo-700">2. Qualification</span>
//                 <span className="text-indigo-600 font-mono">32 Deals</span>
//              </div>
//              <div className="w-4/5 h-12 bg-amber-50 rounded-lg border border-amber-100 mx-auto flex items-center justify-between px-6">
//                 <span className="font-semibold text-amber-700">3. Proposal / Negotiation</span>
//                 <span className="text-amber-600 font-mono">12 Deals</span>
//              </div>
//              <div className="w-3/5 h-12 bg-emerald-50 rounded-lg border border-emerald-100 mx-auto flex items-center justify-between px-6">
//                 <span className="font-semibold text-emerald-700">4. Closed Won</span>
//                 <span className="text-emerald-600 font-mono">8 Deals</span>
//              </div>
//          </div>
//       </div>
//     </div>
//   );
// }



////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { TrendingUp, Download, PieChart, Target, CheckCircle2 } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
  SummaryCard,
} from './components/shared';
import { leadService } from '../../services/leadService';

export default function SalesPipeline() {
  const [metrics, setMetrics] = useState({
    leads: 0,
    qualification: 0,
    negotiation: 0,
    won: 0,
    pipelineValue: 0
  });

  // ✅ Added 10-Second Auto Refresh for Real-Time Dashboard Updates
  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const storedLeads = await leadService.getAll();

      let leadsCount = 0;
      let qualificationCount = 0;
      let negotiationCount = 0;
      let wonCount = 0;
      let totalWeightedValue = 0;

      // Safe number parser
      const getRawValue = (val: any) => {
        if (!val) return 0;
        const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : val;
        return isNaN(num) ? 0 : num;
      };

      storedLeads.forEach((l: any) => {
        const s = l.status || 'New';
        const val = getRawValue(l.revenue || l.dealValue || 0);

        if (s === 'New' || s === 'Assigned' || s === 'Contacted' || s === 'NEW' || s === 'CONTACTED') {
          leadsCount++;
          totalWeightedValue += (val * 0.2); // 20% Probability
        } else if (s === 'Qualified' || s === 'QUALIFIED') {
          qualificationCount++;
          totalWeightedValue += (val * 0.6); // 60% Probability
        } else if (s === 'Proposal Sent' || s === 'ASSIGNED') { // Mapping ASSIGNED to Negotiation here for metrics
          negotiationCount++;
          totalWeightedValue += (val * 0.8); // 80% Probability
        } else if (s === 'Converted' || s === 'CONVERTED') {
          wonCount++;
          totalWeightedValue += val; // 100% Probability (Already Won)
        }
      });

      setMetrics({
        leads: leadsCount,
        qualification: qualificationCount,
        negotiation: negotiationCount,
        won: wonCount,
        pipelineValue: totalWeightedValue
      });
    } catch (e) {
      console.error('Failed to load pipeline data', e);
    }
  };

  // Smart Currency Formatter for Indian Rupees (Cr, L)
  const formatCurrencyLarge = (val: number) => {
    if (val === 0) return '₹ 0';
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExport = () => {
    const csvContent = `Stage,Deals Count\nProspecting/Leads,${metrics.leads}\nQualification,${metrics.qualification}\nProposal/Negotiation,${metrics.negotiation}\nClosed Won,${metrics.won}\n\nTotal Weighted Value,${formatCurrencyLarge(metrics.pipelineValue)}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Pipeline_Snapshot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasData = metrics.leads > 0 || metrics.qualification > 0 || metrics.negotiation > 0 || metrics.won > 0;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Sales Activity Monitoring"
        subtitle="Visual overview of institutional and B2B deals in progress."
        actions={
          <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Pipeline Data</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Leads"
          value={(metrics.leads + metrics.qualification + metrics.negotiation + metrics.won).toString()}
          subtitle="Total in pipeline"
          icon={<PieChart className="w-6 h-6" />}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
        />
        <SummaryCard
          title="Qualified / Negotiating"
          value={(metrics.qualification + metrics.negotiation).toString()}
          subtitle="Active deals in progress"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Closed Won"
          value={metrics.won.toString()}
          subtitle="Converted deals"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pipeline Value"
          value={formatCurrencyLarge(metrics.pipelineValue)}
          subtitle="Weighted probability"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-[#163c78]/10"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
         <p className="text-slate-500 font-medium mb-6">Pipeline Stages Overview</p>
         
         {/* ✅ Added Professional Empty State */}
         {!hasData ? (
           <div className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-slate-50/50">
             <p className="font-semibold text-slate-700">No pipeline data available.</p>
             <p className="text-sm mt-1 text-slate-500">Create and assign leads to start tracking sales performance.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Stage 1 */}
             <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
               <h4 className="text-slate-500 text-sm font-medium mb-1">1. Prospecting / Leads</h4>
               <p className="text-2xl font-bold text-slate-800">{metrics.leads} <span className="text-sm font-normal text-slate-500">Deals</span></p>
             </div>
             
             {/* Stage 2 */}
             <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-colors">
               <h4 className="text-indigo-600 text-sm font-medium mb-1">2. Qualification</h4>
               <p className="text-2xl font-bold text-indigo-900">{metrics.qualification} <span className="text-sm font-normal text-indigo-600/70">Deals</span></p>
             </div>
             
             {/* Stage 3 */}
             <div className="p-4 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors">
               <h4 className="text-amber-600 text-sm font-medium mb-1">3. Proposal / Negotiation</h4>
               <p className="text-2xl font-bold text-amber-900">{metrics.negotiation} <span className="text-sm font-normal text-amber-600/70">Deals</span></p>
             </div>
             
             {/* Stage 4 */}
             <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors">
               <h4 className="text-emerald-600 text-sm font-medium mb-1">4. Closed Won</h4>
               <p className="text-2xl font-bold text-emerald-900">{metrics.won} <span className="text-sm font-normal text-emerald-600/70">Deals</span></p>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}