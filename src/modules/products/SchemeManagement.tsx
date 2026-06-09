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

interface Scheme {
  id: string;
  schemeCode: string;
  name: string;
  type: string;
  validFrom: string;
  validTo: string;
  status: 'Active' | 'Upcoming' | 'Expired';
}

const mockData: Scheme[] = [
  { id: '1', schemeCode: 'SCH-10+1', name: 'Buy 10 Get 1 Free', type: 'Quantity Discount', validFrom: '01-Nov-2025', validTo: '31-Dec-2025', status: 'Active' },
  { id: '2', schemeCode: 'SCH-FLAT-5', name: 'Flat 5% Off PTR', type: 'Cash Discount', validFrom: '15-Oct-2025', validTo: '30-Nov-2025', status: 'Active' },
  { id: '3', schemeCode: 'SCH-WINTER', name: 'Winter Stock Up', type: 'Seasonal Offer', validFrom: '01-Jan-2026', validTo: '28-Feb-2026', status: 'Upcoming' },
  { id: '4', schemeCode: 'SCH-LAUNCH', name: 'New Launch Promo', type: 'Introductory Offer', validFrom: '01-Sep-2025', validTo: '30-Sep-2025', status: 'Expired' },
];

export default function SchemeManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  const columns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{row.schemeCode}</span> },
    { key: 'name', label: 'Scheme Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'type', label: 'Type' },
    { key: 'validFrom', label: 'Valid From' },
    { key: 'validTo', label: 'Valid To' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Upcoming' ? 'info' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.schemeCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Management"
        subtitle="Manage promotional schemes, discounts, and free goods offers."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Scheme</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search schemes..." />
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
            { label: 'Upcoming', value: 'Upcoming' },
            { label: 'Expired', value: 'Expired' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedScheme(row)}
          emptyMessage="No promotional schemes found."
        />
      </TableCard>

      <Drawer
        open={!!selectedScheme}
        onClose={() => setSelectedScheme(null)}
        title="Scheme Details"
      >
        {selectedScheme && (
          <div className="space-y-2">
            <DrawerField label="Scheme Code" value={<span className="font-mono">{selectedScheme.schemeCode}</span>} />
            <DrawerField label="Scheme Name" value={selectedScheme.name} />
            <DrawerField label="Scheme Type" value={selectedScheme.type} />
            <DrawerField label="Valid From" value={selectedScheme.validFrom} />
            <DrawerField label="Valid To" value={selectedScheme.validTo} />
            <DrawerField
              label="Status"
              value={
                <Badge variant={selectedScheme.status === 'Active' ? 'success' : selectedScheme.status === 'Upcoming' ? 'info' : 'danger'}>
                  {selectedScheme.status}
                </Badge>
              }
            />
             <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
              <ActionButton className="flex-1">Edit Scheme</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedScheme(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
