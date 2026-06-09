import { useState } from 'react';
import { Download, Filter, Building2, IndianRupee, PackageCheck, Bookmark } from 'lucide-react';
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

interface CompanyStockItem {
  id: string;
  companyName: string;
  productCount: number;
  availableQty: number;
  stockValue: string;
  warehouses: number;
  status: 'Active' | 'Inactive';
}

const mockData: CompanyStockItem[] = [
  { id: '1', companyName: 'PharmaCorp Inc.', productCount: 45, availableQty: 154000, stockValue: '₹ 1.5 Cr', warehouses: 4, status: 'Active' },
  { id: '2', companyName: 'HealthPlus Labs', productCount: 22, availableQty: 45000, stockValue: '₹ 45 L', warehouses: 2, status: 'Active' },
  { id: '3', companyName: 'MediCare Pharma', productCount: 8, availableQty: 12000, stockValue: '₹ 12 L', warehouses: 1, status: 'Active' },
  { id: '4', companyName: 'VitaLife Sciences', productCount: 3, availableQty: 0, stockValue: '₹ 0', warehouses: 0, status: 'Inactive' },
];

export default function CompanyWiseInventoryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<CompanyStockItem>[] = [
    { key: 'companyName', label: 'Company Name', render: (row) => <span className="font-semibold text-slate-900">{row.companyName}</span> },
    { key: 'productCount', label: 'Product Count', render: (row) => <span className="font-mono text-slate-700">{row.productCount}</span> },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-mono text-slate-700">{row.availableQty}</span> },
    { key: 'stockValue', label: 'Stock Value', render: (row) => <span className="font-bold text-slate-800">{row.stockValue}</span> },
    { key: 'warehouses', label: 'Warehouses', render: (row) => <span className="text-slate-700">{row.warehouses} locations</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Company-wise Inventory Tracking"
        subtitle="Monitor inventory company-wise across all products, warehouses, and stock locations."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Companies"
          value="48"
          subtitle="Active suppliers"
          icon={<Building2 className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Total Stock Value"
          value="₹ 4.2 Cr"
          subtitle="Across all companies"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Available Stock"
          value="345k"
          subtitle="Units ready for dispatch"
          icon={<PackageCheck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Reserved Stock"
          value="42k"
          subtitle="Units locked in orders"
          icon={<Bookmark className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search companies..." />
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
          emptyMessage="No companies found."
        />
      </TableCard>
    </div>
  );
}
