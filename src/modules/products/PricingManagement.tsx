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

interface Pricing {
  id: string;
  productCode: string;
  productName: string;
  mrp: string;
  pts: string;
  ptr: string;
  margin: string;
  status: 'Active' | 'Pending Review';
}

const mockData: Pricing[] = [
  { id: '1', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', mrp: '₹ 150.00', pts: '₹ 105.00', ptr: '₹ 120.00', margin: '15%', status: 'Active' },
  { id: '2', productCode: 'PRD-002', productName: 'Paracetamol 650mg', mrp: '₹ 45.00', pts: '₹ 32.00', ptr: '₹ 38.00', margin: '12%', status: 'Active' },
  { id: '3', productCode: 'PRD-003', productName: 'Cough Syrup 100ml', mrp: '₹ 85.00', pts: '₹ 60.00', ptr: '₹ 72.00', margin: '18%', status: 'Pending Review' },
  { id: '4', productCode: 'PRD-004', productName: 'Vitamin C 1000mg', mrp: '₹ 120.00', pts: '₹ 85.00', ptr: '₹ 100.00', margin: '15%', status: 'Active' },
  { id: '5', productCode: 'PRD-005', productName: 'Ibuprofen 400mg', mrp: '₹ 65.00', pts: '₹ 45.00', ptr: '₹ 55.00', margin: '14%', status: 'Active' },
];

export default function PricingManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null);

  const columns: Column<Pricing>[] = [
    { key: 'productCode', label: 'Code' },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'mrp', label: 'MRP' },
    { key: 'pts', label: 'PTS (To Stockist)' },
    { key: 'ptr', label: 'PTR (To Retailer)' },
    { key: 'margin', label: 'Margin' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.productCode.toLowerCase().includes(search.toLowerCase()) || item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="PTR / PTS / PTD Pricing"
        subtitle="Manage MRP, PTS, PTR, and product margins."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Update Pricing</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
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
            { label: 'Pending Review', value: 'Pending Review' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedPricing(row)}
          emptyMessage="No pricing records found."
        />
      </TableCard>

      <Drawer
        open={!!selectedPricing}
        onClose={() => setSelectedPricing(null)}
        title="Pricing Details"
      >
        {selectedPricing && (
          <div className="space-y-2">
            <DrawerField label="Product Code" value={selectedPricing.productCode} />
            <DrawerField label="Product Name" value={selectedPricing.productName} />
            <DrawerField label="MRP (Maximum Retail Price)" value={selectedPricing.mrp} />
            <DrawerField label="PTS (Price to Stockist)" value={selectedPricing.pts} />
            <DrawerField label="PTR (Price to Retailer)" value={selectedPricing.ptr} />
            <DrawerField label="Margin" value={selectedPricing.margin} />
            <DrawerField
              label="Status"
              value={
                <Badge variant={selectedPricing.status === 'Active' ? 'success' : 'warning'}>
                  {selectedPricing.status}
                </Badge>
              }
            />
             <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
              <ActionButton className="flex-1">Edit Pricing</ActionButton>
              <ActionButton variant="secondary" onClick={() => setSelectedPricing(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
