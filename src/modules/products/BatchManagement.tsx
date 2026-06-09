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

interface Batch {
  id: string;
  batchNo: string;
  productName: string;
  mfgDate: string;
  expDate: string;
  qty: number;
  status: 'Available' | 'Expired' | 'Quarantine' | 'Nearing Expiry';
}

const mockData: Batch[] = [
  { id: '1', batchNo: 'B-2026-001', productName: 'Amoxicillin 500mg', mfgDate: '10-Jan-2026', expDate: '09-Jan-2028', qty: 5000, status: 'Available' },
  { id: '2', batchNo: 'B-2025-890', productName: 'Paracetamol 650mg', mfgDate: '15-Dec-2025', expDate: '14-Dec-2027', qty: 12000, status: 'Available' },
  { id: '3', batchNo: 'B-2023-112', productName: 'Cough Syrup 100ml', mfgDate: '01-Nov-2023', expDate: '31-Oct-2025', qty: 0, status: 'Expired' },
  { id: '4', batchNo: 'B-2026-045', productName: 'Vitamin C 1000mg', mfgDate: '20-Feb-2026', expDate: '19-Feb-2027', qty: 1500, status: 'Quarantine' },
  { id: '5', batchNo: 'B-2024-331', productName: 'Ibuprofen 400mg', mfgDate: '10-Jul-2024', expDate: '09-Jul-2026', qty: 800, status: 'Nearing Expiry' },
];

export default function BatchManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const columns: Column<Batch>[] = [
    { key: 'batchNo', label: 'Batch No' },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'mfgDate', label: 'Mfg Date' },
    { key: 'expDate', label: 'Exp Date' },
    { key: 'qty', label: 'Quantity' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant =
          row.status === 'Available' ? 'success' :
          row.status === 'Expired' ? 'danger' :
          row.status === 'Quarantine' ? 'neutral' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.batchNo.toLowerCase().includes(search.toLowerCase()) || item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Batch Management"
        subtitle="Track batches, expiry dates, and quarantine status."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>New Batch</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by batch or product..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Available', value: 'Available' },
            { label: 'Expired', value: 'Expired' },
            { label: 'Quarantine', value: 'Quarantine' },
            { label: 'Nearing Expiry', value: 'Nearing Expiry' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedBatch(row)}
          emptyMessage="No batches found matching your criteria."
        />
      </TableCard>

      <Drawer
        open={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title="Batch Details"
      >
        {selectedBatch && (
          <div className="space-y-2">
            <DrawerField label="Batch Number" value={selectedBatch.batchNo} />
            <DrawerField label="Product Name" value={selectedBatch.productName} />
            <DrawerField label="Manufacturing Date" value={selectedBatch.mfgDate} />
            <DrawerField label="Expiry Date" value={selectedBatch.expDate} />
            <DrawerField label="Current Quantity" value={selectedBatch.qty} />
            <DrawerField
              label="Status"
              value={
                <Badge
                  variant={
                    selectedBatch.status === 'Available' ? 'success' :
                    selectedBatch.status === 'Expired' ? 'danger' :
                    selectedBatch.status === 'Quarantine' ? 'neutral' : 'warning'
                  }
                >
                  {selectedBatch.status}
                </Badge>
              }
            />
             <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
              <ActionButton className="flex-1">Update Batch</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedBatch(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
