import { useState } from 'react';
import { ScanBarcode, Download } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
} from './components/shared';

export default function BarcodeBilling() {
  const [barcode, setBarcode] = useState('');

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Barcode Billing"
        subtitle="Fast checkout interface using barcode scanners."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Hold Bill</ActionButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-4">
               <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan barcode or type product code..."
                    className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-violet-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all font-mono"
                    autoFocus
                  />
               </div>
               <ActionButton>Add</ActionButton>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center text-slate-400">
                <ScanBarcode className="w-16 h-16 mb-4 text-slate-200" />
                <p>Scan a product to add it to the cart.</p>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
             <h3 className="text-lg font-bold text-slate-900 mb-6">Bill Summary</h3>
             <div className="space-y-4 mb-6">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Subtotal</span>
                 <span className="font-medium text-slate-800">₹ 0.00</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">CGST (9%)</span>
                 <span className="font-medium text-slate-800">₹ 0.00</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">SGST (9%)</span>
                 <span className="font-medium text-slate-800">₹ 0.00</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Discount</span>
                 <span className="font-medium text-emerald-600">- ₹ 0.00</span>
               </div>
               <div className="pt-4 border-t border-slate-200 flex justify-between">
                 <span className="text-base font-bold text-slate-900">Total</span>
                 <span className="text-xl font-bold text-violet-700">₹ 0.00</span>
               </div>
             </div>
             <ActionButton className="w-full justify-center py-3 text-base">Generate Invoice</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
