// import { useState } from 'react';
// import { Download, Filter, Receipt, FileText, FileSpreadsheet, PieChart, TrendingUp, Layers } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
//   SummaryCard,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface InvoiceItem {
//   id: string;
//   invoiceNo: string;
//   customerName: string;
//   productCount: number;
//   taxableAmount: string;
//   gstRate: string; // 'Mixed', '12%', '18%', etc.
//   gstAmount: string;
//   netAmount: string;
//   invoiceDate: string;
//   status: 'Draft' | 'Generated' | 'Approved' | 'Cancelled';
// }

// const mockInvoices: InvoiceItem[] = [
//   { id: '1', invoiceNo: 'INV-2024-001', customerName: 'Apollo Pharmacy', productCount: 15, taxableAmount: '₹ 45,000', gstRate: 'Mixed (5%, 12%)', gstAmount: '₹ 4,500', netAmount: '₹ 49,500', invoiceDate: '24-Oct-2024', status: 'Approved' },
//   { id: '2', invoiceNo: 'INV-2024-002', customerName: 'Care Hospitals', productCount: 8, taxableAmount: '₹ 12,500', gstRate: 'Mixed (12%, 18%)', gstAmount: '₹ 1,875', netAmount: '₹ 14,375', invoiceDate: '25-Oct-2024', status: 'Generated' },
//   { id: '3', invoiceNo: 'INV-2024-003', customerName: 'MedPlus Store', productCount: 30, taxableAmount: '₹ 1,20,000', gstRate: '18%', gstAmount: '₹ 21,600', netAmount: '₹ 1,41,600', invoiceDate: '26-Oct-2024', status: 'Draft' },
//   { id: '4', invoiceNo: 'INV-2024-004', customerName: 'City Clinic', productCount: 3, taxableAmount: '₹ 3,400', gstRate: '5%', gstAmount: '₹ 170', netAmount: '₹ 3,570', invoiceDate: '27-Oct-2024', status: 'Cancelled' },
// ];

// interface GstSummaryItem {
//   id: string;
//   slab: string;
//   productsCount: number;
//   billingValue: string;
//   taxCollected: string;
// }

// const mockGstSummary: GstSummaryItem[] = [
//   { id: '1', slab: '0% (Exempt)', productsCount: 45, billingValue: '₹ 1.2 L', taxCollected: '₹ 0' },
//   { id: '2', slab: '5%', productsCount: 120, billingValue: '₹ 4.5 L', taxCollected: '₹ 22.5 K' },
//   { id: '3', slab: '12%', productsCount: 340, billingValue: '₹ 12.8 L', taxCollected: '₹ 1.53 L' },
//   { id: '4', slab: '18%', productsCount: 210, billingValue: '₹ 8.4 L', taxCollected: '₹ 1.51 L' },
//   { id: '5', slab: '28%', productsCount: 15, billingValue: '₹ 1.5 L', taxCollected: '₹ 42.0 K' },
// ];

// interface ProductRateItem {
//   id: string;
//   productCode: string;
//   productName: string;
//   mrp: string;
//   ptr: string;
//   gstRate: string;
//   billingRate: string;
//   effectiveRate: string;
// }

// const mockProductRates: ProductRateItem[] = [
//   { id: '1', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', mrp: '₹ 150.00', ptr: '₹ 110.00', gstRate: '12%', billingRate: '₹ 115.00', effectiveRate: '₹ 128.80' },
//   { id: '2', productCode: 'PRD-002', productName: 'Paracetamol 650mg', mrp: '₹ 60.00', ptr: '₹ 45.00', gstRate: '12%', billingRate: '₹ 48.00', effectiveRate: '₹ 53.76' },
//   { id: '3', productCode: 'PRD-003', productName: 'Vitamin C 1000mg', mrp: '₹ 250.00', ptr: '₹ 180.00', gstRate: '18%', billingRate: '₹ 190.00', effectiveRate: '₹ 224.20' },
// ];

