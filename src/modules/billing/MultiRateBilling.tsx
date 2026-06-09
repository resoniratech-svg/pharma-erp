import { useState } from 'react';
import { Download, Filter, Receipt, FileText, FileSpreadsheet, PieChart, TrendingUp, Layers } from 'lucide-react';
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

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  productCount: number;
  taxableAmount: string;
  gstRate: string; // 'Mixed', '12%', '18%', etc.
  gstAmount: string;
  netAmount: string;
  invoiceDate: string;
  status: 'Draft' | 'Generated' | 'Approved' | 'Cancelled';
}

const mockInvoices: InvoiceItem[] = [
  { id: '1', invoiceNo: 'INV-2024-001', customerName: 'Apollo Pharmacy', productCount: 15, taxableAmount: '₹ 45,000', gstRate: 'Mixed (5%, 12%)', gstAmount: '₹ 4,500', netAmount: '₹ 49,500', invoiceDate: '24-Oct-2024', status: 'Approved' },
  { id: '2', invoiceNo: 'INV-2024-002', customerName: 'Care Hospitals', productCount: 8, taxableAmount: '₹ 12,500', gstRate: 'Mixed (12%, 18%)', gstAmount: '₹ 1,875', netAmount: '₹ 14,375', invoiceDate: '25-Oct-2024', status: 'Generated' },
  { id: '3', invoiceNo: 'INV-2024-003', customerName: 'MedPlus Store', productCount: 30, taxableAmount: '₹ 1,20,000', gstRate: '18%', gstAmount: '₹ 21,600', netAmount: '₹ 1,41,600', invoiceDate: '26-Oct-2024', status: 'Draft' },
  { id: '4', invoiceNo: 'INV-2024-004', customerName: 'City Clinic', productCount: 3, taxableAmount: '₹ 3,400', gstRate: '5%', gstAmount: '₹ 170', netAmount: '₹ 3,570', invoiceDate: '27-Oct-2024', status: 'Cancelled' },
];

interface GstSummaryItem {
  id: string;
  slab: string;
  productsCount: number;
  billingValue: string;
  taxCollected: string;
}

const mockGstSummary: GstSummaryItem[] = [
  { id: '1', slab: '0% (Exempt)', productsCount: 45, billingValue: '₹ 1.2 L', taxCollected: '₹ 0' },
  { id: '2', slab: '5%', productsCount: 120, billingValue: '₹ 4.5 L', taxCollected: '₹ 22.5 K' },
  { id: '3', slab: '12%', productsCount: 340, billingValue: '₹ 12.8 L', taxCollected: '₹ 1.53 L' },
  { id: '4', slab: '18%', productsCount: 210, billingValue: '₹ 8.4 L', taxCollected: '₹ 1.51 L' },
  { id: '5', slab: '28%', productsCount: 15, billingValue: '₹ 1.5 L', taxCollected: '₹ 42.0 K' },
];

interface ProductRateItem {
  id: string;
  productCode: string;
  productName: string;
  mrp: string;
  ptr: string;
  gstRate: string;
  billingRate: string;
  effectiveRate: string;
}

