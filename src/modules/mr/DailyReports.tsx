import { useState } from 'react';
import { Download, Filter, FileText } from 'lucide-react';
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

interface DCR {
  id: string;
  date: string;
  repName: string;
  area: string;
  doctorsVisited: number;
  chemistsVisited: number;
  status: 'Submitted' | 'Draft' | 'Approved';
}

const mockData: DCR[] = [
  { id: '1', date: '15-Oct-2026', repName: 'Rahul Verma', area: 'Andheri West', doctorsVisited: 12, chemistsVisited: 8, status: 'Submitted' },
  { id: '2', date: '14-Oct-2026', repName: 'Rahul Verma', area: 'Bandra', doctorsVisited: 10, chemistsVisited: 5, status: 'Approved' },
  { id: '3', date: '16-Oct-2026', repName: 'Rahul Verma', area: 'Juhu', doctorsVisited: 0, chemistsVisited: 0, status: 'Draft' },
];

export default function DailyReports() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<DCR>[] = [
    { key: 'date', label: 'Report Date', render: (row) => <span className="font-semibold text-slate-900">{row.date}</span> },
    { key: 'repName', label: 'Rep Name' },
    { key: 'area', label: 'Work Area' },
    { key: 'doctorsVisited', label: 'Doc Calls', render: (row) => <span className="font-medium text-slate-600">{row.doctorsVisited}</span> },
    { key: 'chemistsVisited', label: 'Chemist Calls', render: (row) => <span className="font-medium text-slate-600">{row.chemistsVisited}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Approved' ? 'success' : row.status === 'Submitted' ? 'info' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><FileText className="w-4 h-4" /></ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.area.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Daily Reporting"
        subtitle="Submit and review daily field force activities and visit logs."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Reports</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search area..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Submitted', value: 'Submitted' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Approved', value: 'Approved' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No reports found."
        />
      </TableCard>
    </div>
  );
}
