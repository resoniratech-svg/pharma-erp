import { useState } from 'react';
import { Download, Filter, PackageMinus } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface ReturnEntry {
  id: string;
  returnNo: string;
  customerName: string;
  invoiceNo: string;
  date: string;
  reason: string;
  status: 'Received' | 'Pending Check' | 'Rejected';
}

const mockData: ReturnEntry[] = [
  { id: '1', returnNo: 'SR-26-001', customerName: 'Apollo Pharmacy', invoiceNo: 'INV/26/001', date: '15-Oct-2026', reason: 'Damaged Transit', status: 'Received' },
  { id: '2', returnNo: 'SR-26-002', customerName: 'MedPlus Store', invoiceNo: 'INV/26/002', date: '16-Oct-2026', reason: 'Order Cancelled', status: 'Pending Check' },
];

export default function SalesReturns() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<ReturnEntry>[] = [
    { key: 'returnNo', label: 'Return No', render: (row) => <span className="font-semibold text-slate-900">{row.returnNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'invoiceNo', label: 'Orig. Invoice', render: (row) => <span className="font-medium text-slate-600">{row.invoiceNo}</span> },
    { key: 'reason', label: 'Reason' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Received' ? 'success' : row.status === 'Pending Check' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1">Process</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.returnNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Sales Return"
        subtitle="Manage goods returned due to damage, cancellation, or errors."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
        }
      />

      <div className="bg-white p-4 border border-slate-200 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                  <PackageMinus className="w-5 h-5" />
              </div>
              <div>
                  <h3 className="text-sm font-semibold text-slate-800">Pending Return Checks</h3>
                  <p className="text-xs text-slate-500">12 items require physical QC verification.</p>
              </div>
          </div>
          <ActionButton variant="secondary" className="text-xs">View Pending QC</ActionButton>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search return no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Received', value: 'Received' },
            { label: 'Pending Check', value: 'Pending Check' },
            { label: 'Rejected', value: 'Rejected' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No sales returns found."
        />
      </TableCard>
    </div>
  );
}