// export default function MultiRateBilling() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const invoiceColumns: Column<InvoiceItem>[] = [
//     { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
//     { key: 'customerName', label: 'Customer Name' },
//     { key: 'productCount', label: 'Product Count', render: (row) => <span className="font-mono text-slate-700">{row.productCount}</span> },
//     { key: 'taxableAmount', label: 'Taxable Amount' },
//     { key: 'gstRate', label: 'GST Rate', render: (row) => <span className="text-slate-600">{row.gstRate}</span> },
//     { key: 'gstAmount', label: 'GST Amount' },
//     { key: 'netAmount', label: 'Net Amount', render: (row) => <span className="font-bold text-slate-800">{row.netAmount}</span> },
//     { key: 'invoiceDate', label: 'Invoice Date' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         let variant: any = 'default';
//         switch (row.status) {
//           case 'Approved':
//             variant = 'success';
//             break;
//           case 'Generated':
//             variant = 'info';
//             break;
//           case 'Draft':
//             variant = 'warning';
//             break;
//           case 'Cancelled':
//             variant = 'danger';
//             break;
//         }
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//   ];

//   const gstSummaryColumns: Column<GstSummaryItem>[] = [
//     { key: 'slab', label: 'GST Slab', render: (row) => <span className="font-semibold text-slate-900">{row.slab}</span> },
//     { key: 'productsCount', label: 'Products Count', render: (row) => <span className="font-mono text-slate-700">{row.productsCount}</span> },
//     { key: 'billingValue', label: 'Billing Value' },
//     { key: 'taxCollected', label: 'Tax Collected', render: (row) => <span className="font-bold text-slate-800">{row.taxCollected}</span> },
//   ];

//   const productRateColumns: Column<ProductRateItem>[] = [
//     { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-mono text-slate-700">{row.productCode}</span> },
//     { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
//     { key: 'mrp', label: 'MRP' },
//     { key: 'ptr', label: 'PTR' },
//     { key: 'gstRate', label: 'GST Rate', render: (row) => <span className="font-semibold text-primary">{row.gstRate}</span> },
//     { key: 'billingRate', label: 'Billing Rate' },
//     { key: 'effectiveRate', label: 'Effective Rate', render: (row) => <span className="font-bold text-slate-800">{row.effectiveRate}</span> },
//   ];

//   const filteredInvoices = mockInvoices.filter((item) => {
//     const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
//                         item.customerName.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Multi Rate Billing"
//         subtitle="Manage invoices containing products with multiple GST slabs, pricing rates, and billing structures."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
//         }
//       />

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Total Invoices"
//           value="1,248"
//           subtitle="This Month"
//           icon={<Receipt className="w-6 h-6" />}
//           colorClass="text-violet-600"
//           bgClass="bg-violet-50"
//         />
//         <SummaryCard
//           title="Total Billing Amount"
//           value="₹ 4.5 Cr"
//           subtitle="Overall Revenue"
//           icon={<FileText className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Average Invoice Value"
//           value="₹ 36,000"
//           subtitle="Per Invoice"
//           icon={<TrendingUp className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//         <SummaryCard
//           title="Active GST Rates"
//           value="4 Slabs"
//           subtitle="Multiple variants"
//           icon={<Layers className="w-6 h-6" />}
//           colorClass="text-amber-600"
//           bgClass="bg-amber-50"
//         />
//       </div>

//       {/* Analytics Section (Demo) */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
//           <PieChart className="w-8 h-8 text-primary mb-3 opacity-80" />
//           <h3 className="text-sm font-semibold text-slate-800 mb-1">Billing by GST Slab</h3>
//           <p className="text-xs text-slate-500 text-center">Visualizes tax distribution across 0%, 5%, 12%, 18%, 28%</p>
//         </div>
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
//           <TrendingUp className="w-8 h-8 text-emerald-500 mb-3 opacity-80" />
//           <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Revenue by Tax Rate</h3>
//           <p className="text-xs text-slate-500 text-center">Comparison of revenue generating tax brackets</p>
//         </div>
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
//           <FileSpreadsheet className="w-8 h-8 text-indigo-500 mb-3 opacity-80" />
//           <h3 className="text-sm font-semibold text-slate-800 mb-1">Invoice Distribution</h3>
//           <p className="text-xs text-slate-500 text-center">Multi-rate vs single-rate invoice breakdown</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
//         {/* GST Rate Summary Table */}
//         <div className="lg:col-span-1">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">GST Rate Summary</h2>
//           <TableCard>
//             <DataTable
//               columns={gstSummaryColumns}
//               data={mockGstSummary}
//               emptyMessage="No summary data."
//             />
//           </TableCard>
//         </div>

