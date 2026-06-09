import { useState } from 'react';
import { Download, Filter, IndianRupee } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface OutstandingEntry {
  id: string;
  partyName: string;
  type: 'Receivable' | 'Payable';
  pendingBills: number;
  totalAmount: string;
  overdueAmount: string;
}

const mockData: OutstandingEntry[] = [
  { id: '1', partyName: 'Apollo Pharmacy', type: 'Receivable', pendingBills: 3, totalAmount: '₹ 1,45,000', overdueAmount: '₹ 45,000' },
  { id: '2', partyName: 'Sun Pharma (Vendor)', type: 'Payable', pendingBills: 1, totalAmount: '₹ 5,00,000', overdueAmount: '₹ 0' },
  { id: '3', partyName: 'Wellness Medicos', type: 'Receivable', pendingBills: 5, totalAmount: '₹ 85,000', overdueAmount: '₹ 85,000' },
];

export default function Outstanding() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const columns: Column<OutstandingEntry>[] = [
    { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span> },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const variant = row.type === 'Receivable' ? 'success' : 'warning';
        return <Badge variant={variant}>{row.type}</Badge>;
      },
    },
    { key: 'pendingBills', label: 'Pending Bills', render: (row) => <span className="text-slate-600">{row.pendingBills}</span> },
    { key: 'totalAmount', label: 'Total Outstanding', render: (row) => <span className="font-bold text-slate-800">{row.totalAmount}</span> },
    { key: 'overdueAmount', label: 'Overdue Amount', render: (row) => <span className={row.overdueAmount !== '₹ 0' ? 'text-rose-600 font-semibold' : 'text-slate-500'}>{row.overdueAmount}</span> },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1">View Details</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.partyName.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outstanding Tracking"
        subtitle="Track accounts receivable and accounts payable."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between">
            <div>
                <p className="text-emerald-700 font-medium mb-1">Total Receivables</p>
                <h3 className="text-3xl font-bold text-emerald-900">₹ 14,50,000</h3>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                <IndianRupee className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-center justify-between">
            <div>
                <p className="text-rose-700 font-medium mb-1">Total Payables</p>
                <h3 className="text-3xl font-bold text-rose-900">₹ 8,20,000</h3>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-600 shadow-sm">
                <IndianRupee className="w-6 h-6" />
            </div>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search party name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Receivable', value: 'Receivable' },
            { label: 'Payable', value: 'Payable' },
          ]}
          placeholder="All Types"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No outstanding balances found."
        />
      </TableCard>
    </div>
  );
}
