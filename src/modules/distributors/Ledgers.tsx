import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
} from './components/shared';
import { type Column } from './components/shared';

interface LedgerEntry {
  id: string;
  date: string;
  distributor: string;
  refNo: string;
  type: 'Invoice' | 'Payment' | 'Credit Note';
  debit: string;
  credit: string;
  balance: string;
}

const mockData: LedgerEntry[] = [
  { id: '1', date: '15-Oct-2026', distributor: 'Metro Pharma Distributors', refNo: 'INV-2026-991', type: 'Invoice', debit: '₹ 1,50,000', credit: '-', balance: '₹ 3,60,000 Dr' },
  { id: '2', date: '14-Oct-2026', distributor: 'Metro Pharma Distributors', refNo: 'RCPT-1002', type: 'Payment', debit: '-', credit: '₹ 50,000', balance: '₹ 2,10,000 Dr' },
  { id: '3', date: '10-Oct-2026', distributor: 'Global Health Supply', refNo: 'CN-2026-04', type: 'Credit Note', debit: '-', credit: '₹ 12,000', balance: '₹ 43,000 Dr' },
];

export default function Ledgers() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const columns: Column<LedgerEntry>[] = [
    { key: 'date', label: 'Date' },
    { key: 'distributor', label: 'Distributor', render: (row) => <span className="font-semibold text-slate-900">{row.distributor}</span> },
    { key: 'refNo', label: 'Ref / Voucher' },
    { key: 'type', label: 'Type' },
    { key: 'debit', label: 'Debit (Dr)', render: (row) => <span className="text-slate-800 font-medium">{row.debit}</span> },
    { key: 'credit', label: 'Credit (Cr)', render: (row) => <span className="text-slate-800 font-medium">{row.credit}</span> },
    { key: 'balance', label: 'Running Balance', render: (row) => <span className="font-bold text-violet-700">{row.balance}</span> },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.distributor.toLowerCase().includes(search.toLowerCase()) || item.refNo.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Ledger Access"
        subtitle="Financial account statements and transaction history."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Statement of Account</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search distributor or ref no..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: 'Invoice', value: 'Invoice' },
            { label: 'Payment', value: 'Payment' },
            { label: 'Credit Note', value: 'Credit Note' },
          ]}
          placeholder="All Types"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No ledger transactions found."
        />
      </TableCard>
    </div>
  );
}