//         {/* Product Rate Table */}
//         <div className="lg:col-span-2">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Rates Structure</h2>
//           <TableCard>
//             <DataTable
//               columns={productRateColumns}
//               data={mockProductRates}
//               emptyMessage="No product rates found."
//             />
//           </TableCard>
//         </div>
//       </div>

//       {/* Main Invoice Table */}
//       <h2 className="text-lg font-semibold text-slate-900 mb-4">Multi Rate Invoices</h2>
//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice no or customer..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Draft', value: 'Draft' },
//             { label: 'Generated', value: 'Generated' },
//             { label: 'Approved', value: 'Approved' },
//             { label: 'Cancelled', value: 'Cancelled' },
//           ]}
//           placeholder="Invoice Status"
//         />
//         {/* Additional filters like Date Range and GST Rate could be added here */}
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={invoiceColumns}
//           data={filteredInvoices}
//           emptyMessage="No multi-rate invoices found."
//         />
//       </TableCard>
//     </div>
//   );
// }

///////////////////////////////////////////////////////////////

// import { useState } from 'react';
// import { Download, Filter, Receipt, FileText, FileSpreadsheet, PieChart, TrendingUp, Layers } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
//   SummaryCard,
// } from './components/shared';
// import { type Column } from './components/shared';
// 
// interface InvoiceItem {
//   id: string;
//   invoiceNo: string;
//   customerName: string;
//   productCount: number;
//   taxableAmount: string;
//   gstRate: string; // 'Mixed', '12%', '18%', etc.
//   gstAmount: string;
//   netAmount: string;
//   invoiceDate: string;
//   status: 'Draft' | 'Generated' | 'Approved' | 'Cancelled';
// }
// 
// const mockInvoices: InvoiceItem[] = [
//   { id: '1', invoiceNo: 'INV-2024-001', customerName: 'Apollo Pharmacy', productCount: 15, taxableAmount: '₹ 45,000', gstRate: 'Mixed (5%, 12%)', gstAmount: '₹ 4,500', netAmount: '₹ 49,500', invoiceDate: '24-Oct-2024', status: 'Approved' },
//   { id: '2', invoiceNo: 'INV-2024-002', customerName: 'Care Hospitals', productCount: 8, taxableAmount: '₹ 12,500', gstRate: 'Mixed (12%, 18%)', gstAmount: '₹ 1,875', netAmount: '₹ 14,375', invoiceDate: '25-Oct-2024', status: 'Generated' },
//   { id: '3', invoiceNo: 'INV-2024-003', customerName: 'MedPlus Store', productCount: 30, taxableAmount: '₹ 1,20,000', gstRate: '18%', gstAmount: '₹ 21,600', netAmount: '₹ 1,41,600', invoiceDate: '26-Oct-2024', status: 'Draft' },
//   { id: '4', invoiceNo: 'INV-2024-004', customerName: 'City Clinic', productCount: 3, taxableAmount: '₹ 3,400', gstRate: '5%', gstAmount: '₹ 170', netAmount: '₹ 3,570', invoiceDate: '27-Oct-2024', status: 'Cancelled' },
// ];
// 
// interface GstSummaryItem {
//   id: string;
//   slab: string;
//   productsCount: number;
//   billingValue: string;
//   taxCollected: string;
// }
// 
// const mockGstSummary: GstSummaryItem[] = [
//   { id: '1', slab: '0% (Exempt)', productsCount: 45, billingValue: '₹ 1.2 L', taxCollected: '₹ 0' },
//   { id: '2', slab: '5%', productsCount: 120, billingValue: '₹ 4.5 L', taxCollected: '₹ 22.5 K' },
//   { id: '3', slab: '12%', productsCount: 340, billingValue: '₹ 12.8 L', taxCollected: '₹ 1.53 L' },
//   { id: '4', slab: '18%', productsCount: 210, billingValue: '₹ 8.4 L', taxCollected: '₹ 1.51 L' },
//   { id: '5', slab: '28%', productsCount: 15, billingValue: '₹ 1.5 L', taxCollected: '₹ 42.0 K' },
// ];
// 
// interface ProductRateItem {
//   id: string;
//   productCode: string;
//   productName: string;
//   mrp: string;
//   ptr: string;
//   gstRate: string;
//   billingRate: string;
//   effectiveRate: string;
// }
// 
// const mockProductRates: ProductRateItem[] = [
//   { id: '1', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', mrp: '₹ 150.00', ptr: '₹ 110.00', gstRate: '12%', billingRate: '₹ 115.00', effectiveRate: '₹ 128.80' },
//   { id: '2', productCode: 'PRD-002', productName: 'Paracetamol 650mg', mrp: '₹ 60.00', ptr: '₹ 45.00', gstRate: '12%', billingRate: '₹ 48.00', effectiveRate: '₹ 53.76' },
//   { id: '3', productCode: 'PRD-003', productName: 'Vitamin C 1000mg', mrp: '₹ 250.00', ptr: '₹ 180.00', gstRate: '18%', billingRate: '₹ 190.00', effectiveRate: '₹ 224.20' },
// ];
// 
// export default function MultiRateBilling() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
// 
//   const invoiceColumns: Column<InvoiceItem>[] = [
//     { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
//     { key: 'customerName', label: 'Customer Name' },
//     { key: 'productCount', label: 'Product Count', render: (row) => <span className="font-mono text-slate-700">{row.productCount}</span> },
//     { key: 'taxableAmount', label: 'Taxable Amount' },
//     { key: 'gstRate', label: 'GST Rate', render: (row) => <span className="text-slate-600">{row.gstRate}</span> },
//     { key: 'gstAmount', label: 'GST Amount' },
//     { key: 'netAmount', label: 'Net Amount', render: (row) => <span className="font-bold text-slate-800">{row.netAmount}</span> },
//     { key: 'invoiceDate', label: 'Invoice Date' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         let variant: any = 'default';
//         switch (row.status) {
//           case 'Approved':
//             variant = 'success';
//             break;
//           case 'Generated':
//             variant = 'info';
//             break;
//           case 'Draft':
//             variant = 'warning';
//             break;
//           case 'Cancelled':
//             variant = 'danger';
//             break;
//         }
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//   ];
// 
//   const gstSummaryColumns: Column<GstSummaryItem>[] = [
//     { key: 'slab', label: 'GST Slab', render: (row) => <span className="font-semibold text-slate-900">{row.slab}</span> },
//     { key: 'productsCount', label: 'Products Count', render: (row) => <span className="font-mono text-slate-700">{row.productsCount}</span> },
//     { key: 'billingValue', label: 'Billing Value' },
//     { key: 'taxCollected', label: 'Tax Collected', render: (row) => <span className="font-bold text-slate-800">{row.taxCollected}</span> },
//   ];
// 
//   const productRateColumns: Column<ProductRateItem>[] = [
//     { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-mono text-slate-700">{row.productCode}</span> },
//     { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
//     { key: 'mrp', label: 'MRP' },
//     { key: 'ptr', label: 'PTR' },
//     { key: 'gstRate', label: 'GST Rate', render: (row) => <span className="font-semibold text-primary">{row.gstRate}</span> },
//     { key: 'billingRate', label: 'Billing Rate' },
//     { key: 'effectiveRate', label: 'Effective Rate', render: (row) => <span className="font-bold text-slate-800">{row.effectiveRate}</span> },
//   ];
// 
//   const filteredInvoices = mockInvoices.filter((item) => {
//     const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
//                         item.customerName.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });
// 
//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Multi Rate Billing"
//         subtitle="Manage invoices containing products with multiple GST slabs, pricing rates, and billing structures."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
//         }
//       />
// 
//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Total Invoices"
//           value="1,248"
//           subtitle="This Month"
//           icon={<Receipt className="w-6 h-6" />}
//           colorClass="text-violet-600"
//           bgClass="bg-violet-50"
//         />
//         <SummaryCard
//           title="Total Billing Amount"
//           value="₹ 4.5 Cr"
//           subtitle="Overall Revenue"
//           icon={<FileText className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Average Invoice Value"
//           value="₹ 36,000"
//           subtitle="Per Invoice"
//           icon={<TrendingUp className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//         <SummaryCard
//           title="Active GST Rates"
//           value="4 Slabs"
//           subtitle="Multiple variants"
//           icon={<Layers className="w-6 h-6" />}
//           colorClass="text-amber-600"
//           bgClass="bg-amber-50"
//         />
//       </div>
// 
//       {/* Analytics Section (Demo) */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
//           <PieChart className="w-8 h-8 text-primary mb-3 opacity-80" />
//           <h3 className="text-sm font-semibold text-slate-800 mb-1">Billing by GST Slab</h3>
//           <p className="text-xs text-slate-500 text-center">Visualizes tax distribution across 0%, 5%, 12%, 18%, 28%</p>
//         </div>
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
//           <TrendingUp className="w-8 h-8 text-emerald-500 mb-3 opacity-80" />
//           <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Revenue by Tax Rate</h3>
//           <p className="text-xs text-slate-500 text-center">Comparison of revenue generating tax brackets</p>
//         </div>
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
//           <FileSpreadsheet className="w-8 h-8 text-indigo-500 mb-3 opacity-80" />
//           <h3 className="text-sm font-semibold text-slate-800 mb-1">Invoice Distribution</h3>
//           <p className="text-xs text-slate-500 text-center">Multi-rate vs single-rate invoice breakdown</p>
//         </div>
//       </div>
// 
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
//         {/* GST Rate Summary Table */}
//         <div className="lg:col-span-1">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">GST Rate Summary</h2>
//           <TableCard>
//             <DataTable
//               columns={gstSummaryColumns}
//               data={mockGstSummary}
//               emptyMessage="No summary data."
//             />
//           </TableCard>
//         </div>
// 
//         {/* Product Rate Table */}
//         <div className="lg:col-span-2">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Rates Structure</h2>
//           <TableCard>
//             <DataTable
//               columns={productRateColumns}
//               data={mockProductRates}
//               emptyMessage="No product rates found."
//             />
//           </TableCard>
//         </div>
//       </div>
// 
//       {/* Main Invoice Table */}
//       <h2 className="text-lg font-semibold text-slate-900 mb-4">Multi Rate Invoices</h2>
//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice no or customer..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Draft', value: 'Draft' },
//             { label: 'Generated', value: 'Generated' },
//             { label: 'Approved', value: 'Approved' },
//             { label: 'Cancelled', value: 'Cancelled' },
//           ]}
//           placeholder="Invoice Status"
//         />
//         {/* Additional filters like Date Range and GST Rate could be added here */}
//       </FilterBar>
// 
//       <TableCard>
//         <DataTable
//           columns={invoiceColumns}
//           data={filteredInvoices}
//           emptyMessage="No multi-rate invoices found."
//         />
//       </TableCard>
//     </div>
//   );
// }
// 
///////////////////////////////////////////////////////////////
import { useState, useEffect } from 'react';
import { Download, Filter, Receipt, FileText, FileSpreadsheet, TrendingUp, Layers, CheckCircle, AlertCircle } from 'lucide-react';
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
import { ExportService } from '../../services/exportService';
import { batchService } from '../../services/batchService';
import { billingService } from '../../services/billingService';

