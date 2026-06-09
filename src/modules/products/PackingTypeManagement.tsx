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

interface PackingType {
  id: string;
  name: string;
  code: string;
  uom: string; // Unit of measure
  description: string;
  status: 'Active' | 'Inactive';
}

const mockData: PackingType[] = [
  { id: '1', name: 'Alu-Alu Blister', code: 'BLS-ALU', uom: 'Strips', description: 'Double aluminum foil blister pack', status: 'Active' },
  { id: '2', name: 'PET Bottle', code: 'BTL-PET', uom: 'Bottles', description: '100ml amber PET bottle with measuring cap', status: 'Active' },
  { id: '3', name: 'Glass Vial', code: 'VIL-GLS', uom: 'Vials', description: '10ml clear glass vial for injectables', status: 'Active' },
  { id: '4', name: 'Sachet', code: 'SAC-FOIL', uom: 'Sachets', description: '5g foil sachet for powders', status: 'Inactive' },
];

export default function PackingTypeManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPacking, setSelectedPacking] = useState<PackingType | null>(null);

  const columns: Column<PackingType>[] = [
    { key: 'name', label: 'Packing Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'uom', label: 'Unit of Measure', render: (row) => <Badge variant="purple">{row.uom}</Badge> },
    { key: 'description', label: 'Description', render: (row) => <span className="text-slate-500">{row.description}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Packing Type Management"
        subtitle="Manage product packaging materials and units of measure."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Packing Type</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search packing or code..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedPacking(row)}
          emptyMessage="No packing types found."
        />
      </TableCard>

      <Drawer
        open={!!selectedPacking}
        onClose={() => setSelectedPacking(null)}
        title="Packing Details"
      >
        {selectedPacking && (
          <div className="space-y-2">
            <DrawerField label="Packing Name" value={selectedPacking.name} />
            <DrawerField label="Code" value={selectedPacking.code} />
            <DrawerField label="Unit of Measure" value={<Badge variant="purple">{selectedPacking.uom}</Badge>} />
            <DrawerField label="Description" value={selectedPacking.description} />
            <DrawerField
              label="Status"
              value={
                <Badge variant={selectedPacking.status === 'Active' ? 'success' : 'neutral'}>
                  {selectedPacking.status}
                </Badge>
              }
            />
             <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
              <ActionButton className="flex-1">Edit Packing</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedPacking(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
