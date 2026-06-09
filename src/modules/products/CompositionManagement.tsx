import { useState } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Drawer,
  DrawerField,
  Badge,
} from './components/shared';
import { type Column } from './types';

interface Composition {
  id: string;
  genericName: string;
  strength: string;
  therapeuticClass: string;
  schedule: string;
  associatedProducts: number;
}

const mockData: Composition[] = [
  { id: '1', genericName: 'Amoxicillin Trihydrate', strength: '500mg', therapeuticClass: 'Antibiotic (Penicillin)', schedule: 'Schedule H', associatedProducts: 12 },
  { id: '2', genericName: 'Paracetamol', strength: '650mg', therapeuticClass: 'Analgesic & Antipyretic', schedule: 'OTC', associatedProducts: 45 },
  { id: '3', genericName: 'Ibuprofen', strength: '400mg', therapeuticClass: 'NSAID', schedule: 'OTC', associatedProducts: 28 },
  { id: '4', genericName: 'Cetirizine Hydrochloride', strength: '10mg', therapeuticClass: 'Antihistamine', schedule: 'Schedule H', associatedProducts: 8 },
  { id: '5', genericName: 'Vitamin C (Ascorbic Acid)', strength: '1000mg', therapeuticClass: 'Vitamin Supplement', schedule: 'OTC', associatedProducts: 15 },
];

export default function CompositionManagement() {
  const [search, setSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [selectedComp, setSelectedComp] = useState<Composition | null>(null);

  const columns: Column<Composition>[] = [
    { key: 'genericName', label: 'Generic Name', render: (row) => <span className="font-semibold text-slate-900">{row.genericName}</span> },
    { key: 'strength', label: 'Strength' },
    { key: 'therapeuticClass', label: 'Therapeutic Class' },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (row) => {
        const variant = row.schedule === 'OTC' ? 'success' : row.schedule === 'Schedule H' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.schedule}</Badge>;
      },
    },
    { key: 'associatedProducts', label: 'Linked Products', render: (row) => <span className="text-violet-600 font-medium">{row.associatedProducts} Products</span> },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.genericName.toLowerCase().includes(search.toLowerCase()) || item.therapeuticClass.toLowerCase().includes(search.toLowerCase());
    const matchSchedule = scheduleFilter ? item.schedule === scheduleFilter : true;
    return matchSearch && matchSchedule;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Composition Management"
        subtitle="Manage generic formulas, strengths, and drug schedules."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Composition</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search formula or class..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={scheduleFilter}
          onChange={setScheduleFilter}
          options={[
            { label: 'OTC', value: 'OTC' },
            { label: 'Schedule H', value: 'Schedule H' },
            { label: 'Schedule X', value: 'Schedule X' },
          ]}
          placeholder="All Schedules"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedComp(row)}
          emptyMessage="No compositions found."
        />
      </TableCard>

      <Drawer
        open={!!selectedComp}
        onClose={() => setSelectedComp(null)}
        title="Composition Details"
      >
        {selectedComp && (
          <div className="space-y-2">
            <DrawerField label="Generic Name" value={selectedComp.genericName} />
            <DrawerField label="Standard Strength" value={selectedComp.strength} />
            <DrawerField label="Therapeutic Class" value={selectedComp.therapeuticClass} />
            <DrawerField label="Drug Schedule" value={
              <Badge variant={selectedComp.schedule === 'OTC' ? 'success' : selectedComp.schedule === 'Schedule H' ? 'warning' : 'danger'}>
                {selectedComp.schedule}
              </Badge>
            } />
            <DrawerField label="Associated Products" value={`${selectedComp.associatedProducts} Active Products`} />
             <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
              <ActionButton className="flex-1">Edit Formula</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedComp(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
