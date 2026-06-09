import { useState } from 'react';
import { Download, Calculator } from 'lucide-react';
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

interface CommissionEntry {
  id: string;
  repName: string;
  month: string;
  salesAchieved: string;
  commissionRate: string;
  amount: string;
  status: 'Paid' | 'Pending Calculation' | 'Approved';
}

const mockData: CommissionEntry[] = [
  { id: '1', repName: 'Rahul Verma', month: 'Oct 2026', salesAchieved: '₹ 8,45,000', commissionRate: '2.5%', amount: '₹ 21,125', status: 'Pending Calculation' },
  { id: '2', repName: 'Amit Singh', month: 'Sep 2026', salesAchieved: '₹ 12,00,000', commissionRate: '3.0%', amount: '₹ 36,000', status: 'Paid' },
];

export default function Commission() {
  const [search, setSearch] = useState('');

  const columns: Column<CommissionEntry>[] = [
    { key: 'repName', label: 'Rep Name', render: (row) => <span className="font-semibold text-slate-900">{row.repName}</span> },
    { key: 'month', label: 'Month' },
    { key: 'salesAchieved', label: 'Sales Achieved' },
    { key: 'commissionRate', label: 'Rate' },
    { key: 'amount', label: 'Commission Amt', render: (row) => <span className="font-bold text-violet-700">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Paid' ? 'success' : row.status === 'Approved' ? 'info' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: (row) => row.status === 'Pending Calculation' ? <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><Calculator className="w-4 h-4 mr-1" /> Calculate</ActionButton> : <span className="text-slate-300">-</span>
    }
  ];

  const filteredData = mockData.filter((item) => {
    return item.repName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Commission System"
        subtitle="Calculate and manage sales commissions for Medical Representatives."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Data</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search rep name..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No commission records found."
        />
      </TableCard>
    </div>
  );
}
