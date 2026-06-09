import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
} from './components/shared';
import { type Column } from './components/shared';

interface AgingEntry {
  id: string;
  partyName: string;
  current: string;
  days30: string;
  days60: string;
  days90: string;
  above90: string;
  total: string;
}

const mockData: AgingEntry[] = [
  { id: '1', partyName: 'Apollo Pharmacy', current: '₹ 50,000', days30: '₹ 45,000', days60: '₹ 0', days90: '₹ 0', above90: '₹ 0', total: '₹ 95,000' },
  { id: '2', partyName: 'Wellness Medicos', current: '₹ 0', days30: '₹ 15,000', days60: '₹ 20,000', days90: '₹ 50,000', above90: '₹ 0', total: '₹ 85,000' },
  { id: '3', partyName: 'Metro Distributors', current: '₹ 1,00,000', days30: '₹ 0', days60: '₹ 0', days90: '₹ 0', above90: '₹ 0', total: '₹ 1,00,000' },
];

export default function AgingReports() {
  const [search, setSearch] = useState('');

  const columns: Column<AgingEntry>[] = [
    { key: 'partyName', label: 'Party Name', render: (row) => <span className="font-semibold text-slate-900">{row.partyName}</span> },
    { key: 'current', label: 'Current (0-30 Days)' },
    { key: 'days30', label: '31-60 Days', render: (row) => <span className="text-amber-600">{row.days30}</span> },
    { key: 'days60', label: '61-90 Days', render: (row) => <span className="text-orange-600">{row.days60}</span> },
    { key: 'days90', label: '91-120 Days', render: (row) => <span className="text-rose-600">{row.days90}</span> },
    { key: 'above90', label: '> 120 Days', render: (row) => <span className="text-rose-700 font-bold">{row.above90}</span> },
    { key: 'total', label: 'Total', render: (row) => <span className="font-bold text-slate-900">{row.total}</span> },
  ];

  const filteredData = mockData.filter((item) => {
    return item.partyName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outstanding Aging"
        subtitle="Breakdown of outstanding balances by time overdue."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Aging</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search party name..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No records found."
        />
      </TableCard>
    </div>
  );
}
