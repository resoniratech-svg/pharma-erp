import { Download, TrendingUp } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
} from './components/shared';

export default function ProfitLoss() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Profit & Loss Statement"
        subtitle="Financial performance overview for the current fiscal year (Mock)."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export P&L</ActionButton>
        }
      />

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Pharma ERP Pvt. Ltd.</h2>
            <p className="text-slate-500">Profit & Loss Account for the year ended 31st March 2027</p>
         </div>
         
         <div className="grid grid-cols-2 gap-8 text-sm">
             {/* Left Column: Expenses */}
             <div>
                <div className="flex justify-between font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">
                    <span>Particulars (Dr.)</span>
                    <span>Amount (₹)</span>
                </div>
                <div className="space-y-3 text-slate-700">
                    <div className="flex justify-between"><span>To Opening Stock</span><span>15,50,000</span></div>
                    <div className="flex justify-between"><span>To Purchases</span><span>1,45,20,000</span></div>
                    <div className="flex justify-between pl-4 text-slate-500 text-xs"><span>Less: Purchase Returns</span><span>(1,20,000)</span></div>
                    <div className="flex justify-between"><span>To Direct Expenses</span><span>8,40,000</span></div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold"><span>Gross Profit c/d</span><span>65,10,000</span></div>
                    
                    <div className="mt-8 pt-4 border-t-2 border-slate-200"></div>

                    <div className="flex justify-between"><span>To Salaries & Wages</span><span>24,00,000</span></div>
                    <div className="flex justify-between"><span>To Rent & Utilities</span><span>6,50,000</span></div>
                    <div className="flex justify-between"><span>To MR Commissions</span><span>8,20,000</span></div>
                    <div className="flex justify-between"><span>To Marketing Expenses</span><span>5,00,000</span></div>
                    <div className="flex justify-between"><span>To Depreciation</span><span>3,10,000</span></div>
                    
                    <div className="flex justify-between mt-4 p-2 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-100">
                        <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Net Profit</span>
                        <span>18,30,000</span>
                    </div>
                </div>
             </div>
             
             {/* Right Column: Income */}
             <div>
                <div className="flex justify-between font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">
                    <span>Particulars (Cr.)</span>
                    <span>Amount (₹)</span>
                </div>
                <div className="space-y-3 text-slate-700">
                    <div className="flex justify-between"><span>By Sales</span><span>2,20,50,000</span></div>
                    <div className="flex justify-between pl-4 text-slate-500 text-xs"><span>Less: Sales Returns</span><span>(3,50,000)</span></div>
                    <div className="flex justify-between"><span>By Closing Stock</span><span>16,00,000</span></div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold"><span></span><span>2,33,00,000</span></div>

                    <div className="mt-8 pt-4 border-t-2 border-slate-200"></div>
                    
                    <div className="flex justify-between font-semibold"><span>By Gross Profit b/d</span><span>65,10,000</span></div>
                    <div className="flex justify-between"><span>By Discount Received</span><span>45,000</span></div>
                    <div className="flex justify-between"><span>By Interest Income</span><span>55,000</span></div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
