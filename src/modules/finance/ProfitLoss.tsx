import { useState, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { PageHeader, FilterBar, SelectFilter, ActionButton } from './components/shared';
import { financeService } from '../../services/financeService';

interface PLAccount {
  id: string;
  name: string;
  amount: number;
}

export default function ProfitLoss() {
  const [incomes, setIncomes] = useState<PLAccount[]>([]);
  const [expenses, setExpenses] = useState<PLAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [fy, setFy] = useState('2026-27');
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2027-03-31');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pnl = await financeService.getProfitLoss();
      if (pnl) {
        setIncomes(pnl.incomes.map((i: any) => ({
          id: String(i.id),
          name: i.name,
          amount: i.credit || 0
        })).filter((i: any) => i.amount > 0));

        setExpenses(pnl.expenses.map((e: any) => ({
          id: String(e.id),
          name: e.name,
          amount: e.debit || 0
        })).filter((e: any) => e.amount > 0));
      }
    } catch (error) {
      console.error("Failed to fetch P&L", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const maxRows = Math.max(incomes.length, expenses.length);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Profit & Loss Account" 
        subtitle="Statement of financial performance"
        actions={
          <div className="flex gap-3">
            <ActionButton variant="secondary" icon={<Printer className="w-4 h-4" />}>Print</ActionButton>
            <ActionButton icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
          </div>
        }
      />

      <FilterBar>
        <div className="flex items-center gap-4">
           <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Financial Year</label>
             <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={fy} onChange={e => setFy(e.target.value)}>
               <option>2025-26</option>
               <option>2026-27</option>
             </select>
           </div>
           <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
             <input type="date" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={fromDate} onChange={e => setFromDate(e.target.value)} />
           </div>
           <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
             <input type="date" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={toDate} onChange={e => setToDate(e.target.value)} />
           </div>
        </div>
      </FilterBar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading Profit & Loss statement...</div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            {/* Dr (Expenses) Side */}
            <div>
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 text-center">Particulars (Expenses - Dr)</h3>
              </div>
              <div className="p-0">
                {[...Array(maxRows)].map((_, i) => {
                  const expense = expenses[i];
                  return (
                    <div key={i} className="flex justify-between px-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <span className="text-sm text-slate-700">{expense ? expense.name : ''}</span>
                      <span className="text-sm font-medium text-slate-900">{expense ? formatCurrency(expense.amount) : ''}</span>
                    </div>
                  );
                })}
                {/* Balancing Figure if Profit */}
                {netProfit > 0 && (
                  <div className="flex justify-between px-4 py-3 border-t border-slate-200 bg-emerald-50 text-emerald-800">
                    <span className="text-sm font-bold">Net Profit</span>
                    <span className="text-sm font-bold">{formatCurrency(netProfit)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cr (Income) Side */}
            <div>
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 text-center">Particulars (Income - Cr)</h3>
              </div>
              <div className="p-0">
                {[...Array(maxRows)].map((_, i) => {
                  const income = incomes[i];
                  return (
                    <div key={i} className="flex justify-between px-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <span className="text-sm text-slate-700">{income ? income.name : ''}</span>
                      <span className="text-sm font-medium text-slate-900">{income ? formatCurrency(income.amount) : ''}</span>
                    </div>
                  );
                })}
                {/* Balancing Figure if Loss */}
                {netProfit < 0 && (
                  <div className="flex justify-between px-4 py-3 border-t border-slate-200 bg-red-50 text-red-800">
                    <span className="text-sm font-bold">Net Loss</span>
                    <span className="text-sm font-bold">{formatCurrency(Math.abs(netProfit))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 divide-x divide-slate-200 bg-[#163c78] text-white">
            <div className="flex justify-between px-4 py-3">
              <span className="font-bold">Total</span>
              <span className="font-bold border-b-2 border-double border-white">
                {formatCurrency(totalExpenses + (netProfit > 0 ? netProfit : 0))}
              </span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="font-bold">Total</span>
              <span className="font-bold border-b-2 border-double border-white">
                {formatCurrency(totalIncome + (netProfit < 0 ? Math.abs(netProfit) : 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

