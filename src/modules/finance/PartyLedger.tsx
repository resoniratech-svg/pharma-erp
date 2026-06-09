import { useState } from 'react';
import { Download } from 'lucide-react';
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
  particulars: string;
  vchType: string;
  vchNo: string;
  debit: string;
  credit: string;
  balance: string;
}

const mockData: LedgerEntry[] = [
  { id: '1', date: '01-Oct-2026', particulars: 'Opening Balance', vchType: '-', vchNo: '-', debit: '₹ 45,000.00', credit: '-', balance: '₹ 45,000.00 Dr' },
  { id: '2', date: '15-Oct-2026', particulars: 'Sales (Apollo Pharmacy)', vchType: 'Sales', vchNo: 'INV/26/001', debit: '₹ 50,400.00', credit: '-', balance: '₹ 95,400.00 Dr' },
  { id: '3', date: '18-Oct-2026', particulars: 'Bank Receipt (NEFT)', vchType: 'Receipt', vchNo: 'RCT/26/105', debit: '-', credit: '₹ 45,000.00', balance: '₹ 50,400.00 Dr' },
];

export default function PartyLedger() {
  const [search, setSearch] = useState('');
  const [party, setParty] = useState('apollo');

  const columns: Column<LedgerEntry>[] = [
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'particulars', label: 'Particulars', render: (row) => <span className="font-medium text-slate-900">{row.particulars}</span> },
    { key: 'vchType', label: 'Vch Type' },
    { key: 'vchNo', label: 'Vch No.' },
    { key: 'debit', label: 'Debit', render: (row) => <span className="text-rose-600">{row.debit}</span> },
    { key: 'credit', label: 'Credit', render: (row) => <span className="text-emerald-600">{row.credit}</span> },
    { key: 'balance', label: 'Balance', render: (row) => <span className="font-bold text-slate-800">{row.balance}</span> },
  ];

  const filteredData = mockData.filter((item) => {
    return item.particulars.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Party Ledger"
        subtitle="Statement of account for customers, suppliers, and distributors."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export PDF</ActionButton>
        }
      />

      <FilterBar>
        <SelectFilter
          value={party}
          onChange={setParty}
          options={[
            { label: 'Apollo Pharmacy', value: 'apollo' },
            { label: 'Metro Distributors', value: 'metro' },
            { label: 'Global Health', value: 'global' },
          ]}
          placeholder="Select Party"
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SearchInput value={search} onChange={setSearch} placeholder="Search particulars..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No ledger entries found."
        />
      </TableCard>
    </div>
  );
}
