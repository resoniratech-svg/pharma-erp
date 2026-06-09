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

interface Barcode {
  id: string;
  barcode: string;
  productCode: string;
  productName: string;
  type: string;
  assignedDate: string;
  status: 'Active' | 'Unassigned';
}

const mockData: Barcode[] = [
  { id: '1', barcode: '8901234567890', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', type: 'EAN-13', assignedDate: '10-Oct-2025', status: 'Active' },
  { id: '2', barcode: '8901234567891', productCode: 'PRD-002', productName: 'Paracetamol 650mg', type: 'EAN-13', assignedDate: '12-Oct-2025', status: 'Active' },
  { id: '3', barcode: '8901234567892', productCode: '-', productName: '-', type: 'EAN-13', assignedDate: '-', status: 'Unassigned' },
  { id: '4', barcode: '8901234567893', productCode: 'PRD-004', productName: 'Vitamin C 1000mg', type: 'UPC-A', assignedDate: '15-Oct-2025', status: 'Active' },
];

export default function BarcodeManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);

  const columns: Column<Barcode>[] = [
    { key: 'barcode', label: 'Barcode', render: (row) => <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{row.barcode}</span> },
    { key: 'productName', label: 'Assigned Product', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'type', label: 'Type' },
    { key: 'assignedDate', label: 'Assigned Date' },
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
    const matchSearch = item.barcode.includes(search) || item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Barcode Management"
        subtitle="Manage product barcodes, EAN/UPC mapping, and generation."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Generate Barcode</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search barcode or product..." />
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
            { label: 'Unassigned', value: 'Unassigned' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedBarcode(row)}
          emptyMessage="No barcodes found."
        />
      </TableCard>

      <Drawer
        open={!!selectedBarcode}
        onClose={() => setSelectedBarcode(null)}
        title="Barcode Details"
      >
        {selectedBarcode && (
          <div className="space-y-2">
            <DrawerField label="Barcode Number" value={selectedBarcode.barcode} />
            <DrawerField label="Barcode Type" value={selectedBarcode.type} />
            <DrawerField label="Product Code" value={selectedBarcode.productCode} />
            <DrawerField label="Product Name" value={selectedBarcode.productName} />
            <DrawerField label="Assigned Date" value={selectedBarcode.assignedDate} />
            <DrawerField
              label="Status"
              value={
                <Badge variant={selectedBarcode.status === 'Active' ? 'success' : 'neutral'}>
                  {selectedBarcode.status}
                </Badge>
              }
            />
             <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
              <ActionButton className="flex-1">{selectedBarcode.status === 'Active' ? 'Reassign' : 'Assign Product'}</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedBarcode(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
