import { useState } from 'react';
import { Download, AlertTriangle } from 'lucide-react';
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

interface Outstanding {
  id: string;
  distributor: string;
  totalDue: string;
  overdue: string;
  daysAging: number;
  status: 'Clear' | 'Warning' | 'Critical';
}

const mockData: Outstanding[] = [
  { id: '1', distributor: 'Carewell Agencies', totalDue: '₹ 8,45,000', overdue: '₹ 4,20,000', daysAging: 75, status: 'Critical' },
  { id: '2', distributor: 'Metro Pharma Distributors', totalDue: '₹ 2,10,000', overdue: '₹ 50,000', daysAging: 40, status: 'Warning' },
  { id: '3', distributor: 'Global Health Supply', totalDue: '₹ 55,000', overdue: '₹ 0', daysAging: 15, status: 'Clear' },
];

export default function OutstandingTracking() {
  const [search, setSearch] = useState('');

  const columns: Column<Outstanding>[] = [
    { key: 'distributor', label: 'Distributor', render: (row) => <span className="font-semibold text-slate-900">{row.distributor}</span> },
    { key: 'totalDue', label: 'Total Outstanding' },
    { key: 'overdue', label: 'Overdue Amount', render: (row) => <span className={row.overdue !== '₹ 0' ? 'text-rose-600 font-medium' : ''}>{row.overdue}</span> },
    { key: 'daysAging', label: 'Max Aging (Days)', render: (row) => `${row.daysAging} Days` },
    {
      key: 'status',
      label: 'Credit Status',
      render: (row) => {
        const variant = row.status === 'Clear' ? 'success' : row.status === 'Warning' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs">Send Reminder</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    return item.distributor.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Outstanding & Receivables"
        subtitle="Track distributor payments, aging reports, and credit limits."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Aging Report</ActionButton>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-800">Payment Collection Alert</h3>
          <p className="text-sm text-amber-700 mt-1">₹ 4,70,000 is currently overdue by more than 30 days across all distributors.</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search distributor..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No outstanding records found."
        />
      </TableCard>
    </div>
  );
}
