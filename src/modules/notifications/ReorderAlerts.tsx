// import { useState } from 'react';
// import { ShoppingCart, TrendingDown } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface ReorderAlert {
//   id: string;
//   productName: string;
//   currentStock: number;
//   reorderLevel: number;
//   supplier: string;
//   status: 'Critical' | 'Low Stock';
// }

// const mockData: ReorderAlert[] = [
//   { id: '1', productName: 'Amoxicillin 250mg', currentStock: 150, reorderLevel: 500, supplier: 'Sun Pharma', status: 'Critical' },
//   { id: '2', productName: 'Cetirizine 10mg', currentStock: 450, reorderLevel: 600, supplier: 'Cipla Ltd.', status: 'Low Stock' },
//   { id: '3', productName: 'Ibuprofen 400mg', currentStock: 200, reorderLevel: 300, supplier: 'Abbott Healthcare', status: 'Low Stock' },
// ];

// export default function ReorderAlerts() {
//   const [search, setSearch] = useState('');

//   const columns: Column<ReorderAlert>[] = [
//     { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
//     { key: 'currentStock', label: 'Current Stock', render: (row) => <span className="font-bold text-rose-600">{row.currentStock}</span> },
//     { key: 'reorderLevel', label: 'Min. Reorder Level', render: (row) => <span className="text-slate-600">{row.reorderLevel}</span> },
//     { key: 'supplier', label: 'Preferred Supplier' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Critical' ? 'danger' : 'warning';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><ShoppingCart className="w-4 h-4 mr-1" /> Generate PO</ActionButton>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     return item.productName.toLowerCase().includes(search.toLowerCase());
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Auto Reorder Alerts"
//         subtitle="Products that have fallen below their minimum stock threshold."
//       />

//       <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
//         <TrendingDown className="w-5 h-5 text-rose-600 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-semibold text-rose-800">Critical Inventory Shortage</h3>
//           <p className="text-sm text-rose-700 mt-1">1 item is critically below reorder levels. Immediate procurement is advised to prevent stockouts.</p>
//         </div>
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="Inventory is at optimal levels."
//         />
//       </TableCard>
//     </div>
//   );
// }



//////////////////////////////////////////////////////////////////

import { useState } from 'react';
import { ShoppingCart, TrendingDown, AlertTriangle, Truck, PackageSearch } from 'lucide-react';
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

interface ReorderAlert {
  id: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  supplier: string;
  status: 'Critical' | 'Low Stock';
}

const mockData: ReorderAlert[] = [
  { id: '1', productName: 'Amoxicillin 250mg', currentStock: 150, reorderLevel: 500, supplier: 'Sun Pharma', status: 'Critical' },
  { id: '2', productName: 'Cetirizine 10mg', currentStock: 450, reorderLevel: 600, supplier: 'Cipla Ltd.', status: 'Low Stock' },
  { id: '3', productName: 'Ibuprofen 400mg', currentStock: 200, reorderLevel: 300, supplier: 'Abbott Healthcare', status: 'Low Stock' },
];

export default function ReorderAlerts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<ReorderAlert>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'currentStock', label: 'Current Stock', render: (row) => <span className="font-bold text-rose-600">{row.currentStock}</span> },
    { key: 'reorderLevel', label: 'Min. Reorder Level', render: (row) => <span className="text-slate-600">{row.reorderLevel}</span> },
    { key: 'supplier', label: 'Preferred Supplier' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Critical' ? 'danger' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><ShoppingCart className="w-4 h-4 mr-1" /> Generate PO</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const criticalCount = mockData.filter(m => m.status === 'Critical').length;
  const lowStockCount = mockData.filter(m => m.status === 'Low Stock').length;
  const totalAlerts = mockData.length;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Auto Reorder Alerts"
        subtitle="Products that have fallen below their minimum stock threshold."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Critical Shortages"
          value={criticalCount.toString()}
          subtitle="Immediate PO required"
          icon={<TrendingDown className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Low Stock Alerts"
          value={lowStockCount.toString()}
          subtitle="Approaching reorder level"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Total Alerts"
          value={totalAlerts.toString()}
          subtitle="Products needing attention"
          icon={<PackageSearch className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Pending POs"
          value="4" 
          subtitle="Awaiting supplier delivery"
          icon={<Truck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <TrendingDown className="w-5 h-5 text-rose-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-rose-800">Critical Inventory Shortage</h3>
          {/* 🛡️ Enterprise Feature: Smart Grammar Logic */}
          <p className="text-sm text-rose-700 mt-1">
            {criticalCount} {criticalCount === 1 ? 'item is' : 'items are'} critically below reorder levels. Immediate procurement is advised to prevent stockouts.
          </p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Critical', value: 'Critical' },
            { label: 'Low Stock', value: 'Low Stock' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="Inventory is at optimal levels."
        />
      </TableCard>
    </div>
  );
}