// Interfaces for our tables
interface InvoiceItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  productCount: number;
  taxableAmount: number;
  gstRate: string;
  gstAmount: number;
  netAmount: number;
  invoiceDate: string;
  status: string;
}

interface GstSummaryItem {
  id: string;
  slab: string;
  productsCount: number;
  billingValue: number;
  cgst: number;
  sgst: number;
  taxCollected: number;
}

interface ProductRateItem {
  id: string;
  productCode: string;
  productName: string;
  mrp: number;
  ptr: number;
  gstRate: string;
  billingRate: number;
  effectiveRate: number;
  availableStock: number;
  batchCount: number;
}

export default function MultiRateBilling() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Dynamic Data States
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [gstSummary, setGstSummary] = useState<GstSummaryItem[]>([]);
  const [productRates, setProductRates] = useState<ProductRateItem[]>([]);
  
  const [kpi, setKpi] = useState({ 
    totalInvoices: 0, 
    totalBilling: 0, 
    avgInvoice: 0, 
    activeSlabs: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    highestRevenueSlab: 'N/A'
  });
 
  // Format Currency Helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const savedInvoices = billingService.getInvoices();
    
    // 1. Dynamic Product Master integration (Removes duplicate mock logic)
    const storedProducts = JSON.parse(localStorage.getItem('product_master') || '[]');
    const PRODUCTS = storedProducts.length > 0 ? storedProducts : [
      { id: 'P001', name: 'Paracetamol 500mg', gst: 12, mrp: 20 },
      { id: 'P002', name: 'Azithromycin 250mg', gst: 12, mrp: 55 },
      { id: 'P003', name: 'Cough Syrup 100ml', gst: 5, mrp: 45 },
    ];

    const savedBatches = batchService.getAll();
    const inventoryMap: Record<string, { batchNo: string; expiry: string; stock: number; ptr: number; mrp?: number }[]> = {};
    
    savedBatches.forEach(b => {
      const matchProduct = PRODUCTS.find((p: any) => p.code === b.productCode);
      const prodId = matchProduct ? matchProduct.id : b.productCode;
      
      if (!inventoryMap[prodId]) {
        inventoryMap[prodId] = [];
      }
      inventoryMap[prodId].push({
        batchNo: b.batchNo,
        expiry: b.expDate,
        stock: b.availableQty,
        ptr: Number(b.ptr) || 0,
        mrp: Number(b.mrp) || 0
      });
    });

    // 2. Process all analytical views (Clean architecture)
    processInvoices(savedInvoices);
    processKPIs(savedInvoices);
    processGstSummary(savedInvoices);
    processProductRates(PRODUCTS, inventoryMap);
  };

  const processInvoices = (savedInvoices: any[]) => {
    const processed: InvoiceItem[] = savedInvoices.map((inv: any) => {
      const uniqueRates = Array.from(new Set(inv.items.map((i: any) => i.gstPercent)));
      const gstRateStr = uniqueRates.length === 1 
        ? `${uniqueRates[0]}%` 
        : `Mixed (${uniqueRates.sort().map((r: any) => `${r}%`).join(', ')})`;

      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        customerName: inv.customerName,
        productCount: inv.items.reduce((sum: number, i: any) => sum + i.qty, 0),
        taxableAmount: inv.subTotal,
        gstRate: gstRateStr,
        gstAmount: inv.cgstTotal + inv.sgstTotal,
        netAmount: inv.grandTotal,
        invoiceDate: inv.date,
        status: inv.status
      };
    });
    setInvoices(processed);
  };

  const processKPIs = (savedInvoices: any[]) => {
    const totalBilling = savedInvoices.reduce((sum: number, inv: any) => sum + inv.grandTotal, 0);
    const allSlabs = new Set();
    
    let paid = 0;
    let unpaid = 0;

    savedInvoices.forEach((inv: any) => {
      inv.items.forEach((item: any) => allSlabs.add(item.gstPercent));
      if (inv.status === 'Paid') paid += inv.grandTotal;
      if (inv.status === 'Unpaid') unpaid += inv.grandTotal;
    });

    setKpi(prev => ({
      ...prev,
      totalInvoices: savedInvoices.length,
      totalBilling,
      avgInvoice: savedInvoices.length > 0 ? totalBilling / savedInvoices.length : 0,
      activeSlabs: allSlabs.size,
      totalPaid: paid,
      totalUnpaid: unpaid
    }));
  };

  const processGstSummary = (savedInvoices: any[]) => {
    const slabMap: Record<number, { count: number, billing: number, tax: number }> = {};
    savedInvoices.forEach((inv: any) => {
      inv.items.forEach((item: any) => {
        const gst = item.gstPercent || 0;
        if (!slabMap[gst]) slabMap[gst] = { count: 0, billing: 0, tax: 0 };
        slabMap[gst].count += item.qty;
        
        const base = item.qty * item.ptr;
        slabMap[gst].billing += base;
        slabMap[gst].tax += (base * gst) / 100;
      });
    });

    const summaryData: GstSummaryItem[] = Object.keys(slabMap).map(slab => {
      const tax = slabMap[Number(slab)].tax;
      return {
        id: slab,
        slab: `${slab}%`,
        productsCount: slabMap[Number(slab)].count,
        billingValue: slabMap[Number(slab)].billing,
        cgst: tax / 2,
        sgst: tax / 2,
        taxCollected: tax
      };
    }).sort((a, b) => Number(a.id) - Number(b.id)); // Sort by slab %
    
    setGstSummary(summaryData);

    // Dynamic Highest Revenue Slab calculation
    if (summaryData.length > 0) {
      const highest = [...summaryData].sort((a, b) => b.billingValue - a.billingValue)[0];
      setKpi(prev => ({ ...prev, highestRevenueSlab: highest.slab }));
    }
  };

  const processProductRates = (PRODUCTS: any[], inventoryMap: any) => {
    const ratesData: ProductRateItem[] = PRODUCTS.map(prod => {
      const prodBatches = inventoryMap[prod.id] || [];
      const latestPtr = prodBatches.length > 0 ? prodBatches[0].ptr : 100; 
      const mrp = prod.mrp || (latestPtr * 1.3); // Uses real MRP from Product Master if it exists
      const stock = prodBatches.reduce((sum: number, b: any) => sum + b.stock, 0);
      
      return {
        id: prod.id,
        productCode: prod.id || prod.code || 'SYS-GEN',
        productName: prod.name,
        mrp: mrp,
        ptr: latestPtr,
        gstRate: `${prod.gst}%`,
        billingRate: latestPtr,
        effectiveRate: latestPtr + ((latestPtr * prod.gst) / 100),
        availableStock: stock,
        batchCount: prodBatches.length
      };
    });
    setProductRates(ratesData);
  };

  // -----------------------------------------------------------
  // EXPORTS
  // -----------------------------------------------------------
  const getExportData = () => {
    return {
      filename: `Multi_Rate_Analytics_${new Date().toISOString().split('T')[0]}`,
      data: invoices,
      columns: [
        { header: 'Invoice No', dataKey: 'invoiceNo' },
        { header: 'Customer', dataKey: 'customerName' },
        { header: 'GST Rate', dataKey: 'gstRate' },
        { header: 'Taxable', dataKey: 'taxableAmount' },
        { header: 'GST Amount', dataKey: 'gstAmount' },
        { header: 'Net Total', dataKey: 'netAmount' },
        { header: 'Status', dataKey: 'status' }
      ]
    };
  };

  const handleExportPDF = () => {
    if (invoices.length === 0) return alert("No data available to export.");
    const req = getExportData();
    ExportService.exportToPDF({ title: 'Multi-Rate Billing Analytics', ...req });
  };

  const handleExportExcel = () => {
    if (invoices.length === 0) return alert("No data available to export.");
    const req = getExportData();
    if(ExportService.exportToExcel) {
      ExportService.exportToExcel({ title: 'Multi-Rate Billing Analytics', ...req });
    } else {
      alert("Excel Export Service is not fully configured yet!");
    }
  };

  // -----------------------------------------------------------
  // COLUMNS
  // -----------------------------------------------------------
  const invoiceColumns: Column<InvoiceItem>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'productCount', label: 'Total Qty', render: (row) => <span className="font-mono text-slate-700">{row.productCount}</span> },
    { key: 'taxableAmount', label: 'Taxable Amount', render: (row) => <span>{formatCurrency(row.taxableAmount)}</span> },
    { key: 'gstRate', label: 'GST Rate', render: (row) => <span className="text-slate-600 font-medium">{row.gstRate}</span> },
    { key: 'gstAmount', label: 'GST Amount', render: (row) => <span>{formatCurrency(row.gstAmount)}</span> },
    { key: 'netAmount', label: 'Net Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.netAmount)}</span> },
    { key: 'invoiceDate', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.status === 'Paid') variant = 'success';
        if (row.status === 'Unpaid') variant = 'warning';
        if (row.status === 'Draft') variant = 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const gstSummaryColumns: Column<GstSummaryItem>[] = [
    { key: 'slab', label: 'GST Slab', render: (row) => <span className="font-bold text-slate-900">{row.slab}</span> },
    { key: 'productsCount', label: 'Units Sold', render: (row) => <span className="font-mono text-slate-700">{row.productsCount}</span> },
    { key: 'billingValue', label: 'Taxable Value', render: (row) => <span>{formatCurrency(row.billingValue)}</span> },
    { key: 'cgst', label: 'CGST', render: (row) => <span className="text-slate-500">{formatCurrency(row.cgst)}</span> },
    { key: 'sgst', label: 'SGST', render: (row) => <span className="text-slate-500">{formatCurrency(row.sgst)}</span> },
    { key: 'taxCollected', label: 'Total Tax', render: (row) => <span className="font-bold text-violet-700">{formatCurrency(row.taxCollected)}</span> },
  ];

  const productRateColumns: Column<ProductRateItem>[] = [
    { key: 'productCode', label: 'Item Code', render: (row) => <span className="font-mono text-slate-700">{row.productCode}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'availableStock', label: 'Stock', render: (row) => <span className="font-bold text-emerald-600">{row.availableStock}</span> },
    { key: 'batchCount', label: 'Batches', render: (row) => <span className="text-slate-500">{row.batchCount}</span> },
    { key: 'mrp', label: 'MRP', render: (row) => <span>{formatCurrency(row.mrp)}</span> },
    { key: 'ptr', label: 'PTR', render: (row) => <span>{formatCurrency(row.ptr)}</span> },
    { key: 'gstRate', label: 'GST', render: (row) => <span className="font-semibold text-violet-600">{row.gstRate}</span> },
    { key: 'effectiveRate', label: 'Effective Rate', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.effectiveRate)}</span> },
  ];

  const filteredInvoices = invoices.filter((item) => {
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
                        item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Multi Rate Billing Analytics"
        subtitle="Manage and analyze invoices containing products with multiple GST slabs and pricing structures."
        actions={
          <div className="flex gap-2">
            <ActionButton variant="secondary" icon={<FileSpreadsheet className="w-4 h-4" />} onClick={handleExportExcel}>
              Excel
            </ActionButton>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExportPDF}>
              PDF
            </ActionButton>
          </div>
        }
      />

      {/* Advanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <SummaryCard
          title="Total Invoices"
          value={kpi.totalInvoices.toString()}
          subtitle="Generated"
          icon={<Receipt className="w-5 h-5" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Total Billing"
          value={formatCurrency(kpi.totalBilling)}
          subtitle="Overall Revenue"
          icon={<FileText className="w-5 h-5" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Avg Invoice"
          value={formatCurrency(kpi.avgInvoice)}
          subtitle="Per Invoice"
          icon={<TrendingUp className="w-5 h-5" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Total Paid"
          value={formatCurrency(kpi.totalPaid)}
          subtitle="Collected"
          icon={<CheckCircle className="w-5 h-5" />}
          colorClass="text-teal-600"
          bgClass="bg-teal-50"
        />
        <SummaryCard
          title="Total Unpaid"
          value={formatCurrency(kpi.totalUnpaid)}
          subtitle="Outstanding"
          icon={<AlertCircle className="w-5 h-5" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Top Slab"
          value={kpi.highestRevenueSlab}
          subtitle="Highest Revenue"
          icon={<Layers className="w-5 h-5" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* GST Rate Summary Table */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">GST Slab Analytics</h2>
          <TableCard>
            <DataTable
              columns={gstSummaryColumns}
              data={gstSummary}
              emptyMessage="No GST summary data."
            />
          </TableCard>
        </div>

        {/* Product Rate Table */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Tax & Inventory Structure</h2>
          <TableCard>
            <DataTable
              columns={productRateColumns}
              data={productRates}
              emptyMessage="No product rates found."
            />
          </TableCard>
        </div>
      </div>

      {/* Main Invoice Table */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Multi-Rate Invoices History</h2>
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
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Draft', value: 'Draft' }
          ]}
          placeholder="Invoice Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={invoiceColumns}
          data={filteredInvoices}
          emptyMessage="No invoices generated yet. Create one in GST Billing."
        />
      </TableCard>
    </div>
  );
}