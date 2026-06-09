import { useState } from 'react';
import { Download, Filter, Layers, CheckCircle2, AlertTriangle, Box } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
} from './components/shared';
import { type Column } from './components/shared';

interface BatchItem {
  id: string;
  batchNo: string;
  productName: string;
  mfgDate: string;
  expiryDate: string;
  availableQty: number;
  warehouse: string;
  status: 'Active' | 'Near Expiry' | 'Expired';
}

const mockData: BatchItem[] = [
  { id: '1', batchNo: 'B-2024-001', productName: 'Amoxicillin 500mg', mfgDate: '10 Jan 2024', expiryDate: '10 Jan 2026', availableQty: 5000, warehouse: 'Main Hub', status: 'Active' },
  { id: '2', batchNo: 'B-2023-089', productName: 'Paracetamol 650mg', mfgDate: '15 Aug 2023', expiryDate: '15 Aug 2025', availableQty: 1200, warehouse: 'North Zone', status: 'Active' },
  { id: '3', batchNo: 'B-2022-045', productName: 'Cough Syrup 100ml', mfgDate: '01 May 2022', expiryDate: '01 May 2024', availableQty: 50, warehouse: 'South Zone', status: 'Near Expiry' },
  { id: '4', batchNo: 'B-2021-012', productName: 'Vitamin C 1000mg', mfgDate: '20 Feb 2021', expiryDate: '20 Feb 2023', availableQty: 0, warehouse: 'Main Hub', status: 'Expired' },
];

export default function BatchWiseStockTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<BatchItem>[] = [
    { key: 'batchNo', label: 'Batch No', render: (row) => <span className="font-semibold text-slate-900">{row.batchNo}</span> },
    { key: 'productName', label: 'Product Name' },
    { key: 'mfgDate', label: 'MFG Date' },
    { key: 'expiryDate', label: 'Expiry Date' },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-mono text-slate-700">{row.availableQty}</span> },
    { key: 'warehouse', label: 'Warehouse' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Near Expiry' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || item.batchNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Batch-wise Stock Tracking"
        subtitle="Track inventory by batch number, manufacturing date, expiry date, quantity, and stock movement."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Data</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Batches"
          value="1,245"
          subtitle="Across all products"
          icon={<Layers className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Active Batches"
          value="1,120"
          subtitle="Healthy stock"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Near Expiry Batches"
          value="85"
          subtitle="Requires attention"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Batch Availability"
          value="92%"
          subtitle="Current fill rate"
          icon={<Box className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

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
            { label: 'Active', value: 'Active' },
            { label: 'Near Expiry', value: 'Near Expiry' },
            { label: 'Expired', value: 'Expired' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No batches found."
        />
      </TableCard>
    </div>
  );
}
