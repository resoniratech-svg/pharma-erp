import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Printer } from 'lucide-react';
import { PageHeader, FilterBar, SearchInput, ActionButton, DataTable, Drawer, DrawerField } from './components/shared';
import { type Column } from './components/shared';
import { financeService, type Voucher, type Ledger } from '../../services/financeService';

interface JournalEntry {
  id: string;
  journalNumber: string;
  date: string;
  debitLedgerId: string;
  creditLedgerId: string;
  debitLedger: string;
  creditLedger: string;
  amount: number;
  particulars: string;
}

export default function JournalBook() {
  const [data, setData] = useState<JournalEntry[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  
  const [viewVoucher, setViewVoucher] = useState<JournalEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    debitLedgerId: '',
    creditLedgerId: '',
    amount: 0,
    particulars: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allLedgers = await financeService.getLedgers();
      setLedgers(allLedgers);

      // Fetch all vouchers that are JOURNAL
      const vouchers = await financeService.getVouchers({ voucherType: 'JOURNAL' });
      
      const journalVouchers: JournalEntry[] = [];
      
      vouchers.forEach(v => {
        const drTx = v.transactions.find(t => t.type === 'DR');
        const crTx = v.transactions.find(t => t.type === 'CR');
        
        if (drTx && crTx) {
          const debitLedgerName = allLedgers.find(l => String(l.id) === String(drTx.ledgerId))?.name || 'Unknown';
          const creditLedgerName = allLedgers.find(l => String(l.id) === String(crTx.ledgerId))?.name || 'Unknown';

          journalVouchers.push({
            id: String(v.id),
            journalNumber: v.voucherNumber,
            date: v.voucherDate.split('T')[0],
            debitLedgerId: String(drTx.ledgerId),
            creditLedgerId: String(crTx.ledgerId),
            debitLedger: debitLedgerName,
            creditLedger: creditLedgerName,
            amount: v.amount,
            particulars: v.narration || ''
          });
        }
      });
      
      setData(journalVouchers);
    } catch (error) {
      console.error("Failed to fetch journal book data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    return item.journalNumber.toLowerCase().includes(search.toLowerCase()) || 
           item.debitLedger.toLowerCase().includes(search.toLowerCase()) ||
           item.creditLedger.toLowerCase().includes(search.toLowerCase());
  });

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const handleSave = async () => {
    if (!formData.debitLedgerId || !formData.creditLedgerId || !formData.amount) {
      alert("Please fill all mandatory fields.");
      return;
    }

    if (formData.debitLedgerId === formData.creditLedgerId) {
      alert("Debit and Credit ledgers cannot be the same.");
      return;
    }

    try {
      // Transactions for double entry
      const transactions = [
        {
          ledgerId: parseInt(formData.debitLedgerId!),
          type: 'DR',
          amount: formData.amount
        },
        {
          ledgerId: parseInt(formData.creditLedgerId!),
          type: 'CR',
          amount: formData.amount
        }
      ];

      await financeService.createVoucher({
        voucherType: 'JOURNAL',
        voucherDate: new Date(formData.date!).toISOString(),
        amount: formData.amount,
        narration: formData.particulars,
        paymentMode: 'NONE', 
        transactions
      } as any);

      setIsFormOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      alert("Failed to save journal entry.");
      console.error(error);
    }
  };

  const openAddForm = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], debitLedgerId: '', creditLedgerId: '', amount: 0, particulars: '' });
    setIsFormOpen(true);
  };

  const columns: Column<JournalEntry>[] = [
    { key: 'journalNumber', label: 'Journal Number', render: (row) => <span className="font-semibold text-slate-900">{row.journalNumber}</span> },
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'debitLedger', label: 'Debit (Dr) Ledger', render: (row) => <span className="text-emerald-700 font-medium">{row.debitLedger}</span> },
    { key: 'creditLedger', label: 'Credit (Cr) Ledger', render: (row) => <span className="text-rose-700 font-medium">{row.creditLedger}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-medium text-slate-900">{formatCurrency(row.amount)}</span> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => { setViewVoucher(row); setIsDrawerOpen(true); }} className="p-1 text-slate-400 hover:text-[#163c78]" title="View"><Eye className="w-4 h-4" /></button>
        <button onClick={() => { setViewVoucher(row); setIsDrawerOpen(true); setTimeout(() => window.print(), 100); }} className="p-1 text-slate-400 hover:text-violet-600 print:hidden" title="Print"><Printer className="w-4 h-4" /></button>
      </div>
    )}
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader 
        title="Journal Book" 
        subtitle="Manage all non-cash/bank journal entries"
        actions={<ActionButton icon={<Plus className="w-4 h-4" />} onClick={openAddForm}>Add Journal Entry</ActionButton>}
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search journal or ledger..." />
      </FilterBar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No journal entries found." />
        )}
      </div>

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Journal Entry Details">
        {viewVoucher && (
          <div className="space-y-4">
             <DrawerField label="Journal Number" value={viewVoucher.journalNumber} />
             <DrawerField label="Date" value={viewVoucher.date} />
             <DrawerField label="Debit Ledger (Dr)" value={viewVoucher.debitLedger} />
             <DrawerField label="Credit Ledger (Cr)" value={viewVoucher.creditLedger} />
             <DrawerField label="Amount" value={formatCurrency(viewVoucher.amount)} />
             <DrawerField label="Particulars" value={viewVoucher.particulars} />
          </div>
        )}
      </Drawer>

      {/* Add Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Add Journal Entry</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Debit (Dr) Ledger *</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.debitLedgerId} onChange={e => setFormData({...formData, debitLedgerId: e.target.value})}>
                  <option value="">Select Debit Ledger</option>
                  {ledgers.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Credit (Cr) Ledger *</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.creditLedgerId} onChange={e => setFormData({...formData, creditLedgerId: e.target.value})}>
                  <option value="">Select Credit Ledger</option>
                  {ledgers.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Particulars (Narration)</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" rows={3} value={formData.particulars} onChange={e => setFormData({...formData, particulars: e.target.value})} />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSave}>Save Journal</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

