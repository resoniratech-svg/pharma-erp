import { Download } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
} from './components/shared';

export default function BalanceSheet() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Balance Sheet"
        subtitle="Snapshot of the company's financial position (Mock)."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Balance Sheet</ActionButton>
        }
      />

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Pharma ERP Pvt. Ltd.</h2>
            <p className="text-slate-500">Balance Sheet as on 31st March 2027</p>
         </div>
         
         <div className="grid grid-cols-2 gap-8 text-sm">
             {/* Left Column: Liabilities */}
             <div>
                <div className="flex justify-between font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">
                    <span>Liabilities</span>
                    <span>Amount (₹)</span>
                </div>
                <div className="space-y-3 text-slate-700">
                    <div className="font-semibold text-slate-800 pt-2">Capital Account</div>
                    <div className="flex justify-between pl-4"><span>Opening Balance</span><span>50,00,000</span></div>
                    <div className="flex justify-between pl-4"><span>Add: Net Profit</span><span>18,30,000</span></div>
                    <div className="flex justify-between pl-4"><span>Less: Drawings</span><span>(5,00,000)</span></div>
                    
                    <div className="font-semibold text-slate-800 pt-4">Loans (Liability)</div>
                    <div className="flex justify-between pl-4"><span>Bank Loan (Secured)</span><span>25,00,000</span></div>

                    <div className="font-semibold text-slate-800 pt-4">Current Liabilities</div>
                    <div className="flex justify-between pl-4"><span>Sundry Creditors</span><span>14,50,000</span></div>
                    <div className="flex justify-between pl-4"><span>Outstanding Expenses</span><span>1,20,000</span></div>
                    
                    <div className="flex justify-between mt-8 p-3 bg-slate-50 text-slate-900 font-bold rounded-lg border border-slate-200">
                        <span>Total Liabilities</span>
                        <span>1,04,00,000</span>
                    </div>
                </div>
             </div>
             
             {/* Right Column: Assets */}
             <div>
                <div className="flex justify-between font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">
                    <span>Assets</span>
                    <span>Amount (₹)</span>
                </div>
                <div className="space-y-3 text-slate-700">
                    <div className="font-semibold text-slate-800 pt-2">Fixed Assets</div>
                    <div className="flex justify-between pl-4"><span>Plant & Machinery</span><span>45,00,000</span></div>
                    <div className="flex justify-between pl-4"><span>Furniture & Fixtures</span><span>5,50,000</span></div>
                    <div className="flex justify-between pl-4"><span>Computers & IT</span><span>3,00,000</span></div>

                    <div className="font-semibold text-slate-800 pt-4">Current Assets</div>
                    <div className="flex justify-between pl-4"><span>Closing Stock</span><span>16,00,000</span></div>
                    <div className="flex justify-between pl-4"><span>Sundry Debtors</span><span>28,50,000</span></div>
                    <div className="flex justify-between pl-4"><span>Cash in Hand</span><span>1,50,000</span></div>
                    <div className="flex justify-between pl-4"><span>Bank Accounts</span><span>4,50,000</span></div>
                    
                    <div className="flex justify-between mt-8 p-3 bg-slate-50 text-slate-900 font-bold rounded-lg border border-slate-200">
                        <span>Total Assets</span>
                        <span>1,04,00,000</span>
                    </div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
