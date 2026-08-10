import { useState, useEffect } from 'react';
import { Eye, Download, Printer, Plus, X } from 'lucide-react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton, DataTable, Badge } from './components/shared';
import { type Column } from './components/shared';
import { financeService, type Ledger, type LedgerTransaction } from '../../services/financeService';

interface LedgerSummary {
  id: string;
  name: string;
  group: string;
  openingBalance: number;
  closingBalance: number;
  type: 'DR' | 'CR';
}

interface ProcessedTransaction {
  id: string;
  date: string;
  particulars: string;
  voucherType: string;
  voucherNo: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'DR' | 'CR';
}

export default function LedgerBook() {
  const [data, setData] = useState<LedgerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedLedger, setSelectedLedger] = useState<LedgerSummary | null>(null);
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2027-03-31');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    groupId: '',
    openingBalance: 0,
    balanceType: 'DR'
  });

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', nature: 'Asset' });

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const allLedgers = await financeService.getLedgers();
      const allGroups = await financeService.getLedgerGroups();
      setGroups(allGroups);

      const tb = await financeService.getTrialBalance();
      
      const summary: LedgerSummary[] = allLedgers.map(l => {
        const tbEntry = tb.find(t => t.id === l.id);
        
        let closing = l.openingBalance;
        let type = l.balanceType;
        
        if (tbEntry) {
          if (tbEntry.debit > 0) { closing = tbEntry.debit; type = 'DR'; }
          else if (tbEntry.credit > 0) { closing = tbEntry.credit; type = 'CR'; }
        }

        return {
          id: String(l.id),
          name: l.name,
          group: l.group?.name || 'Unknown',
          openingBalance: l.openingBalance,
          closingBalance: closing,
          type: type as 'DR' | 'CR'
        };
      });

      setData(summary);
    } catch (error) {
      console.error("Failed to fetch ledgers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!newGroupData.name) return;
    try {
      const group = await financeService.createLedgerGroup(newGroupData);
      const allGroups = await financeService.getLedgerGroups();
      setGroups(allGroups);
      setFormData({ ...formData, groupId: group.id });
      setIsAddingGroup(false);
      setNewGroupData({ name: '', nature: 'Asset' });
    } catch (error) {
      alert("Failed to create group.");
    }
  };

  const handleSaveLedger = async () => {
    if (!formData.name || !formData.groupId) {
      alert("Please enter a name and select a group.");
      return;
    }
    
    try {
      await financeService.createLedger({
        name: formData.name,
        groupId: parseInt(formData.groupId),
        openingBalance: formData.openingBalance,
        balanceType: formData.balanceType as 'DR' | 'CR'
      });
      setIsFormOpen(false);
      setFormData({ name: '', groupId: '', openingBalance: 0, balanceType: 'DR' });
      fetchLedgers();
    } catch (error) {
      alert("Failed to create ledger.");
    }
  };

  const handleViewLedger = async (ledger: LedgerSummary) => {
    setSelectedLedger(ledger);
    setLoadingTxns(true);
    try {
      const txns = await financeService.getLedgerStatement(ledger.id);
      
      let runningBalance = ledger.openingBalance;
      let currentType = ledger.type;

      const processed: ProcessedTransaction[] = [];
      
      // Opening Balance Entry
      processed.push({
        id: 'opening',
        date: '-',
        particulars: 'Opening Balance',
        voucherType: '-',
        voucherNo: '-',
        debit: ledger.type === 'DR' ? ledger.openingBalance : 0,
        credit: ledger.type === 'CR' ? ledger.openingBalance : 0,
        balance: runningBalance,
        balanceType: currentType
      });

      txns.forEach(t => {
        const debitAmt = t.type === 'DR' ? t.amount : 0;
        const creditAmt = t.type === 'CR' ? t.amount : 0;
        
        // Very basic running balance calculation
        if (currentType === 'DR') {
          runningBalance += debitAmt - creditAmt;
        } else {
          runningBalance += creditAmt - debitAmt;
        }

        if (runningBalance < 0) {
          runningBalance = Math.abs(runningBalance);
          currentType = currentType === 'DR' ? 'CR' : 'DR';
        }

        processed.push({
          id: String(t.id),
          date: t.voucher?.voucherDate?.split('T')[0] || '-',
          particulars: t.voucher?.narration || 'Transaction',
          voucherType: t.voucher?.voucherType || '-',
          voucherNo: t.voucher?.voucherNumber || '-',
          debit: debitAmt,
          credit: creditAmt,
          balance: runningBalance,
          balanceType: currentType
        });
      });

      setTransactions(processed);
    } catch (error) {
      console.error("Failed to fetch ledger statement", error);
    } finally {
      setLoadingTxns(false);
    }
  };

  const formatCurrency = (val: number, type: 'DR' | 'CR') => `,1 ${val.toLocaleString('en-IN')} ${type}`;
  const formatAmount = (val: number) => val === 0 ? '-' : `,1 ${val.toLocaleString('en-IN')}`;

  const filteredData = data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.group.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<LedgerSummary>[] = [
    { key: 'name', label: 'Ledger Name', render: (row) => <span className="font-semibold text-[#163c78]">{row.name}</span> },
    { key: 'group', label: 'Group', render: (row) => <span className="text-slate-600">{row.group}</span> },
    { key: 'openingBalance', label: 'Opening Balance', render: (row) => <span className="text-slate-700">{formatCurrency(row.openingBalance, row.type)}</span> },
    { key: 'closingBalance', label: 'Closing Balance', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.closingBalance, row.type)}</span> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <button onClick={() => handleViewLedger(row)} className="text-[#163c78] hover:text-blue-800 text-sm font-medium flex items-center gap-1">
        <Eye className="w-4 h-4" /> View Ledger
      </button>
    )}
  ];

  const txnColumns: Column<ProcessedTransaction>[] = [
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'particulars', label: 'Particulars', render: (row) => <span className="text-slate-800">{row.particulars}</span> },
    { key: 'voucherType', label: 'Vch Type', render: (row) => <span className="text-slate-600">{row.voucherType}</span> },
    { key: 'voucherNo', label: 'Vch No.', render: (row) => <span className="text-[#163c78] font-medium">{row.voucherNo}</span> },
    { key: 'debit', label: 'Debit', render: (row) => <span className="text-slate-800">{formatAmount(row.debit)}</span> },
    { key: 'credit', label: 'Credit', render: (row) => <span className="text-slate-800">{formatAmount(row.credit)}</span> },
    { key: 'balance', label: 'Balance', render: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.balance, row.balanceType)}</span> }
  ];

  if (selectedLedger) {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedLedger(null)} className="text-slate-500 hover:text-slate-800 font-medium text-sm">&larr; Back to Ledgers</button>
        </div>

        <PageHeader 
          title={`${selectedLedger.name} Statement`} 
          subtitle={`Group: ${selectedLedger.group}`}
          actions={
            <div className="flex gap-3">
              <ActionButton variant="secondary" icon={<Printer className="w-4 h-4" />}>Print</ActionButton>
              <ActionButton icon={<Download className="w-4 h-4" />}>Export to Excel</ActionButton>
            </div>
          }
        />

        <FilterBar>
          <div className="flex items-center gap-4">
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Opening Balance</p>
              <p className="font-semibold text-slate-800">{formatCurrency(selectedLedger.openingBalance, selectedLedger.type)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Debit</p>
              <p className="font-semibold text-slate-800">{formatAmount(transactions.reduce((acc, t) => acc + t.debit, 0) - (selectedLedger.type === 'DR' ? selectedLedger.openingBalance : 0))}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Credit</p>
              <p className="font-semibold text-slate-800">{formatAmount(transactions.reduce((acc, t) => acc + t.credit, 0) - (selectedLedger.type === 'CR' ? selectedLedger.openingBalance : 0))}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Closing Balance</p>
              <p className="font-bold text-[#163c78]">{formatCurrency(selectedLedger.closingBalance, selectedLedger.type)}</p>
            </div>
          </div>
          {loadingTxns ? (
             <div className="p-8 text-center text-slate-500">Loading statement...</div>
          ) : (
            <DataTable columns={txnColumns} data={transactions} emptyMessage="No transactions found." />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Ledger Accounts" 
        subtitle="View summary and statement of all ledger accounts"
        actions={<ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setIsFormOpen(true)}>Add Ledger</ActionButton>}
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search ledger or group..." />
      </FilterBar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No ledgers found." />
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Add New Ledger</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ledger Name *</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" placeholder="e.g. Traveling Expenses" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Account Group *</label>
                    {!isAddingGroup && (
                      <button type="button" onClick={() => setIsAddingGroup(true)} className="text-xs text-[#163c78] font-medium hover:underline">+ Add New Group</button>
                    )}
                  </div>
                  
                  {isAddingGroup ? (
                    <div className="flex gap-2 items-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <input type="text" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-[#163c78]" placeholder="Group Name" value={newGroupData.name} onChange={e => setNewGroupData({...newGroupData, name: e.target.value})} />
                      <select className="px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-[#163c78]" value={newGroupData.nature} onChange={e => setNewGroupData({...newGroupData, nature: e.target.value})}>
                        <option value="Asset">Asset</option>
                        <option value="Liability">Liability</option>
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                        <option value="Equity">Equity</option>
                      </select>
                      <button type="button" onClick={handleSaveGroup} className="px-3 py-1.5 bg-[#163c78] text-white rounded text-sm font-medium hover:bg-blue-800">Save</button>
                      <button type="button" onClick={() => setIsAddingGroup(false)} className="px-2 py-1.5 text-slate-500 hover:text-slate-800"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})}>
                      <option value="">Select Group</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.nature})</option>
                      ))}
                    </select>
                  )}
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.openingBalance || ''} onChange={e => setFormData({...formData, openingBalance: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Balance Type</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.balanceType} onChange={e => setFormData({...formData, balanceType: e.target.value})}>
                    <option value="DR">Debit (Dr)</option>
                    <option value="CR">Credit (Cr)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveLedger}>Save Ledger</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
