// import { useState } from 'react';
// import { AlertTriangle, ArchiveX } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface ExpiryAlert {
//   id: string;
//   productName: string;
//   batchNo: string;
//   expiryDate: string;
//   daysToExpiry: number;
//   stockQty: number;
//   status: 'Expired' | 'Near Expiry' | 'Safe';
// }

// const mockData: ExpiryAlert[] = [
//   { id: '1', productName: 'Paracetamol 500mg', batchNo: 'B-1024', expiryDate: '15-Nov-2026', daysToExpiry: 12, stockQty: 500, status: 'Near Expiry' },
//   { id: '2', productName: 'Azithromycin 250mg', batchNo: 'AZ-405', expiryDate: '01-Nov-2026', daysToExpiry: -2, stockQty: 150, status: 'Expired' },
//   { id: '3', productName: 'Vitamin C Syrup', batchNo: 'VC-88', expiryDate: '30-Dec-2026', daysToExpiry: 57, stockQty: 1200, status: 'Safe' },
// ];

// export default function ExpiryAlerts() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<ExpiryAlert>[] = [
//     { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
//     { key: 'batchNo', label: 'Batch No.' },
//     { key: 'expiryDate', label: 'Expiry Date' },
//     { key: 'daysToExpiry', label: 'Days Remaining', render: (row) => <span className={row.daysToExpiry < 0 ? 'text-rose-600 font-bold' : row.daysToExpiry < 30 ? 'text-amber-600 font-bold' : 'text-slate-600'}>{row.daysToExpiry}</span> },
//     { key: 'stockQty', label: 'Stock Qty' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Expired' ? 'danger' : row.status === 'Near Expiry' ? 'warning' : 'success';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: (row) => row.status === 'Expired' ? <ActionButton variant="ghost" className="text-rose-600 text-xs px-2 py-1"><ArchiveX className="w-4 h-4 mr-1" /> Move to Dead Stock</ActionButton> : <span className="text-slate-300">-</span>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Expiry Alerts"
//         subtitle="Track batches nearing expiry and manage expired inventory."
//       />

//       <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
//         <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-semibold text-amber-800">Action Required</h3>
//           <p className="text-sm text-amber-700 mt-1">There are 2 batches expiring in the next 30 days. Consider initiating vendor returns.</p>
//         </div>
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Expired', value: 'Expired' },
//             { label: 'Near Expiry (0-90 days)', value: 'Near Expiry' },
//             { label: 'Safe (>90 days)', value: 'Safe' },
//           ]}
//           placeholder="All Statuses"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No expiry alerts."
//         />
//       </TableCard>
//     </div>
//   );
// }


////////////////////////////////////////////////////////////////

import { useState } from 'react';
import { AlertTriangle, ArchiveX, CheckCircle2, Package } from 'lucide-react';
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

interface ExpiryAlert {
  id: string;
  productName: string;
  batchNo: string;
  warehouse: string;
  expiryDate: string;
  daysToExpiry: number;
  stockQty: number;
  status: 'Expired' | 'Near Expiry' | 'Safe';
}

const mockData: ExpiryAlert[] = [
  { id: '1', productName: 'Paracetamol 500mg', batchNo: 'B-1024', warehouse: 'Main Warehouse', expiryDate: '15-Nov-2026', daysToExpiry: -2, stockQty: 150, status: 'Expired' },
  { id: '2', productName: 'Azithromycin 250mg', batchNo: 'AZ-405', warehouse: 'Hyderabad Hub', expiryDate: '01-Nov-2026', daysToExpiry: 12, stockQty: 500, status: 'Near Expiry' },
  { id: '3', productName: 'Vitamin C Syrup', batchNo: 'VC-88', warehouse: 'Main Warehouse', expiryDate: '30-Dec-2026', daysToExpiry: 57, stockQty: 1200, status: 'Safe' },
];

export default function ExpiryAlerts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<ExpiryAlert>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'batchNo', label: 'Batch No.' },
    { key: 'warehouse', label: 'Warehouse', render: (row) => <span className="text-slate-600">{row.warehouse}</span> },
    { key: 'expiryDate', label: 'Expiry Date' },
    { 
      key: 'daysToExpiry', 
      label: 'Days Remaining', 
      render: (row) => {
        // 🛡️ Enterprise Feature: Smart formatting for negative days!
        if (row.daysToExpiry < 0) {
          return (
            <span className="text-rose-600 font-bold">
              Expired {Math.abs(row.daysToExpiry)} days ago
            </span>
          );
        }
        return (
          <span className={row.daysToExpiry < 30 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
            {row.daysToExpiry} days
          </span>
        );
      } 
    },
    { key: 'stockQty', label: 'Stock Qty' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Expired' ? 'danger' : row.status === 'Near Expiry' ? 'warning' : 'success';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: (row) => row.status === 'Expired' ? <ActionButton variant="ghost" className="text-rose-600 text-xs px-2 py-1"><ArchiveX className="w-4 h-4 mr-1" /> Move to Dead Stock</ActionButton> : <span className="text-slate-300">-</span>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const expiredCount = mockData.filter(m => m.status === 'Expired').length;
  const nearExpiryCount = mockData.filter(m => m.status === 'Near Expiry').length;
  const safeCount = mockData.filter(m => m.status === 'Safe').length;
  const totalBatches = mockData.length;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Expiry Alerts"
        subtitle="Track batches nearing expiry and manage expired inventory."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Expired Products"
          value={expiredCount.toString()}
          subtitle="Needs immediate removal"
          icon={<ArchiveX className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Near Expiry"
          value={nearExpiryCount.toString()}
          subtitle="Expiring within 30 days"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Safe Products"
          value={safeCount.toString()}
          subtitle="Valid for >30 days"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Total Batches"
          value={totalBatches.toString()}
          subtitle="Across all warehouses"
          icon={<Package className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-800">Action Required</h3>
          <p className="text-sm text-amber-700 mt-1">There are {nearExpiryCount} batches expiring in the next 30 days. Consider initiating vendor returns.</p>
        </div>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Expired', value: 'Expired' },
            { label: 'Near Expiry', value: 'Near Expiry' },
            { label: 'Safe', value: 'Safe' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No expiry alerts."
        />
      </TableCard>
    </div>
  );
}