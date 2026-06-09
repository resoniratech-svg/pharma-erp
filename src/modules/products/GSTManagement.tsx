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

interface GST {
  id: string;
  hsnCode: string;
  description: string;
  sgst: string;
  cgst: string;
  igst: string;
  totalGst: string;
  status: 'Active' | 'Inactive';
}

const mockData: GST[] = [
  { id: '1', hsnCode: '30049099', description: 'Medicaments consisting of mixed or unmixed products', sgst: '6%', cgst: '6%', igst: '12%', totalGst: '12%', status: 'Active' },
  { id: '2', hsnCode: '30041010', description: 'Penicillins or derivatives thereof', sgst: '6%', cgst: '6%', igst: '12%', totalGst: '12%', status: 'Active' },
  { id: '3', hsnCode: '30022011', description: 'Vaccines for human medicine', sgst: '2.5%', cgst: '2.5%', igst: '5%', totalGst: '5%', status: 'Active' },
  { id: '4', hsnCode: '30061010', description: 'Sterile surgical catgut', sgst: '6%', cgst: '6%', igst: '12%', totalGst: '12%', status: 'Inactive' },
];

export default function GSTManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGST, setSelectedGST] = useState<GST | null>(null);

  const columns: Column<GST>[] = [
    { key: 'hsnCode', label: 'HSN Code', render: (row) => <span className="font-semibold text-slate-900">{row.hsnCode}</span> },
    { key: 'description', label: 'Description', render: (row) => <span className="max-w-xs truncate block">{row.description}</span> },
    { key: 'sgst', label: 'SGST' },
    { key: 'cgst', label: 'CGST' },
    { key: 'igst', label: 'IGST' },
    { key: 'totalGst', label: 'Total GST', render: (row) => <span className="font-bold text-slate-800">{row.totalGst}</span> },
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
    const matchSearch = item.hsnCode.includes(search) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GST Management"
        subtitle="Manage HSN codes and GST taxation rates."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add HSN Code</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by HSN or description..." />
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
          onRowClick={(row) => setSelectedGST(row)}
          emptyMessage="No GST records found."
        />
      </TableCard>

      <Drawer
        open={!!selectedGST}
        onClose={() => setSelectedGST(null)}
        title="GST Details"
      >
        {selectedGST && (
          <div className="space-y-2">
            <DrawerField label="HSN Code" value={selectedGST.hsnCode} />
            <DrawerField label="Description" value={selectedGST.description} />
            <DrawerField label="SGST Rate" value={selectedGST.sgst} />
            <DrawerField label="CGST Rate" value={selectedGST.cgst} />
            <DrawerField label="IGST Rate" value={selectedGST.igst} />
            <DrawerField label="Total GST" value={selectedGST.totalGst} />
            <DrawerField
              label="Status"
              value={
                <Badge variant={selectedGST.status === 'Active' ? 'success' : 'neutral'}>
                  {selectedGST.status}
                </Badge>
              }
            />
             <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
              <ActionButton className="flex-1">Edit Rates</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedGST(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
