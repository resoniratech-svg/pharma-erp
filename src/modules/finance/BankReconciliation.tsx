import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface ReconEntry {
  id: string;
  date: string;
  particulars: string;
  instrumentNo: string;
  amount: string;
  type: 'Receipt' | 'Payment';
  status: 'Reconciled' | 'Unreconciled';
}

const mockData: ReconEntry[] = [
  { id: '1', date: '18-Oct-2026', particulars: 'Apollo Pharmacy', instrumentNo: 'NEFT-123456', amount: '₹ 45,000', type: 'Receipt', status: 'Reconciled' },
  { id: '2', date: '19-Oct-2026', particulars: 'Sun Pharma (Vendor)', instrumentNo: 'CHQ-00123', amount: '₹ 1,20,000', type: 'Payment', status: 'Unreconciled' },
  { id: '3', date: '20-Oct-2026', particulars: 'Wellness Medicos', instrumentNo: 'UPI-98765', amount: '₹ 15,000', type: 'Receipt', status: 'Unreconciled' },
];

export default function BankReconciliation() {
  const [search, setSearch] = useState('');

  const columns: Column<ReconEntry>[] = [
    { key: 'date', label: 'Date' },
    { key: 'particulars', label: 'Particulars', render: (row) => <span className="font-semibold text-slate-900">{row.particulars}</span> },
    { key: 'instrumentNo', label: 'Inst. No' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        return <span className={row.type === 'Receipt' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{row.type}</span>;
      },
    },
    { key: 'amount', label: 'Amount' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Reconciled' ? 'success' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: (row) => row.status === 'Unreconciled' ? 
        <ActionButton variant="secondary" className="text-xs px-2 py-1"><CheckCircle2 className="w-3 h-3 mr-1" /> Reconcile</ActionButton> 
        : <span className="text-slate-300">-</span>
    }
  ];

  const filteredData = mockData.filter((item) => {
    return item.particulars.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Match ERP bank ledger entries with actual bank statements."
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-start gap-4 shadow-sm">
        <div className="flex-1">
           <p className="text-sm text-slate-500 mb-1">Balance as per Company Books</p>
           <p className="text-xl font-bold text-slate-900">₹ 4,50,000</p>
        </div>
        <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
        <div className="flex-1">
           <p className="text-sm text-slate-500 mb-1">Balance as per Bank Statement</p>
           <p className="text-xl font-bold text-slate-900">₹ 3,45,000</p>
        </div>
        <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
        <div className="flex-1">
           <p className="text-sm text-slate-500 mb-1">Difference</p>
           <div className="flex items-center gap-2">
               <p className="text-xl font-bold text-amber-600">₹ 1,05,000</p>
               <AlertCircle className="w-4 h-4 text-amber-500" />
           </div>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search particulars..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No entries found."
        />
      </TableCard>
    </div>
  );
}