const mockProductRates: ProductRateItem[] = [
  { id: '1', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', mrp: '₹ 150.00', ptr: '₹ 110.00', gstRate: '12%', billingRate: '₹ 115.00', effectiveRate: '₹ 128.80' },
  { id: '2', productCode: 'PRD-002', productName: 'Paracetamol 650mg', mrp: '₹ 60.00', ptr: '₹ 45.00', gstRate: '12%', billingRate: '₹ 48.00', effectiveRate: '₹ 53.76' },
  { id: '3', productCode: 'PRD-003', productName: 'Vitamin C 1000mg', mrp: '₹ 250.00', ptr: '₹ 180.00', gstRate: '18%', billingRate: '₹ 190.00', effectiveRate: '₹ 224.20' },
];

export default function MultiRateBilling() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const invoiceColumns: Column<InvoiceItem>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'productCount', label: 'Product Count', render: (row) => <span className="font-mono text-slate-700">{row.productCount}</span> },
    { key: 'taxableAmount', label: 'Taxable Amount' },
    { key: 'gstRate', label: 'GST Rate', render: (row) => <span className="text-slate-600">{row.gstRate}</span> },
    { key: 'gstAmount', label: 'GST Amount' },
    { key: 'netAmount', label: 'Net Amount', render: (row) => <span className="font-bold text-slate-800">{row.netAmount}</span> },
    { key: 'invoiceDate', label: 'Invoice Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        switch (row.status) {
          case 'Approved':
            variant = 'success';
            break;
          case 'Generated':
            variant = 'info';
            break;
          case 'Draft':
            variant = 'warning';
            break;
          case 'Cancelled':
            variant = 'danger';
            break;
        }
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const gstSummaryColumns: Column<GstSummaryItem>[] = [
    { key: 'slab', label: 'GST Slab', render: (row) => <span className="font-semibold text-slate-900">{row.slab}</span> },
    { key: 'productsCount', label: 'Products Count', render: (row) => <span className="font-mono text-slate-700">{row.productsCount}</span> },
    { key: 'billingValue', label: 'Billing Value' },
    { key: 'taxCollected', label: 'Tax Collected', render: (row) => <span className="font-bold text-slate-800">{row.taxCollected}</span> },
  ];

  const productRateColumns: Column<ProductRateItem>[] = [
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-mono text-slate-700">{row.productCode}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'mrp', label: 'MRP' },
    { key: 'ptr', label: 'PTR' },
    { key: 'gstRate', label: 'GST Rate', render: (row) => <span className="font-semibold text-primary">{row.gstRate}</span> },
    { key: 'billingRate', label: 'Billing Rate' },
    { key: 'effectiveRate', label: 'Effective Rate', render: (row) => <span className="font-bold text-slate-800">{row.effectiveRate}</span> },
  ];

  const filteredInvoices = mockInvoices.filter((item) => {
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
                        item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Multi Rate Billing"
        subtitle="Manage invoices containing products with multiple GST slabs, pricing rates, and billing structures."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Invoices"
          value="1,248"
          subtitle="This Month"
          icon={<Receipt className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Total Billing Amount"
          value="₹ 4.5 Cr"
          subtitle="Overall Revenue"
          icon={<FileText className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Average Invoice Value"
          value="₹ 36,000"
          subtitle="Per Invoice"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Active GST Rates"
          value="4 Slabs"
          subtitle="Multiple variants"
          icon={<Layers className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      {/* Analytics Section (Demo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <PieChart className="w-8 h-8 text-primary mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Billing by GST Slab</h3>
          <p className="text-xs text-slate-500 text-center">Visualizes tax distribution across 0%, 5%, 12%, 18%, 28%</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <TrendingUp className="w-8 h-8 text-emerald-500 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Revenue by Tax Rate</h3>
          <p className="text-xs text-slate-500 text-center">Comparison of revenue generating tax brackets</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <FileSpreadsheet className="w-8 h-8 text-indigo-500 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Invoice Distribution</h3>
          <p className="text-xs text-slate-500 text-center">Multi-rate vs single-rate invoice breakdown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* GST Rate Summary Table */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">GST Rate Summary</h2>
          <TableCard>
            <DataTable
              columns={gstSummaryColumns}
              data={mockGstSummary}
              emptyMessage="No summary data."
            />
          </TableCard>
        </div>

        {/* Product Rate Table */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Rates Structure</h2>
          <TableCard>
            <DataTable
              columns={productRateColumns}
              data={mockProductRates}
              emptyMessage="No product rates found."
            />
          </TableCard>
        </div>
      </div>

      {/* Main Invoice Table */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Multi Rate Invoices</h2>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Draft', value: 'Draft' },
            { label: 'Generated', value: 'Generated' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="Invoice Status"
        />
        {/* Additional filters like Date Range and GST Rate could be added here */}
      </FilterBar>

      <TableCard>
        <DataTable
          columns={invoiceColumns}
          data={filteredInvoices}
          emptyMessage="No multi-rate invoices found."
        />
      </TableCard>
    </div>
  );
}
