import { useState, useEffect } from 'react';
import { Download, Target } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
  SummaryCard,
} from './components/shared';
import { ExportService } from '../../services/exportService';


export default function TargetTracking() {
  const [salesAchieved, setSalesAchieved] = useState(0);
  const [docsVisited, setDocsVisited] = useState(0);
  const [chemistsVisited, setChemistsVisited] = useState(0);
    const [isExportOpen, setIsExportOpen] = useState(false);


  // Hardcoded monthly targets based on RN app specifications
  const SALES_TARGET = 50000;
  const DOCS_TARGET = 30;
  const CHEMISTS_TARGET = 20;

  useEffect(() => {
    loadCurrentMonthPerformance();
  }, []);

  const loadCurrentMonthPerformance = () => {
    try {
      const today = new Date();
      const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
      const currentYearStr = String(today.getFullYear());
      
      const isCurrentMonth = (dateStr: string) => {
        if (!dateStr) return false;
        const shortMonthYear = today.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // e.g. Jun 2026
        

        return dateStr.includes(`${currentYearStr}-${currentMonthStr}`) || 
               dateStr.includes(shortMonthYear) ||
               (dateStr.includes(today.toLocaleString('en-US', { month: 'short' })) && dateStr.includes(currentYearStr));
      };

      // 1. Calculate Doctor Visits (Current Month)
      const docData = JSON.parse(localStorage.getItem('web_doctor_visits') || '[]');
      const currentDocVisits = docData.filter((v: any) => isCurrentMonth(v.visitDate || v.date));
      setDocsVisited(currentDocVisits.length);

      // 2. Calculate Chemist Visits (Current Month)
      const chemistData = JSON.parse(localStorage.getItem('web_chemist_visits') || '[]');
      const currentChemistVisits = chemistData.filter((v: any) => isCurrentMonth(v.visitDate || v.date));
      setChemistsVisited(currentChemistVisits.length);

      // 3. Calculate Sales Total (Current Month)
      const ordersData = JSON.parse(localStorage.getItem('@orders') || localStorage.getItem('web_orders') || '[]');
      const currentOrders = ordersData.filter((o: any) => isCurrentMonth(o.dateFormatted || o.date));
      
      const ordersTotal = currentOrders.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.totalAmount) || 0);
      }, 0);

      setSalesAchieved(ordersTotal);
    } catch (e) {
      console.log('Failed to load targets:', e);
    }
  };

  const getPercentage = (achieved: number, target: number) => {
    return Math.min(Math.round((achieved / target) * 100), 100);
  };

  const salesPercent = getPercentage(salesAchieved, SALES_TARGET);
  const docsPercent = getPercentage(docsVisited, DOCS_TARGET);
  const chemistsPercent = getPercentage(chemistsVisited, CHEMISTS_TARGET);

  const isEligibleForIncentive = salesPercent >= 100 && docsPercent >= 100 && chemistsPercent >= 100;
  const estimatedIncentive = isEligibleForIncentive ? Math.round(salesAchieved * 0.05) : 0;

 // const monthName = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
  const monthName = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });

  // --- START OF EXPORT LOGIC ---
  const exportData = [{
    month: monthName,
    salesTarget: SALES_TARGET,
    salesAchieved: salesAchieved,
    salesPercent: `${salesPercent}%`,
    docTarget: DOCS_TARGET,
    docAchieved: docsVisited,
    docPercent: `${docsPercent}%`,
    chemistTarget: CHEMISTS_TARGET,
    chemistAchieved: chemistsVisited,
    chemistPercent: `${chemistsPercent}%`,
    incentiveEligible: isEligibleForIncentive ? 'Yes' : 'No',
    estimatedIncentive: estimatedIncentive
  }];

  // const exportColumns = [
  //   { header: 'Month', dataKey: 'month' },
  //   { header: 'Sales Target (₹)', dataKey: 'salesTarget' },
  //   { header: 'Sales Achieved (₹)', dataKey: 'salesAchieved' },
  //   { header: 'Sales %', dataKey: 'salesPercent' },
  //   { header: 'Doc Target', dataKey: 'docTarget' },
  //   { header: 'Doc Achieved', dataKey: 'docAchieved' },
  //   { header: 'Doc %', dataKey: 'docPercent' },
  //   { header: 'Chemist Target', dataKey: 'chemistTarget' },
  //   { header: 'Chemist Achieved', dataKey: 'chemistAchieved' },
  //   { header: 'Chemist %', dataKey: 'chemistPercent' },
  //   { header: 'Incentive Eligible', dataKey: 'incentiveEligible' },
  //   { header: 'Est. Incentive (₹)', dataKey: 'estimatedIncentive' }
  // ];
  const exportColumns = [
    { header: 'Month', dataKey: 'month' },
    { header: 'Sales Target (Rs.)', dataKey: 'salesTarget' },
    { header: 'Sales Achieved (Rs.)', dataKey: 'salesAchieved' },
    { header: 'Sales %', dataKey: 'salesPercent' },
    { header: 'Doc Target', dataKey: 'docTarget' },
    { header: 'Doc Achieved', dataKey: 'docAchieved' },
    { header: 'Doc %', dataKey: 'docPercent' },
    { header: 'Chemist Target', dataKey: 'chemistTarget' },
    { header: 'Chemist Achieved', dataKey: 'chemistAchieved' },
    { header: 'Chemist %', dataKey: 'chemistPercent' },
    { header: 'Incentive Eligible', dataKey: 'incentiveEligible' },
    { header: 'Est. Incentive (Rs.)', dataKey: 'estimatedIncentive' }
  ];
  const handleExportPDF = () => {
    ExportService.exportToPDF({
      title: `Monthly Target Tracking Report - ${monthName}`,
      filename: `Target_Tracking_${monthName.replace(' ', '_')}`,
      data: exportData,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    ExportService.exportToExcel({
      title: `Monthly Target Tracking Report - ${monthName}`,
      filename: `Target_Tracking_${monthName.replace(' ', '_')}`,
      data: exportData,
      columns: exportColumns
    });
  };
  // --- END OF EXPORT LOGIC ---
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Target Tracking"
        subtitle="Monitor monthly sales quotas and performance metrics."
        // actions={
        //   <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Download Report</ActionButton>
        // }
                actions={
          <div className="relative">
            <ActionButton 
              variant="secondary" 
              onClick={() => setIsExportOpen(!isExportOpen)} 
              icon={<Download className="w-4 h-4" />}
            >
              Export Report
            </ActionButton>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                <button 
                  onClick={() => { handleExportExcel(); setIsExportOpen(false); }} 
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                  Excel (.xlsx)
                </button>
                <button 
                  onClick={() => { handleExportPDF(); setIsExportOpen(false); }} 
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  PDF Document
                </button>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Sales Achieved"
          value={`₹ ${salesAchieved.toLocaleString()}`}
          subtitle={`${salesPercent}% of ₹${SALES_TARGET.toLocaleString()} Target`}
          icon={<Target className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Doctor Meets"
          value={`${docsVisited}`}
          subtitle={`${docsPercent}% of ${DOCS_TARGET} Visits`}
          icon={<Target className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Chemist Meets"
          value={`${chemistsVisited}`}
          subtitle={`${chemistsPercent}% of ${CHEMISTS_TARGET} Visits`}
          icon={<Target className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Active Monthly Targets ({monthName})</h3>
        
        <div className="space-y-6">
          {/* Sales Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">💰 Monthly Sales Target</span>
              <span className="text-sm font-bold text-blue-600">{salesPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${salesPercent}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-500">₹{salesAchieved.toLocaleString()} / ₹{SALES_TARGET.toLocaleString()}</span>
              <span className="text-xs font-medium text-slate-500">Remaining: ₹{Math.max(0, SALES_TARGET - salesAchieved).toLocaleString()}</span>
            </div>
          </div>

          {/* Doctor Meets Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">🩺 Doctor Meets Target</span>
              <span className="text-sm font-bold text-emerald-600">{docsPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${docsPercent}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-500">{docsVisited} / {DOCS_TARGET} Visits</span>
              <span className="text-xs font-medium text-slate-500">Remaining: {Math.max(0, DOCS_TARGET - docsVisited)}</span>
            </div>
          </div>

          {/* Chemist Meets Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">💊 Chemist Meets Target</span>
              <span className="text-sm font-bold text-amber-600">{chemistsPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${chemistsPercent}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-500">{chemistsVisited} / {CHEMISTS_TARGET} Visits</span>
              <span className="text-xs font-medium text-slate-500">Remaining: {Math.max(0, CHEMISTS_TARGET - chemistsVisited)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Incentive Eligibility Box */}
      <div className={`p-6 rounded-2xl border ${isEligibleForIncentive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          {isEligibleForIncentive ? '🎉 Congratulations!' : '⏳ Incentive Estimator'}
        </h3>
        <p className={`text-sm mb-4 ${isEligibleForIncentive ? 'text-emerald-700' : 'text-slate-600'}`}>
          {isEligibleForIncentive 
            ? 'You have fully met all monthly meet & sales targets. You qualify for a 5% incentive!'
            : 'Complete 100% of all active targets (Sales, Doctor, & Chemist visits) to unlock monthly commission incentives.'}
        </p>
        <div className="h-px bg-slate-200 w-full mb-4"></div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-700">Estimated Commission Payout:</span>
          <span className={`text-xl font-bold ${isEligibleForIncentive ? 'text-emerald-600' : 'text-slate-500'}`}>
            ₹{estimatedIncentive.toLocaleString()}
          </span>
        </div>
      </div>

    </div>
  );
}
