import { useState } from 'react';
import { Plus, Download, Filter, MapPin } from 'lucide-react';
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

interface ChemistVisit {
  id: string;
  chemistName: string;
  location: string;
  date: string;
  stockCheck: string;
  status: 'Completed' | 'Scheduled' | 'Missed';
}

const mockData: ChemistVisit[] = [
  { id: '1', chemistName: 'Apollo Pharmacy', location: 'Downtown Market', date: '15-Oct-2026', stockCheck: 'Yes', status: 'Completed' },
  { id: '2', chemistName: 'MedPlus Store', location: 'Uptown Avenue', date: '16-Oct-2026', stockCheck: 'Pending', status: 'Scheduled' },
  { id: '3', chemistName: 'Wellness Medicos', location: 'Suburbs', date: '14-Oct-2026', stockCheck: 'No', status: 'Missed' },
];

export default function ChemistVisits() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<ChemistVisit>[] = [
    { key: 'chemistName', label: 'Chemist Name', render: (row) => <span className="font-semibold text-slate-900">{row.chemistName}</span> },
    { key: 'location', label: 'Location' },
    { key: 'date', label: 'Date of Visit' },
    { key: 'stockCheck', label: 'RCPA / Stock Check', render: (row) => <span className="text-slate-600">{row.stockCheck}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Completed' ? 'success' : row.status === 'Scheduled' ? 'info' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <button className="text-violet-600 hover:text-violet-700 p-1"><MapPin className="w-4 h-4" /></button>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.chemistName.toLowerCase().includes(search.toLowerCase()) || item.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Chemist Visit Entry"
        subtitle="Log pharmacy visits and Retail Chemist Prescription Audit (RCPA) data."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Log</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Log Visit</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search chemist or location..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Completed', value: 'Completed' },
            { label: 'Scheduled', value: 'Scheduled' },
            { label: 'Missed', value: 'Missed' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No chemist visits found."
        />
      </TableCard>
    </div>
  );
}
