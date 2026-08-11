import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Printer } from 'lucide-react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, ActionButton, DataTable, Drawer, DrawerField, Badge } from './components/shared';
import { type Column } from './components/shared';
import { financeService, type Voucher, type Ledger } from '../../services/financeService';

type TransactionType = 'Receipt' | 'Payment';

interface CashVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  type: TransactionType;
  ledgerId: string;
  ledger: string; // The opposite ledger (Not the cash ledger)
  amount: number;
  particulars: string;
}

export default function CashBook() {
  const [data, setData] = useState<CashVoucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [viewVoucher, setViewVoucher] = useState<CashVoucher | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CashVoucher>>({
    type: 'Receipt',
    date: new Date().toISOString().split('T')[0],
    ledgerId: '',
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

      // Fetch all vouchers that are CASH
      const vouchers = await financeService.getVouchers({ paymentMode: 'CASH' });
      
      const mapped: CashVoucher[] = vouchers.map(v => {
        // Find the non-cash ledger in the transaction to display as the party
        // Assuming Cash Ledger is always in the transaction
        const cashGroup = allLedgers.find(l => l.name.toLowerCase().includes('cash'));
        const cashLedgerId = cashGroup?.id || -1;
        
        const opposingTx = v.transactions.find(t => String(t.ledgerId) !== String(cashLedgerId)) || v.transactions[0];
        const opposingLedgerName = allLedgers.find(l => String(l.id) === String(opposingTx?.ledgerId))?.name || 'Unknown';

        return {
          id: String(v.id),
          voucherNumber: v.voucherNumber,
          date: v.voucherDate.split('T')[0],
          type: (v.voucherType === 'RECEIPT' ? 'Receipt' : 'Payment') as TransactionType,
          ledgerId: String(opposingTx?.ledgerId),
          ledger: opposingLedgerName,
          amount: v.amount,
          particulars: v.narration || ''
        };
      });
      setData(mapped);
    } catch (error) {
      console.error("Failed to fetch cash book data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.voucherNumber.toLowerCase().includes(search.toLowerCase()) || 
                        item.ledger.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const handleSave = async () => {
    if (!formData.ledgerId || !formData.amount) {
      alert("Please fill all mandatory fields.");
      return;
    }

    try {
      // Find cash ledger
      const cashLedger = ledgers.find(l => l.name.toLowerCase().includes('cash'));
      if (!cashLedger) {
        alert("Cash ledger not found in system.");
        return;
      }

      const isReceipt = formData.type === 'Receipt';
      
      // Transactions for double entry
      const transactions = [
        {
          ledgerId: parseInt(cashLedger.id),
          type: isReceipt ? 'DR' : 'CR',
          amount: formData.amount
        },
        {
          ledgerId: parseInt(formData.ledgerId!),
          type: isReceipt ? 'CR' : 'DR',
          amount: formData.amount
        }
      ];

      await financeService.createVoucher({
        voucherType: isReceipt ? 'RECEIPT' : 'PAYMENT',
        voucherDate: new Date(formData.date!).toISOString(),
        amount: formData.amount,
        narration: formData.particulars,
        paymentMode: 'CASH',
        transactions
      } as any);

      setIsFormOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      alert("Failed to save voucher.");
      console.error(error);
    }
  };

  const openAddForm = () => {
    setFormData({ type: 'Receipt', date: new Date().toISOString().split('T')[0], ledgerId: '', amount: 0, particulars: '' });
    setIsFormOpen(true);
  };

  const columns: Column<CashVoucher>[] = [
    { key: 'voucherNumber', label: 'Voucher Number', render: (row) => <span className="font-semibold text-slate-900">{row.voucherNumber}</span> },
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'type', label: 'Transaction Type', render: (row) => <Badge variant={row.type === 'Receipt' ? 'success' : 'danger'}>{row.type}</Badge> },
    { key: 'ledger', label: 'Party / Ledger', render: (row) => <span className="text-slate-700">{row.ledger}</span> },
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
        title="Cash Book" 
        subtitle="Manage daily cash receipts and payments"
        actions={<ActionButton icon={<Plus className="w-4 h-4" />} onClick={openAddForm}>Add Voucher</ActionButton>}
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search voucher or ledger..." />
        <SelectFilter value={typeFilter} onChange={setTypeFilter} options={['Receipt', 'Payment']} placeholder="All Types" />
      </FilterBar>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No cash vouchers found." />
        )}
      </div>

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Cash Voucher Details">
        {viewVoucher && (
          <div className="space-y-4">
             <DrawerField label="Voucher Number" value={viewVoucher.voucherNumber} />
             <DrawerField label="Date" value={viewVoucher.date} />
             <DrawerField label="Type" value={<Badge variant={viewVoucher.type === 'Receipt' ? 'success' : 'danger'}>{viewVoucher.type}</Badge>} />
             <DrawerField label="Ledger" value={viewVoucher.ledger} />
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
              <h2 className="text-lg font-bold text-slate-800">Add Cash Voucher</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}>
                    <option value="Receipt">Receipt</option>
                    <option value="Payment">Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Party / Ledger *</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78]" value={formData.ledgerId} onChange={e => setFormData({...formData, ledgerId: e.target.value})}>
                  <option value="">Select Ledger</option>
                  {ledgers.filter(l => !l.name.toLowerCase().includes('cash')).map(l => (
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
              <ActionButton onClick={handleSave}>Save Voucher</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

