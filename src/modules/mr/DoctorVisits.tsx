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

interface DoctorVisit {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  date: string;
  status: 'Completed' | 'Scheduled' | 'Missed';
}

const mockData: DoctorVisit[] = [
  { id: '1', doctorName: 'Dr. Ramesh Kumar', specialty: 'Cardiologist', clinic: 'Heart Care Center', date: '15-Oct-2026', status: 'Completed' },
  { id: '2', doctorName: 'Dr. Sunita Sharma', specialty: 'Pediatrician', clinic: 'Kids Clinic', date: '16-Oct-2026', status: 'Scheduled' },
  { id: '3', doctorName: 'Dr. Anil Verma', specialty: 'General Physician', clinic: 'City Hospital', date: '14-Oct-2026', status: 'Missed' },
];

export default function DoctorVisits() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<DoctorVisit>[] = [
    { key: 'doctorName', label: 'Doctor Name', render: (row) => <span className="font-semibold text-slate-900">{row.doctorName}</span> },
    { key: 'specialty', label: 'Specialty', render: (row) => <span className="text-slate-600">{row.specialty}</span> },
    { key: 'clinic', label: 'Clinic / Hospital' },
    { key: 'date', label: 'Date of Visit' },
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
    const matchSearch = item.doctorName.toLowerCase().includes(search.toLowerCase()) || item.clinic.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Doctor Visit Entry"
        subtitle="Manage and track scheduled calls and visits to healthcare professionals."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Log</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Log Visit</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search doctor or clinic..." />
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
          emptyMessage="No visits found."
        />
      </TableCard>
    </div>
  );
}
