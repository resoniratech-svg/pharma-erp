import { useState, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { PageHeader, FilterBar, SelectFilter, ActionButton, DataTable } from './components/shared';
import { type Column } from './components/shared';
import { financeService } from '../../services/financeService';
import { exportToCSV } from '../../utils/exportUtils';

interface TrialBalanceItem {
  id: string;
  ledgerName: string;
  debit: number;
  credit: number;
}

export default function TrialBalance() {
  const [data, setData] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fy, setFy] = useState('2026-27');
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2027-03-31');
  const [branch, setBranch] = useState('All');
  const [ledgerGroup, setLedgerGroup] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tb = await financeService.getTrialBalance();
      const mapped = tb.map(item => ({
        id: String(item.id),
        ledgerName: item.name,
        debit: item.debit || 0,
        credit: item.credit || 0
      })).filter(item => item.debit > 0 || item.credit > 0);
      setData(mapped);
    } catch (error) {
      console.error("Failed to fetch Trial Balance", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => val === 0 ? '-' : `₹${val.toLocaleString('en-IN')}`;

  const columns: Column<TrialBalanceItem>[] = [
    { key: 'ledgerName', label: 'Ledger Name', render: (row) => <span className="font-medium text-slate-800">{row.ledgerName}</span> },
    { key: 'debit', label: 'Debit (INR)', render: (row) => <span className="text-slate-700">{formatCurrency(row.debit)}</span> },
    { key: 'credit', label: 'Credit (INR)', render: (row) => <span className="text-slate-700">{formatCurrency(row.credit)}</span> },
  ];

  const totalDebit = data.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = data.reduce((sum, item) => sum + item.credit, 0);

  const handleExport = () => {
    const exportColumns = [
      { key: 'ledgerName', label: 'Ledger Name' },
      { key: 'debit', label: 'Debit (INR)' },
      { key: 'credit', label: 'Credit (INR)' }
    ];
    // Create a copy of data and add the totals row at the end
    const exportData = [
      ...data,
      { ledgerName: 'Total', debit: totalDebit, credit: totalCredit }
    ];
    exportToCSV(exportData, exportColumns, `Trial_Balance_${fy}.csv`);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Trial Balance" 
        subtitle="Statement of all ledger balances"
        actions={
          <div className="flex gap-3">
            <ActionButton variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>Print</ActionButton>
            <ActionButton icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export to CSV</ActionButton>
          </div>
        }
      />

      <FilterBar>
        <div className="flex items-center gap-4 flex-wrap">
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
           <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
             <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={branch} onChange={e => setBranch(e.target.value)}>
               <option>All</option>
               <option>Head Office</option>
               <option>Mumbai Branch</option>
             </select>
           </div>
           <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Ledger Group</label>
             <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={ledgerGroup} onChange={e => setLedgerGroup(e.target.value)}>
               <option>All</option>
               <option>Sundry Debtors</option>
               <option>Sundry Creditors</option>
               <option>Bank Accounts</option>
             </select>
           </div>
        </div>
      </FilterBar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Loading trial balance...</div>
        ) : (
          <>
            <DataTable columns={columns} data={data} emptyMessage="No trial balance data available." />
            
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center rounded-b-xl">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-sm">Grand Total</span>
              <div className="flex gap-16 pr-12">
                <div className="flex flex-col items-end w-32">
                  <span className="text-xs text-slate-500 mb-1">Total Debit</span>
                  <span className="font-bold text-[#163c78] border-b-2 border-double border-[#163c78]">{totalDebit === 0 ? '-' : `₹${totalDebit.toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex flex-col items-end w-32">
                  <span className="text-xs text-slate-500 mb-1">Total Credit</span>
                  <span className="font-bold text-[#163c78] border-b-2 border-double border-[#163c78]">{totalCredit === 0 ? '-' : `₹${totalCredit.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
            </div>
            {totalDebit !== totalCredit && (
              <div className="p-3 bg-red-50 text-red-700 text-sm font-medium border-t border-red-100 flex items-center justify-center">
                Warning: Trial Balance does not tally. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

