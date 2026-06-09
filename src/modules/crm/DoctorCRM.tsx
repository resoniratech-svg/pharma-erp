import { useState } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
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

interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  class: 'Class A' | 'Class B' | 'Class C';
  hospital: string;
  lastVisit: string;
}

const mockData: DoctorProfile[] = [
  { id: '1', name: 'Dr. Arvind Rao', specialty: 'Cardiology', class: 'Class A', hospital: 'Apollo Hospitals', lastVisit: '20-Oct-2026' },
  { id: '2', name: 'Dr. Sunita Sharma', specialty: 'Pediatrics', class: 'Class B', hospital: 'Kids Clinic', lastVisit: '15-Oct-2026' },
];

export default function DoctorCRM() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const columns: Column<DoctorProfile>[] = [
    { key: 'name', label: 'Doctor Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'specialty', label: 'Specialty' },
    { key: 'hospital', label: 'Primary Affiliation' },
    {
      key: 'class',
      label: 'Classification',
      render: (row) => {
        const variant = row.class === 'Class A' ? 'purple' : row.class === 'Class B' ? 'info' : 'neutral';
        return <Badge variant={variant}>{row.class}</Badge>;
      },
    },
    { key: 'lastVisit', label: 'Last Visit Date' },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><Stethoscope className="w-4 h-4 mr-1" /> Profile</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter ? item.class === classFilter : true;
    return matchSearch && matchClass;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Doctor/Hospital CRM"
        subtitle="Manage detailed profiles, classifications, and engagement history for Key Opinion Leaders (KOLs)."
        actions={
          <ActionButton icon={<Plus className="w-4 h-4" />}>Add Doctor</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search doctors..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={classFilter}
          onChange={setClassFilter}
          options={[
            { label: 'Class A (High Priority)', value: 'Class A' },
            { label: 'Class B', value: 'Class B' },
            { label: 'Class C', value: 'Class C' },
          ]}
          placeholder="All Classes"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No doctor profiles found."
        />
      </TableCard>
    </div>
  );
}
