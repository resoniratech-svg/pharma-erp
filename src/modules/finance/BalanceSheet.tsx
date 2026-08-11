import { useState, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { PageHeader, FilterBar, SelectFilter, ActionButton } from './components/shared';
import { financeService } from '../../services/financeService';
import { exportToCSV } from '../../utils/exportUtils';

interface BSAccount {
  id: string;
  name: string;
  amount: number;
}

export default function BalanceSheet() {
  const [assets, setAssets] = useState<BSAccount[]>([]);
  const [liabilities, setLiabilities] = useState<BSAccount[]>([]);
  const [netProfit, setNetProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  const [fy, setFy] = useState('2026-27');
  const [asOnDate, setAsOnDate] = useState('2027-03-31');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const bs = await financeService.getBalanceSheet();
      if (bs) {
        setAssets(bs.assets.map((a: any) => ({
          id: String(a.id),
          name: a.name,
          amount: a.debit || 0
        })).filter((a: any) => a.amount > 0));

        const libs = bs.liabilities.map((l: any) => ({
          id: String(l.id),
          name: l.name,
          amount: l.credit || 0
        })).filter((l: any) => l.amount > 0);
        
        setLiabilities(libs);
        setNetProfit(bs.netProfit || 0);
      }
    } catch (error) {
      console.error("Failed to fetch Balance Sheet", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const totalLiabilities = liabilities.reduce((acc, curr) => acc + curr.amount, 0) + (netProfit > 0 ? netProfit : 0);
  const totalAssets = assets.reduce((acc, curr) => acc + curr.amount, 0) + (netProfit < 0 ? Math.abs(netProfit) : 0);

  const maxRows = Math.max(liabilities.length + (netProfit > 0 ? 1 : 0), assets.length + (netProfit < 0 ? 1 : 0));

  const handleExport = () => {
    const rows: any[] = [];
    for (let i = 0; i < maxRows; i++) {
      let libName = '';
      let libAmount = '';
      let assetName = '';
      let assetAmount = '';

      if (i < liabilities.length) {
        libName = liabilities[i].name;
        libAmount = liabilities[i].amount.toString();
      } else if (i === liabilities.length && netProfit > 0) {
        libName = 'Add: Net Profit';
        libAmount = netProfit.toString();
      }

      if (i < assets.length) {
        assetName = assets[i].name;
        assetAmount = assets[i].amount.toString();
      } else if (i === assets.length && netProfit < 0) {
        assetName = 'Add: Net Loss';
        assetAmount = Math.abs(netProfit).toString();
      }

      rows.push({
        'Liabilities & Equity': libName,
        'Amount(L)': libAmount,
        'Assets': assetName,
        'Amount(A)': assetAmount
      });
    }

    rows.push({
      'Liabilities & Equity': 'Total',
      'Amount(L)': totalLiabilities.toString(),
      'Assets': 'Total',
      'Amount(A)': totalAssets.toString()
    });

    const columns = [
      { key: 'Liabilities & Equity', label: 'Liabilities & Equity' },
      { key: 'Amount(L)', label: 'Amount' },
      { key: 'Assets', label: 'Assets' },
      { key: 'Amount(A)', label: 'Amount' }
    ];

    exportToCSV(rows, columns, `Balance_Sheet_${fy}.csv`);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Balance Sheet" 
        subtitle="Statement of assets, liabilities, and equity"
        actions={
          <div className="flex gap-3">
            <ActionButton variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Print</ActionButton>
            <ActionButton icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export Report</ActionButton>
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
             <label className="block text-xs font-medium text-slate-500 mb-1">As On Date</label>
             <input type="date" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={asOnDate} onChange={e => setAsOnDate(e.target.value)} />
           </div>
        </div>
      </FilterBar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Loading Balance Sheet...</div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            {/* Liabilities & Equity */}
            <div>
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 text-center">Liabilities & Equity</h3>
              </div>
              <div className="p-0">
                {liabilities.map((lib, i) => (
                  <div key={i} className="flex justify-between px-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{lib.name}</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(lib.amount)}</span>
                  </div>
                ))}
                
                {netProfit > 0 && (
                  <div className="flex justify-between px-4 py-2 border-b border-slate-100 bg-emerald-50 text-emerald-800">
                    <span className="text-sm font-medium">Add: Net Profit</span>
                    <span className="text-sm font-medium">{formatCurrency(netProfit)}</span>
                  </div>
                )}
                
                {/* Empty rows to match height */}
                {[...Array(Math.max(0, maxRows - (liabilities.length + (netProfit > 0 ? 1 : 0))))].map((_, i) => (
                   <div key={`empty-lib-${i}`} className="flex justify-between px-4 py-2 border-b border-slate-100 last:border-0">
                     <span className="text-sm text-transparent">-</span>
                   </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div>
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 text-center">Assets</h3>
              </div>
              <div className="p-0">
                {assets.map((asset, i) => (
                  <div key={i} className="flex justify-between px-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{asset.name}</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(asset.amount)}</span>
                  </div>
                ))}

                {netProfit < 0 && (
                  <div className="flex justify-between px-4 py-2 border-b border-slate-100 bg-red-50 text-red-800">
                    <span className="text-sm font-medium">Add: Net Loss</span>
                    <span className="text-sm font-medium">{formatCurrency(Math.abs(netProfit))}</span>
                  </div>
                )}

                {/* Empty rows to match height */}
                {[...Array(Math.max(0, maxRows - (assets.length + (netProfit < 0 ? 1 : 0))))].map((_, i) => (
                   <div key={`empty-asset-${i}`} className="flex justify-between px-4 py-2 border-b border-slate-100 last:border-0">
                     <span className="text-sm text-transparent">-</span>
                   </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 divide-x divide-slate-200 bg-[#163c78] text-white">
            <div className="flex justify-between px-4 py-3">
              <span className="font-bold">Total</span>
              <span className="font-bold border-b-2 border-double border-white">{formatCurrency(totalLiabilities)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="font-bold">Total</span>
              <span className="font-bold border-b-2 border-double border-white">{formatCurrency(totalAssets)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

