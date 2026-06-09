import { useState } from 'react';
import { Download, Filter, PackageSearch, PackageCheck, Tags, AlertCircle } from 'lucide-react';
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

interface CatalogItem {
  id: string;
  productCode: string;
  productName: string;
  company: string;
  category: string;
  packType: string;
  mrp: string;
  ptr: string;
  availableStock: number;
  schemeAvailable: string;
  status: 'Available' | 'Low Stock' | 'Out Of Stock';
}

const mockData: CatalogItem[] = [
  { id: '1', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', company: 'PharmaCorp', category: 'Antibiotics', packType: '10x10 Tablets', mrp: '₹ 150.00', ptr: '₹ 110.00', availableStock: 5000, schemeAvailable: '10+1 Free', status: 'Available' },
  { id: '2', productCode: 'PRD-002', productName: 'Paracetamol 650mg', company: 'HealthPlus', category: 'Analgesics', packType: '15x10 Tablets', mrp: '₹ 60.00', ptr: '₹ 45.00', availableStock: 250, schemeAvailable: 'No Scheme', status: 'Low Stock' },
  { id: '3', productCode: 'PRD-003', productName: 'Vitamin C 1000mg', company: 'VitaLife', category: 'Vitamins', packType: '20 Tablets Tube', mrp: '₹ 250.00', ptr: '₹ 180.00', availableStock: 1200, schemeAvailable: '5% Off', status: 'Available' },
  { id: '4', productCode: 'PRD-004', productName: 'Cough Syrup 100ml', company: 'MediCare', category: 'Respiratory', packType: '100ml Bottle', mrp: '₹ 85.00', ptr: '₹ 65.00', availableStock: 0, schemeAvailable: 'No Scheme', status: 'Out Of Stock' },
];

export default function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<CatalogItem>[] = [
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-semibold text-slate-900">{row.productCode}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'company', label: 'Company' },
    { key: 'category', label: 'Category' },
    { key: 'packType', label: 'Pack Type' },
    { key: 'mrp', label: 'MRP', render: (row) => <span className="text-slate-800">{row.mrp}</span> },
    { key: 'ptr', label: 'PTR', render: (row) => <span className="font-bold text-slate-800">{row.ptr}</span> },
    { key: 'availableStock', label: 'Available Stock', render: (row) => <span className="font-mono text-slate-700">{row.availableStock}</span> },
    { key: 'schemeAvailable', label: 'Scheme Available', render: (row) => <span className="text-emerald-600 font-medium">{row.schemeAvailable}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Available' ? 'success' : row.status === 'Low Stock' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || 
                        item.productCode.toLowerCase().includes(search.toLowerCase()) ||
                        item.company.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Catalog Access"
        subtitle="Browse available products, pricing, schemes, stock availability, and product information."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Catalog</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Products"
          value="450"
          subtitle="In catalog"
          icon={<PackageSearch className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Available Products"
          value="412"
          subtitle="In stock"
          icon={<PackageCheck className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Active Schemes"
          value="85"
          subtitle="Products with offers"
          icon={<Tags className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Low Stock Products"
          value="24"
          subtitle="Requires attention"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, or company..." />
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
            { label: 'Low Stock', value: 'Low Stock' },
            { label: 'Out Of Stock', value: 'Out Of Stock' },
          ]}
          placeholder="Availability Status"
        />
        {/* Additional filters like Category, Company, Product Type can be added here */}
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No products found in the catalog."
        />
      </TableCard>
    </div>
  );
}
